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

  if (/^[a-z0-9_-]+$/i.test(collectionName) == false) {
    const msg = 'Collection name must contain only small caps, numbers, hypens or underscores.';
    throw new Error(msg);
  }

  if (collectionName.endsWith('s') === false) {
    const msg = 'Collection name must be plural. For example: users, categories, products.';
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
        const results = await find(query);
        const resultsClone = objClone(results);

        await executeMiddleware('pre', collectionName, 'update', resultsClone);

        resultsClone.forEach((el, i) => {
          let changedFields = 0;

          objTraverse(updates, ({ value, path, isNode }) => {
            if (isNode) return;

            if (['_id', '_version', '_created', '_updated'].includes(path)) {
              const msg = 'Protected fields cannot be updated: _id, _version, _created, _updated';
              throw new Error(msg);
            }

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

          // for (const key in updates) {
          //   if (updates.hasOwnProperty(key)) {
          //     const fieldToUpdate = updates[key];

          //     if (updates.$unset) {
          //       for (const unsetKeys in updates.$unset) {
          //         if (updates.$unset.hasOwnProperty(unsetKeys)) {
          //           const unsetKeyChain = unsetKeys.split('.');
          //           const unsetLastKey = unsetKeyChain.pop();

          //           let currentObj = el;
          //           for (const unsetKey of unsetKeyChain) {
          //             currentObj = currentObj[unsetKey];
          //           }

          //           delete currentObj[unsetLastKey];
          //           trulyUpdatedFields++;
          //         }
          //       }
          //     } else if (schemaHasProps && schema[key] && schema[key].$ref) {
          //       const refCollection = data[schema[key].$ref];
          //       if (refCollection) {
          //         const refItem = refCollection.find((elRef) => elRef._id === fieldToUpdate);
          //         if (refItem) {
          //           trulyUpdatedFields++;
          //           el[key] = { _ref: { collection: schema[key].$ref, id: refItem._id } };
          //         }
          //       }
          //     } else {
          //       const newValue = schemaHasProps ? applySchema(fieldToUpdate, schema[key]) : fieldToUpdate;
          //       if (el[key] !== newValue) {
          //         trulyUpdatedFields++;
          //         el[key] = newValue;
          //       }
          //     }
          //   }
          // }

          if (changedFields) {
            changedItems++;
            el._version = (el._version || 1) + 1;

            if (config.defaultFields) {
              el._created ??= timestamp;
              el._updated = timestamp;
            }

            const { _id, _version, _created, _updated } = el;
            const applyUpdates = schemaHasProps ? applySchema(el, schema) : el;

            results[i] = { ...applyUpdates, _id, _version, _created, _updated };
          }
        });

        if (changedItems > 0) {
          saveDataToFile(collectionName);
        }

        await executeMiddleware('post', collectionName, 'update', objClone(results));

        resolve(resolveRefs(results));
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
