import fsp from 'fs/promises';
import path from 'path';
import configManager from '../utils/configManager.js';
import {
  convertJsonToGzip,
  ensureFolderExists,
  postProcessRestore,
  preProcessChanges,
  tryDeleteFile,
} from './helpers.js';

const fileStorageAdapter = (options = {}) => {
  const config = configManager({
    dataFolder: './data',
    throttle: 100,
    verbose: false,
    ...options,
  });
  const collectionThrottle = {};
  const pendingWrites = {};

  const restoreDataFiles = async () => {
    await ensureFolderExists(config.get('dataFolder'));
    await convertJsonToGzip(config.get('dataFolder'), config.get('verbose'));

    const files = await fsp.readdir(config.get('dataFolder'));
    const sfcFiles = files.filter((file) => file.endsWith('.sfc'));

    if (sfcFiles.length > 0) {
      console.log('[FileStorage]', `Restoring data from files:`);
    }

    const fileEntries = await Promise.all(
      sfcFiles.map(async (fileName) => {
        console.log('[FileStorage]', `  → ${fileName}`);
        const filePath = path.join(config.get('dataFolder'), fileName);
        const fileContent = await fsp.readFile(filePath);
        return { fileName, fileContent };
      }),
    );

    return await postProcessRestore(fileEntries);
  };

  const writeDataFile = async (collectionName, collectionData) => {
    try {
      await ensureFolderExists(config.get('dataFolder'));

      if (config.get('verbose')) console.log('[FileStorage]', `Compress data before writing: ${collectionName}`);
      const { fileName, fileContent } = await preProcessChanges(collectionName, collectionData);
      const tmpFilePath = path.join(config.get('dataFolder'), `${fileName}.tmp`);
      const targetFilePath = path.join(config.get('dataFolder'), fileName);

      if (collectionData.length === 0) {
        if (config.get('verbose')) console.log('[FileStorage]', `Removing empty file: ${targetFilePath}`);
        await tryDeleteFile(targetFilePath, config.get('verbose'));
        return;
      }

      if (config.get('verbose')) console.log('[FileStorage]', `Writing data to temp file: ${tmpFilePath}`);
      await fsp.writeFile(tmpFilePath, fileContent);
      await new Promise((r) => setTimeout(r, 50));

      if (config.get('verbose')) console.log('[FileStorage]', `Move data to final file: ${targetFilePath}`);
      await fsp.rename(tmpFilePath, targetFilePath);
      await tryDeleteFile(tmpFilePath, config.get('verbose'));
    } catch (err) {
      console.error(`Failed to write ${collectionName}:`, err);
    }
  };

  const throttleWrite = (collectionName, collectionData) => {
    pendingWrites[collectionName] = collectionData;

    if (!collectionThrottle[collectionName]) {
      collectionThrottle[collectionName] = true;

      setTimeout(async () => {
        const latestData = pendingWrites[collectionName];
        delete pendingWrites[collectionName];
        await writeDataFile(collectionName, latestData);
        collectionThrottle[collectionName] = false;

        if (pendingWrites[collectionName]) {
          throttleWrite(collectionName, pendingWrites[collectionName]);
        }
      }, config.get('throttle'));
    }
  };

  return {
    init: async () => {
      const collections = await restoreDataFiles();
      return { collections };
    },
    insert: async ({ collectionName, collectionData }) => throttleWrite(collectionName, collectionData),
    update: async ({ collectionName, collectionData }) => throttleWrite(collectionName, collectionData),
    delete: async ({ collectionName, collectionData }) => throttleWrite(collectionName, collectionData),
  };
};

export default fileStorageAdapter;
