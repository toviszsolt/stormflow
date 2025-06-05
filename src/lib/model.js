const { uniqueId } = require('../utils/hash');
const { objClone, objTraverse, objPathResolve, objPathSet } = require('../utils/object');
const { getType } = require('../utils/type');
const { timeNow } = require('../utils/unixtime');
const { config } = require('./config');
const { registerMiddleware, executeMiddleware } = require('./middleware');
const { applyQuery } = require('./query');
const { resolveRefs } = require('./refs');
const { applySchema } = require('./schema');
const { data, saveDataToFile } = require('./storage');

const model = (collectionName = '', schema = {}) => {
  const schemaHasProps = Object.keys(schema).length > 0;

  if (/^[a-z0-9_-]+$/.test(collectionName) == false) {
    const msg = `Collection name (${collectionName}) must contain only small caps, numbers, hypens or underscores.`;
    throw new Error(msg);
  }

  if (['__proto__', 'prototype', 'constructor'].includes(collectionName)) {
    const msg = `Collection name (${collectionName}) must not be "__proto__", "prototype" or "constructor".`;
    throw new Error(msg);
  }

  if (collectionName.endsWith('s') === false) {
    const msg = `Collection name (${collectionName}) must be plural. For example: users, categories, products.`;
    throw new Error(msg);
  }

  if (!data[collectionName]) data[collectionName] = [];

  const findItems = async (query, withRefs = false, withMiddlewares = false) => {
    if (getType(query) !== 'object') {
      const msg = 'Invalid object type of query.';
      throw new Error(msg);
    }

    if (withMiddlewares) {
      await executeMiddleware('pre', collectionName, 'find', query);
    }

    const preflight = applyQuery(data[collectionName], query);
    const results = withRefs ? resolveRefs(preflight) : preflight;

    if (withMiddlewares) {
      await executeMiddleware('post', collectionName, 'find', results);
    }

    return results;
  };

  const createItems = async (items) => {
    items = getType(items) === 'array' ? items : [items];

    await executeMiddleware('pre', collectionName, 'create', items);

    const results = items
      .map((el) => {
        const newItem = schemaHasProps ? applySchema(el, schema) : el;

        objTraverse(schema, ({ key, value }) => {
          if (value.unique) {
            const val = objPathResolve(newItem, key);
            if (val === undefined || val === null) return;
            const duplicated = applyQuery(data[collectionName], { [key]: val });
            if (duplicated.length > 0) {
              const msg = `"${key}" field must be unique.`;
              throw new Error(msg);
            }
          }
        });

        if (Object.keys(newItem).length > 0) {
          const timestamp = timeNow();
          newItem._id = uniqueId();
          newItem._version = 1;
          if (config.defaultFields) {
            newItem._created = timestamp;
            newItem._updated = timestamp;
          }
          return newItem;
        }
      })
      .filter((el) => el !== undefined);

    if (results.length > 0) {
      data[collectionName].push(...objClone(results));
      saveDataToFile(collectionName);
    }

    await executeMiddleware('post', collectionName, 'create', results);

    return results;
  };

  const updateItems = async (items, updates, replace) => {
    items = getType(items) === 'array' ? items : [items];

    if (getType(updates) !== 'object') {
      const msg = 'Invalid object type of updates.';
      throw new Error(msg);
    }

    let changedItems = 0;
    const timestamp = timeNow();
    const operation = replace ? 'replace' : 'update';

    await executeMiddleware('pre', collectionName, operation, items);

    const results = items.map((el) => {
      const applyUpdates = schemaHasProps ? applySchema(updates, schema) : updates;

      objTraverse(schema, ({ key, value }) => {
        if (value.unique) {
          const val = objPathResolve(applyUpdates, key);
          if (val === undefined || val === null) return;
          const duplicated = applyQuery(data[collectionName], { [key]: val, _id: { $ne: el._id } });
          if (duplicated.length > 0) {
            throw new Error(`"${key}" field must be unique.`);
          }
        }
      });

      let changedFields = 0;

      if (replace) {
        const original = { _id: el._id, _created: el._created };
        const newItem = { ...original, ...applyUpdates };
        el = newItem;
        changedFields = 1;
      } else {
        objTraverse(applyUpdates, ({ value, path, isNode }) => {
          if (isNode || path.startsWith('$')) return;
          if (objPathResolve(el, path) !== value) {
            changedFields++;
            objPathSet(el, path, value);
          }
        });
      }

      if (getType(updates.$unset) === 'object') {
        if (replace) {
          const msg = 'Cannot unset fields in replace operation.';
          throw new Error(msg);
        }

        for (const unsetPath in updates.$unset) {
          if (objPathResolve(el, unsetPath) !== undefined) {
            changedFields++;
            objPathSet(el, unsetPath, undefined);
          }
        }
      }

      if (changedFields) {
        el._version = (el._version || 1) + 1;

        if (config.defaultFields) {
          el._created ??= timestamp;
          el._updated = timestamp;
        }

        changedItems++;
      }

      return el;
    });

    if (changedItems > 0) {
      const mapIds = new Map(data[collectionName].map((el, i) => [el._id, i]));

      results.forEach((el) => {
        const index = mapIds.get(el._id);
        if (index === undefined) return;
        data[collectionName][index] = objClone(el);
      });

      saveDataToFile(collectionName);
    }

    await executeMiddleware('post', collectionName, operation, results);

    return results;
  };

  const deleteItems = async (items) => {
    if (items.length > 0) {
      await executeMiddleware('pre', collectionName, 'delete', items);

      const toDeleteIds = new Set(items.map((el) => el._id));
      data[collectionName] = data[collectionName].filter((el) => !toDeleteIds.has(el._id));
      saveDataToFile(collectionName);

      await executeMiddleware('post', collectionName, 'delete', items);
    }

    return items;
  };

  const insertOne = async (item) => {
    if (getType(item) !== 'object') {
      const msg = 'Invalid object type of item.';
      throw new Error(msg);
    }
    const results = await createItems(item);
    return resolveRefs(results[0]);
  };

  const insertMany = async (items) => {
    if (getType(items) !== 'array') {
      const msg = 'Invalid array type of items.';
      throw new Error(msg);
    }
    const results = await createItems(items);
    return resolveRefs(results);
  };

  const idUpdateReplace = async (id, updates, replace = false) => {
    const item = await findOne({ _id: id });
    const results = await updateItems(item, updates, replace);
    return resolveRefs(results[0]);
  };

  const oneUpdateReplace = async (query, updates, replace = false) => {
    const item = await findOne(query);
    const results = await updateItems(item, updates, replace);
    return resolveRefs(results[0]);
  };

  const manyUpdateReplace = async (query, updates, replace = false) => {
    const items = await findItems(query);
    const results = await updateItems(items, updates, replace);
    return resolveRefs(results);
  };

  const findOne = async (query, withRefs = false, withMiddlewares = false) => {
    const results = await findItems(query, false, withMiddlewares);
    return withRefs ? resolveRefs(results[0]) : results[0];
  };

  const findById = async (id, withRefs = false, withMiddlewares = false) => {
    if (!id || getType(id) !== 'string') {
      const msg = 'Invalid string type of id.';
      throw new Error(msg);
    }
    const results = await findItems({ _id: id }, false, withMiddlewares);
    return withRefs ? resolveRefs(results[0]) : results[0];
  };

  const count = async (query) => {
    const results = await findItems(query);
    return results.length;
  };

  const exists = async (query) => {
    const results = await count(query);
    return results > 0;
  };

  const findByIdAndDelete = async (id) => {
    const items = await findById(id);
    const results = await deleteItems([items]);
    return resolveRefs(results[0]);
  };

  const deleteOne = async (query) => {
    const items = await findOne(query);
    const results = await deleteItems([items]);
    return resolveRefs(results[0]);
  };

  const deleteMany = async (query) => {
    const items = await findItems(query);
    const results = await deleteItems(items);
    return resolveRefs(results);
  };

  return {
    // Implement methods:
    // schema, validate
    pre: (method, fn) => registerMiddleware('pre', collectionName, method, fn),
    post: (method, fn) => registerMiddleware('post', collectionName, method, fn),
    find: async (query) => await findItems(query, true, true),
    findOne: async (query) => await findOne(query, true, true),
    findById: async (query) => await findById(query, true, true),
    findByIdAndReplace: async (id, updates) => await idUpdateReplace(id, updates, true),
    findByIdAndUpdate: async (id, updates) => await idUpdateReplace(id, updates),
    findByIdAndDelete,
    insertOne,
    insertMany,
    updateOne: async (query, updates) => await oneUpdateReplace(query, updates),
    updateMany: async (query, updates) => await manyUpdateReplace(query, updates),
    replaceOne: async (query, updates) => await oneUpdateReplace(query, updates, true),
    replaceMany: async (query, updates) => await manyUpdateReplace(query, updates, true),
    deleteOne,
    deleteMany,
    count,
    exists,
  };
};

module.exports = model;
