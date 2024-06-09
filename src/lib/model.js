const { uniqueId } = require('../utils/hash');
const { objClone, objTraverse, objPathResolve, objPathSet } = require('../utils/object');
const { getType } = require('../utils/type');
const { timeNow } = require('../utils/unixtime');
const { config } = require('./config');
const { registerMiddleware, executeMiddleware } = require('./middleware');
const { applyQuery } = require('./query');
const { resolveRefs } = require('./refs');
const { applySchema } = require('./shema');
const { data, saveDataToFile } = require('./storage');

const model = (collectionName, schema = {}) => {
  const schemaHasProps = Object.keys(schema).length > 0;

  if (/^[a-z0-9_-]+$/.test(collectionName) == false) {
    const msg = `Collection name (${collectionName}) must contain only small caps, numbers, hypens or underscores.`;
    throw new Error(msg);
  }

  if (collectionName.endsWith('s') === false) {
    const msg = `Collection name (${collectionName}) must be plural. For example: users, categories, products.`;
    throw new Error(msg);
  }

  if (!data[collectionName]) data[collectionName] = [];

  const create = (items) => {
    return new Promise(async (resolve, reject) => {
      try {
        items = getType(items) === 'array' ? items : [items];
        await executeMiddleware('pre', collectionName, 'create', items);

        const results = items
          .map((el) => {
            const newItem = schemaHasProps ? applySchema(el, schema) : el;
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

        resolve(results);
      } catch (err) {
        reject(err);
      }
    });
  };

  const update = (query, updates) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (getType(updates) !== 'object') {
          const msg = 'Invalid object type of updates.';
          throw new Error(msg);
        }

        let changedItems = 0;
        const timestamp = timeNow();
        const items = await find(query);

        await executeMiddleware('pre', collectionName, 'update', items);

        items.forEach((el) => {
          let changedFields = 0;
          const index = data[collectionName].indexOf(el);
          const applyUpdates = schemaHasProps ? applySchema(updates, schema) : updates;

          objTraverse(applyUpdates, ({ value, path, isNode }) => {
            if (isNode || path.startsWith('$')) return;

            if (objPathResolve(el, path) !== value) {
              changedFields++;
              objPathSet(el, path, value);
            }
          });

          if (getType(updates.$unset) === 'object') {
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
            data[collectionName][index] = objClone(el);
          }
        });

        if (changedItems > 0) {
          saveDataToFile(collectionName);
        }

        await executeMiddleware('post', collectionName, 'update', items);

        resolve(resolveRefs(items));
      } catch (err) {
        reject(err);
      }
    });
  };

  const deleteItems = (items) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (items.length > 0) {
          for (const el of items) {
            const index = data[collectionName].indexOf(el);
            data[collectionName].splice(index, 1);
          }

          saveDataToFile(collectionName);
        }

        resolve(items);
      } catch (err) {
        reject(err);
      }
    });
  };

  const insertOne = async (item) => {
    if (getType(item) !== 'object') {
      const msg = 'Invalid object type of item.';
      throw new Error(msg);
    }
    const results = await create(item);
    return resolveRefs(results[0]);
  };

  const insertMany = async (items) => {
    if (getType(items) !== 'array') {
      const msg = 'Invalid array type of items.';
      throw new Error(msg);
    }
    const results = await create(items);
    return resolveRefs(results);
  };

  const find = (query, withRefs = false) => {
    return new Promise((resolve, reject) => {
      try {
        if (getType(query) !== 'object') {
          const msg = 'Invalid object type of query.';
          throw new Error(msg);
        }
        const results = applyQuery(data[collectionName], query);
        resolve(withRefs ? resolveRefs(results) : results);
      } catch (err) {
        reject(err);
      }
    });
  };

  const findOne = async (query, withRefs = false) => {
    const results = await find(query);
    return withRefs ? resolveRefs(results[0]) : results[0];
  };

  const findById = async (id, withRefs = false) => {
    if (!id || getType(id) !== 'string') {
      const msg = 'Invalid string type of id.';
      throw new Error(msg);
    }
    const results = await find({ _id: id });
    return withRefs ? resolveRefs(results[0]) : results[0];
  };

  const count = async (query) => {
    const results = await find(query);
    return results.length;
  };

  const exists = async (query) => {
    const results = await count(query);
    return results > 0;
  };

  const deleteOne = async (query) => {
    const itemToDelete = await findOne(query);
    const results = await deleteItems([itemToDelete]);
    return resolveRefs(results[0]);
  };

  const deleteMany = async (query) => {
    const itemsToDelete = await find(query);
    const results = await deleteItems(itemsToDelete);
    return resolveRefs(results);
  };

  const findByIdAndDelete = async (id) => {
    const itemToDelete = await findById(id);
    const results = await deleteItems([itemToDelete]);
    return resolveRefs(results[0]);
  };

  return {
    // Implement methods:
    //
    // insertOne, insertMany
    // updateOne, updateMany, findOneAndUpdate, findByIdAndUpdate
    // replaceOne, findOneAndReplace, findByIdAndReplace
    // deleteOne, deleteMany, findOneAndDelete, findByIdAndDelete
    // count, exists, schema, validate
    pre: (method, fn) => registerMiddleware('pre', collectionName, method, fn),
    post: (method, fn) => registerMiddleware('post', collectionName, method, fn),
    find: async (query) => await find(query, true),
    findOne: async (query) => await findOne(query, true),
    findById: async (query) => await findById(query, true),
    insertOne,
    insertMany,
    update,
    deleteOne,
    deleteMany,
    findByIdAndDelete,
    count,
    exists,
  };
};

module.exports = model;
