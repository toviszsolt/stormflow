const { config } = require('./config');
const { registerMiddleware, executeMiddleware } = require('./middleware');
const { applyQuery } = require('./query');
const { resolveRefs } = require('./refs');
const { applySchema } = require('./shema');
const { data, saveDataToFile } = require('./storage');
const { unixTimeStamp, deepClone, generateUniqueId } = require('./utils');

const model = (collectionName, schema = {}) => {
  const schemaHasProps = Object.keys(schema).length > 0;

  collectionName = collectionName.toLowerCase();
  if (!data[collectionName]) data[collectionName] = [];

  const create = async (items) => {
    try {
      items = Array.isArray(items) ? items : [items];

      for (const item of items) {
        await executeMiddleware('pre', collectionName, 'create', item);
      }

      const timestamp = unixTimeStamp();
      const result = items.map((item) => {
        const newItem = schemaHasProps ? applySchema(item, schema) : item;
        const uniqueId = generateUniqueId();

        const updatedItem = {};

        for (const key in newItem) {
          if (newItem.hasOwnProperty(key)) {
            updatedItem[key] = newItem[key];
          }
        }

        return config.defaultFields
          ? {
              ...newItem,
              _id: uniqueId,
              _created: timestamp,
              _updated: timestamp,
              _version: 1,
            }
          : {
              ...newItem,
              _id: uniqueId,
              _version: 1,
            };
      });

      data[collectionName].push(...deepClone(result));
      saveDataToFile(collectionName);

      for (const item of items) {
        await executeMiddleware('post', collectionName, 'create', item);
      }

      return result.length === 1 ? result[0] : result;
    } catch (e) {
      throw e;
    }
  };

  const update = async (query = {}, updates) => {
    try {
      let trulyUpdatedFields = 0;
      const timestamp = unixTimeStamp();
      const itemsToUpdate = find(query);

      await executeMiddleware('pre', collectionName, 'update', updates);
      updates = deepClone(updates);

      itemsToUpdate.forEach((el) => {
        for (const key in updates) {
          if (updates.hasOwnProperty(key)) {
            const fieldToUpdate = updates[key];
            if (schemaHasProps && schema[key] && schema[key].ref) {
              const refCollection = data[schema[key].ref];
              if (refCollection) {
                const refItem = refCollection.find((elRef) => elRef._id === fieldToUpdate);
                if (refItem) {
                  trulyUpdatedFields++;
                  el[key] = { _ref: { collection: schema[key].ref, id: refItem._id } };
                }
              }
            } else {
              const newValue = schemaHasProps
                ? applySchema(fieldToUpdate, schema[key])
                : fieldToUpdate;
              if (el[key] !== newValue) {
                trulyUpdatedFields++;
                el[key] = newValue;
              }
            }
          }
        }

        if (config.defaultFields) {
          el._created ??= timestamp;
          el._updated = timestamp;
        }
        el._version = (el._version || 0) + 1;
      });

      if (trulyUpdatedFields > 0) {
        saveDataToFile(collectionName);
      }

      await executeMiddleware('post', collectionName, 'update', itemsToUpdate);

      return itemsToUpdate;
    } catch (e) {
      throw e;
    }
  };

  const find = (query = {}) => {
    try {
      return applyQuery(data[collectionName], query);
    } catch (e) {
      throw e;
    }
  };

  const findById = (id) => {
    try {
      return data[collectionName].find((el) => el._id === id);
    } catch (e) {
      throw e;
    }
  };

  const findOne = (query = {}) => {
    try {
      return find(query)[0];
    } catch (e) {
      throw e;
    }
  };

  const deleteOne = (query = {}) => {
    try {
      const itemToDelete = findOne(query);
      if (itemToDelete) {
        const index = data[collectionName].indexOf(itemToDelete);
        data[collectionName].splice(index, 1);
      }
      saveDataToFile(collectionName);
      return itemToDelete;
    } catch (e) {
      throw e;
    }
  };

  const deleteMany = (query = {}) => {
    try {
      const itemsToDelete = find(query);
      itemsToDelete.forEach((el) => {
        const index = data[collectionName].indexOf(el);
        data[collectionName].splice(index, 1);
      });
      saveDataToFile(collectionName);
      return itemsToDelete;
    } catch (e) {
      throw e;
    }
  };

  return {
    pre: (method, fn) => registerMiddleware('pre', collectionName, method, fn),
    post: (method, fn) => registerMiddleware('post', collectionName, method, fn),
    create: async (items) => resolveRefs(await create(items)),
    find: async (query = {}) => resolveRefs(await find(query)),
    findById: async (id) => resolveRefs(await findById(id)),
    findOne: async (query = {}) => resolveRefs(await findOne(query)),
    update: async (query = {}, updates) => resolveRefs(await update(query, updates)),
    deleteOne: async (query = {}) => resolveRefs(await deleteOne(query)),
    deleteMany: async (query = {}) => resolveRefs(await deleteMany(query)),
  };
};

module.exports = model;
