const collectionThrottle = {};

import archiver from 'archiver';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import zlib from 'zlib';
import { config } from '../lib/config.js';
import data from '../lib/data.js';
import { objClone } from '../utils/object.js';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

let init = false;
let backupTimer;

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
        backupTimer = setTimeout(() => backupDataFiles(), 1000);
      }
    }
  }
};

const makeDataDirectoryIfNotExists = async () => {
  try {
    const path = config.dataDirectory;
    await fsPromises.mkdir(path, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

const makeBackupDirectoryIfNotExists = () => {
  try {
    const path = `${config.dataDirectory}/backup`;
    fs.mkdirSync(path, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

const readDataFromFiles = async () => {
  makeDataDirectoryIfNotExists();
  await convertJsonToGzip();

  const files = await fsPromises.readdir(config.dataDirectory);

  if (files.length > 0 && config.verbose) {
    console.log(logPrefix, `Open data files:`);
  }

  for (const file of files) {
    if (file.endsWith('.sfc')) {
      const collectionName = path.basename(file, '.sfc');
      const filePath = path.join(config.dataDirectory, file);

      if (config.verbose) console.log(logPrefix, `  → ${filePath}`);

      try {
        const compressedContent = await fsPromises.readFile(filePath);
        const decompressed = await gunzip(compressedContent);
        const array = JSON.parse(decompressed.toString('utf8'));
        data[collectionName] = new Map(array.map((el) => [el._id, el]));
      } catch (error) {
        console.error(`Error reading data from ${file}:`, error);
      }
    }
  }
};

const convertJsonToGzip = async () => {
  makeDataDirectoryIfNotExists();
  const files = await fsPromises.readdir(config.dataDirectory);

  for (const file of files) {
    if (file.endsWith('.json')) {
      const jsonPath = path.join(config.dataDirectory, file);
      const sfcPath = path.join(config.dataDirectory, file.replace(/\.json$/, '.sfc'));

      try {
        if (config.verbose) console.log(logPrefix, `Converting ${jsonPath} to gzip`);

        const content = await fsPromises.readFile(jsonPath, 'utf8');
        const compressed = await gzip(content);
        await fsPromises.writeFile(sfcPath, compressed);

        if (config.verbose) console.log(logPrefix, `Converted and saved as ${sfcPath}`);

        await fsPromises.unlink(jsonPath);
      } catch (err) {
        console.error(`Error converting ${jsonPath} to gzip:`, err);
      }
    }
  }
};

const backupDataFiles = async () => {
  makeBackupDirectoryIfNotExists();
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => backupDataFiles(), config.backupInterval * 1000 * 60);

  const backupDir = path.join(config.dataDirectory, 'backup');
  const filename = `${Date.now()}${'.tar'}`;
  const tmpZipFile = path.join(backupDir, `${filename}.tmp`);
  const finalZipFile = path.join(backupDir, filename);

  try {
    const output = fs.createWriteStream(tmpZipFile);
    const archive = archiver('tar', { gzip: false });

    archive.pipe(output);

    for (const collectionName of Object.keys(data)) {
      const dataToSave = JSON.stringify(Array.from(data[collectionName].values()));
      const compressed = await gzip(dataToSave);

      archive.append(compressed, { name: `${collectionName}.sfc` });

      if (config.verbose) console.log(logPrefix, `Prepared ${collectionName} for backup`);
    }

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    await fsPromises.rename(tmpZipFile, finalZipFile);
    if (config.verbose) console.log(logPrefix, `Backup ZIP created: ${finalZipFile}`);

    await cleanupOldBackups();
  } catch (err) {
    console.error('Backup error:', err);
  }
};

const cleanupOldBackups = async () => {
  const backupDir = path.join(config.dataDirectory, 'backup');
  try {
    const files = await fsPromises.readdir(backupDir);
    const tarFiles = files
      .filter((f) => f.endsWith('.tar'))
      .map((f) => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (tarFiles.length > 5) {
      const toDelete = tarFiles.slice(5);
      for (const file of toDelete) {
        const fullPath = path.join(backupDir, file.name);
        if (config.verbose) console.log(logPrefix, `Deleting old backup: ${fullPath}`);
        await fsPromises.unlink(fullPath);
      }
    }
  } catch (err) {
    console.error('Error cleaning up old backups:', err);
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
  const filename = `${collectionName}.sfc`;
  const tmpFile = path.join(config.dataDirectory, `${filename}.tmp`);
  const targetFile = path.join(config.dataDirectory, filename);
  const dataToSave = JSON.stringify(Array.from(data[collectionName].values()));

  try {
    if (config.verbose) console.log(logPrefix, `Compressing data before writing: ${tmpFile}`);
    const compressedData = await gzip(dataToSave);

    if (config.verbose) console.log(logPrefix, `Writing data to temp file: ${tmpFile}`);
    await fsPromises.writeFile(tmpFile, compressedData);
    await new Promise((r) => setTimeout(r, 50)); // delay for rename safety

    config.verbose && console.log(logPrefix, `Move data to final file: ${targetFile}`);
    await fsPromises.rename(tmpFile, targetFile);
  } catch (err) {
    console.error('Error writing data to file:', tmpFile, err.message);
  }

  if (config.verbose) console.log(logPrefix, `Moved temp file to final file: ${targetFile}`);

  collectionThrottle[collectionName] = false;
  stats.diskWrites[collectionName] ??= 0;
  stats.diskWrites[collectionName]++;
};

export { data, diskStats, initFileStorage, saveDataToFile };
