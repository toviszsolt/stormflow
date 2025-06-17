const collectionThrottle = {};

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { objClone } from '../utils/object.js';
import { config } from './config.js';

let init = false;
let backupTimer;

const data = {};

const stats = {
  diskWrites: {},
  skippedWrites: {},
};

const logPrefix = `[StormFlow]`;

const diskStats = () => objClone(stats);

const initFileStorage = () => {
  if (!init) {
    init = true;

    if (config.diskWrite) {
      readDataFromFiles();

      if (config.backupFiles) {
        backupDataFiles();
      }
    }
  }
};

const makeDataDirectoryIfNotExists = () => {
  if (!fs.existsSync(config.dataDirectory)) {
    fs.mkdirSync(config.dataDirectory);
  }
};

const readDataFromFiles = () => {
  makeDataDirectoryIfNotExists();
  const files = fs.readdirSync(config.dataDirectory);

  if (files.length > 0) {
    config.verbose && console.log(logPrefix, `Open data files:`);
  }

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      const collectionName = path.basename(file, '.json');
      const filePath = path.join(config.dataDirectory, file);
      config.verbose && console.log(logPrefix, `  ${filePath}`);

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const array = JSON.parse(content);
        data[collectionName] = new Map(array.map((el) => [el._id, el]));
      } catch (error) {
        console.error(`Error reading data from ${file}:`, error);
      }
    }
  });
};

const backupDataFiles = () => {
  makeDataDirectoryIfNotExists();
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => backupDataFiles(), config.backupInterval * 1000 * 60);
  for (const collectionName in data) {
    const filename = `${collectionName}.json-backup.gz`;
    const tmpFile = path.join(config.dataDirectory, `${filename}.tmp`);
    const backupFile = path.join(config.dataDirectory, filename);
    const dataToSave = JSON.stringify(Array.from(data[collectionName].values()));

    try {
      zlib.gzip(dataToSave, (err, compressedData) => {
        config.verbose && console.log(logPrefix, `Compress collection for backup: ${collectionName}`);
        if (err) return console.error(`Error compress collection: ${collectionName}`, err.message);

        fs.writeFile(tmpFile, compressedData, { encoding: 'utf8', flag: 'w' }, (err) => {
          config.verbose && console.log(logPrefix, `Write backup to temp file: ${tmpFile}`);
          if (err) return console.error('Error writing backup to temp file:', tmpFile, err.message);

          setTimeout(() => {
            // defer next file access with 50ms due EPERM: operation not permitted
            fs.rename(tmpFile, backupFile, (err) => {
              config.verbose && console.log(logPrefix, `Move backup to final file: ${backupFile}`);
              if (err) return console.error('Error writing backup to file:', backupFile, err.message);
            });
          }, 50);
        });
      });
    } catch (e) {
      console.error('Error writing backup to file:', backupFile, e.message);
    }
  }
};

const saveDataToFile = (collectionName) => {
  if (config.diskWrite) {
    makeDataDirectoryIfNotExists();

    if (!collectionThrottle[collectionName]) {
      collectionThrottle[collectionName] = true;
      setTimeout(() => writeThrottled(collectionName), config.diskWriteThrottle);
    } else {
      stats.skippedWrites[collectionName] ??= 0;
      stats.skippedWrites[collectionName]++;
    }
  }
};

const writeThrottled = async (collectionName) => {
  const filename = `${collectionName}.json`;
  const tmpFile = path.join(config.dataDirectory, `${filename}.tmp`);
  const targetFile = path.join(config.dataDirectory, filename);
  const dataToSave = JSON.stringify(Array.from(data[collectionName].values()));

  if (config.verbose) console.log(logPrefix, `Writing data to temp file: ${tmpFile}`);

  let fd;
  try {
    fd = await fsPromises.open(tmpFile, 'w');
    await fd.write(dataToSave, 0, 'utf8');
    await fd.sync();
  } catch (err) {
    console.error('Error writing data to temp file:', tmpFile, err.message);
  } finally {
    if (fd) await fd.close();
  }

  config.verbose && console.log(logPrefix, `Move data to final file: ${targetFile}`);

  try {
    await fsPromises.rename(tmpFile, targetFile);
  } catch (err) {
    console.error('Error writing data to file:', targetFile, err.message);
  }

  if (config.verbose) console.log(logPrefix, `Moved temp file to final file: ${targetFile}`);

  collectionThrottle[collectionName] = false;
  stats.diskWrites[collectionName] ??= 0;
  stats.diskWrites[collectionName]++;
};

export { data, diskStats, initFileStorage, saveDataToFile };
