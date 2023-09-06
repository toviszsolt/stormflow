const collectionThrottle = {};

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { config } = require('./config');
const { deepClone } = require('./utils');

const data = {};

const stats = {
  diskWrites: {},
  skippedWrites: {},
};

let init = false;

let backupTimer;

const diskStats = () => deepClone(stats);

const logPrefix = `[StormFlow]`;

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
        data[collectionName] = JSON.parse(content);
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
    const dataToSave = JSON.stringify(data[collectionName]);

    try {
      zlib.gzip(dataToSave, (err, compressedData) => {
        config.verbose &&
          console.log(logPrefix, `Compress collection for backup: ${collectionName}`);
        if (err) return console.error(`Error compress collection: ${collectionName}`, err.message);

        fs.writeFile(tmpFile, compressedData, { encoding: 'utf8', flag: 'w' }, (err) => {
          config.verbose && console.log(logPrefix, `Write backup to temp file: ${tmpFile}`);
          if (err) return console.error('Error writing backup to temp file:', tmpFile, err.message);

          fs.rename(tmpFile, backupFile, (err) => {
            config.verbose && console.log(logPrefix, `Move backup to final file: ${backupFile}`);
            if (err) return console.error('Error writing backup to file:', backupFile, err.message);
          });
        });
      });
    } catch (e) {
      console.error('Error writing backup to file:', backupFile, error.message);
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

const writeThrottled = (collectionName) => {
  try {
    const filename = `${collectionName}.json`;
    const tmpFile = path.join(config.dataDirectory, `${filename}.tmp`);
    const targetFile = path.join(config.dataDirectory, filename);
    const dataToSave = JSON.stringify(data[collectionName]);

    fs.writeFile(tmpFile, dataToSave, { encoding: 'utf8', flag: 'w' }, (err) => {
      config.verbose && console.log(logPrefix, `Write data to temp file: ${tmpFile}`);
      if (err) return console.error('Error writing data to temp file:', tmpFile, err.message);

      fs.rename(tmpFile, targetFile, (err) => {
        config.verbose && console.log(logPrefix, `Move data to final file: ${targetFile}`);
        if (err) return console.error('Error writing data to file:', targetFile, err.message);

        collectionThrottle[collectionName] = false;
        stats.diskWrites[collectionName] ??= 0;
        stats.diskWrites[collectionName]++;
      });
    });
  } catch (error) {
    console.error('Error writing data to file:', collectionName, error.message);
  }
};

module.exports = {
  data,
  diskStats,
  initFileStorage,
  saveDataToFile,
};
