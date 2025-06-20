import { storageController } from '../storage/storageController.js';
import { uniqueId } from '../utils/hash.js';
import { objClone, objPathResolve, objPathSet, objTraverse } from '../utils/object.js';
import { getType } from '../utils/type.js';
import { timeNow } from '../utils/unixtime.js';
import config from './config.js';
import data from './data.js';
import { executeMiddleware, registerMiddleware } from './middleware.js';
import { applyQuery } from './query.js';
import { resolveRefs } from './refs.js';
import { applySchema } from './schema.js';

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

  if (!data[collectionName]) data[collectionName] = new Map();

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

    const processedItems = items.map((el) => (schemaHasProps ? applySchema(el, schema) : el));

    objTraverse(schema, ({ key, value }) => {
      if (value.required) {
        for (const item of processedItems) {
          const val = objPathResolve(item, key) || objPathResolve(item, key);
          if (val === undefined || val === null) {
            throw new Error(`"${key}" field is required.`);
          }
        }
      }
    });

    const uniqueKeys = [];
    objTraverse(schema, ({ key, value }) => {
      if (value.unique) uniqueKeys.push(key);
    });

    for (const key of uniqueKeys) {
      const newValues = processedItems
        .map((item) => objPathResolve(item, key))
        .filter((v) => v !== undefined && v !== null);

      for (const val of newValues) {
        const duplicated = applyQuery(data[collectionName], { [key]: val });
        if (duplicated.length > 0) {
          throw new Error(`"${key}" field must be unique.`);
        }
      }

      const valueSet = new Set();
      for (const val of newValues) {
        if (valueSet.has(val)) {
          throw new Error(`"${key}" field must be unique among new items.`);
        }
        valueSet.add(val);
      }
    }

    const results = processedItems
      .filter((el) => Object.keys(el).length > 0)
      .map((el) => {
        const timestamp = timeNow();
        el._id = uniqueId();
        el._version = 1;
        if (config.get('defaultFields')) {
          el._created = timestamp;
          el._updated = timestamp;
        }
        return el;
      });

    if (results.length > 0) {
      for (const el of results) {
        data[collectionName].set(el._id, objClone(el));
      }
      storageController.onInsert(collectionName, results);
    }

    await executeMiddleware('post', collectionName, 'create', results);

    return results;
  };

  const updateItems = async (items, updates, replace) => {
    items = getType(items) === 'array' ? items : [items];

    if (getType(updates) !== 'object') {
      throw new Error('Invalid object type of updates.');
    }

    let changedItems = 0;
    const timestamp = timeNow();
    const operation = replace ? 'replace' : 'update';

    await executeMiddleware('pre', collectionName, operation, items);

    const applyUpdates = schemaHasProps ? applySchema(updates, schema) : updates;

    objTraverse(schema, ({ key, value }) => {
      if (value.unique) {
        const newValues = [];

        for (const el of items) {
          const val = objPathResolve(applyUpdates, key);
          if (val === undefined || val === null) continue;

          const duplicated = applyQuery(data[collectionName], { [key]: val, _id: { $ne: el._id } });
          if (duplicated.length > 0) {
            throw new Error(`"${key}" field must be unique.`);
          }

          newValues.push(val);
        }

        const seen = new Set();
        for (const val of newValues) {
          if (seen.has(val)) {
            throw new Error(`"${key}" field must be unique.`);
          }
          seen.add(val);
        }
      }

      if (value.required) {
        for (const el of items) {
          let val;
          if (replace) {
            val = objPathResolve(applyUpdates, key);
          } else {
            val = objPathResolve(applyUpdates, key);
            if (val === undefined) val = objPathResolve(el, key);
          }

          if (getType(updates.$unset) === 'object' && updates.$unset[key]) {
            throw new Error(`"${key}" field is required and cannot be unset.`);
          }

          if (val === undefined || val === null) {
            throw new Error(`"${key}" field is required.`);
          }
        }
      }
    });

    const results = items.map((el) => {
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
          throw new Error('Cannot unset fields in replace operation.');
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

        if (config.get('defaultFields')) {
          el._created ??= timestamp;
          el._updated = timestamp;
        }

        changedItems++;
      }

      return el;
    });

    if (changedItems > 0) {
      for (const el of results) {
        if (data[collectionName].has(el._id)) {
          data[collectionName].set(el._id, objClone(el));
        }
      }

      storageController.onUpdate(collectionName, results);
    }

    await executeMiddleware('post', collectionName, operation, results);

    return results;
  };

  const deleteItems = async (items) => {
    if (items.length > 0) {
      await executeMiddleware('pre', collectionName, 'delete', items);

      for (const el of items) {
        data[collectionName].delete(el._id);
      }

      storageController.onDelete(collectionName, items);

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

  // Helper to wrap public read API with pre/post read middleware
  const withReadMiddleware = async (input, fn) => {
    await executeMiddleware('pre', collectionName, 'read', input);
    const result = await fn();
    await executeMiddleware('post', collectionName, 'read', result);
    return result;
  };

  return {
    // Implement methods:
    // schema, validate
    pre: (method, fn) => registerMiddleware('pre', collectionName, method, fn),
    post: (method, fn) => registerMiddleware('post', collectionName, method, fn),
    find: async (query) => withReadMiddleware(query, () => findItems(query, true, true)),
    findOne: async (query) => withReadMiddleware(query, () => findOne(query, true, true)),
    findById: async (id) => withReadMiddleware({ _id: id }, () => findById(id, true, true)),
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

export default model;
