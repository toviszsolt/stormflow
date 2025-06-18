import data from '../lib/data.js';
import { objClone } from '../utils/object.js';
import { getType } from '../utils/type.js';

const adapters = {
  storage: null,
  backup: null,
  backupIntervalId: null,
};

const initAdapters = async ({ storageAdapter, backupAdapter }) => {
  if (storageAdapter) {
    adapters.storage = storageAdapter;
  }

  if (backupAdapter) {
    adapters.backup = backupAdapter;
  }

  await storageController.initCollections();

  if (backupAdapter?.init) {
    const result = await backupAdapter.init();
    if (result?.backupInterval) {
      const intervalMs = result.backupInterval * 60 * 1000;
      adapters.backupIntervalId = setInterval(() => {
        adapters.backup.backup(dumpCollections());
      }, intervalMs);
    }
  }
};

const dumpCollections = () => {
  const results = {};
  for (const collectionName in data) {
    results[collectionName] = Array.from(data[collectionName].values()).map(objClone);
  }
  return results;
};

const handleChanges = async (type, collectionName, changes) => {
  if (!adapters.storage || !data[collectionName]) return;
  const collectionData = Array.from(data[collectionName].values()).map(objClone);
  Promise.resolve()
    .then(() => adapters.storage[type]({ collectionName, collectionData, changes }))
    .catch(console.error);
};

const storageController = {
  onInsert: async (collectionName, changes = []) => handleChanges('insert', collectionName, changes),

  onUpdate: async (collectionName, changes = []) => handleChanges('update', collectionName, changes),

  onDelete: async (collectionName, changes = []) => handleChanges('delete', collectionName, changes),

  initCollections: async () => {
    if (!adapters.storage) return;

    const result = await adapters.storage.init();

    if (getType(result?.collections) === 'array') {
      for (const { collectionName, collectionData } of result.collections) {
        data[collectionName] = new Map(collectionData.map((el) => [el._id, el]));
      }
    }
  },

  onBackup: async () => {
    if (!adapters.backup) return;
    await adapters.backup.backup(dumpCollections());
  },

  stopBackup: () => {
    if (adapters.backupIntervalId) {
      clearInterval(adapters.backupIntervalId);
      adapters.backupIntervalId = null;
    }
  },
};

export { initAdapters, storageController };
