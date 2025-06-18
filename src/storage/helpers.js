import fsp from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import zlib from 'zlib';
import { getType } from '../utils/type.js';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Ensures that the specified folder exists by creating it if it does not.
 * If the folder already exists, no error is thrown.
 *
 * @async
 * @function
 * @param {string} dataFolder - The path to the folder to ensure exists.
 * @returns {Promise<void>} Resolves when the folder exists or is created.
 */
const ensureFolderExists = async (dataFolder) => {
  await fsp.mkdir(dataFolder, { recursive: true });
};

/**
 * Attempts to delete a file at the specified path.
 * Logs the result if verbose is true. Ignores errors if the file does not exist.
 *
 * @async
 * @param {string} targetPath - The path to the file to delete.
 * @param {boolean} [verbose=false] - Whether to log the deletion result or errors.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
const tryDeleteFile = async (targetPath, verbose = false) => {
  try {
    await fsp.unlink(targetPath);
    if (verbose) console.log(`Deleted file: ${targetPath}`);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    if (verbose) console.error(`Failed to delete file: ${targetPath}:`, err);
  }
};

/**
 * Restores collections from an array of files with .sfc extension.
 *
 * @param {{ fileName: string, fileContent: Buffer | string }[]} files - Array of file objects to restore.
 * @returns {Promise<{ collectionName: string, collectionData: any }[] | undefined>}
 */
const postProcessRestore = async (files = []) => {
  if (getType(files) !== 'array') return;
  const results = [];

  for (const { fileName, fileContent } of files) {
    const collectionName = fileName.replace(/\.sfc$/, '');
    const decompressed = await gunzip(fileContent);
    const collectionData = JSON.parse(decompressed.toString('utf8'));

    results.push({ collectionName, collectionData });
  }

  return results;
};

/**
 * Prepares changes for a collection by compressing its data.
 *
 * @param {string} collectionName - The name of the collection.
 * @param {array} collectionData - The data of the collection to process.
 * @returns {Promise<{ collectionName: string, fileName?: string, fileContent?: Buffer }>}
 */
const preProcessChanges = async (collectionName, collectionData) => {
  if (!collectionData) return { collectionName };

  const fileName = `${collectionName}.sfc`;
  const json = JSON.stringify(collectionData);
  const fileContent = await gzip(json);

  return { collectionName, fileName, fileContent };
};

/**
 * Prepares backup files from a data object containing collections.
 *
 * @param {Record<string, any[]>} data - An object where each key is a collection name and the value is an array of data.
 * @returns {Promise<{ fileName: string, fileContent: Buffer }[]>}
 */
const preProcessBackup = async (data) => {
  if (!data || typeof data !== 'object') return [];

  const files = [];

  for (const collectionName of Object.keys(data)) {
    const dataArray = data[collectionName];
    const json = JSON.stringify(dataArray);
    const fileContent = await gzip(json);
    const fileName = `${collectionName}.sfc`;

    files.push({ fileName, fileContent });
  }

  return files;
};

/**
 * Átkonvertálja a régi .json fájlokat gzip-elt .sfc fájlokká a visszafelé kompatibilitás érdekében.
 * @param {string} dataFolder - Az adatkönyvtár elérési útja.
 * @param {boolean} [verbose=false] - Naplózza-e a lépéseket.
 */
const convertJsonToGzip = async (dataFolder, verbose = false) => {
  await ensureFolderExists(dataFolder);
  const files = await fsp.readdir(dataFolder);

  for (const file of files) {
    if (file.endsWith('.json')) {
      const jsonPath = path.join(dataFolder, file);
      const sfcPath = path.join(dataFolder, file.replace(/\.json$/, '.sfc'));

      try {
        if (verbose) console.log('[FileStorage]', `Converting ${jsonPath} to sfc`);
        const content = await fsp.readFile(jsonPath, 'utf8');
        const compressed = await gzip(content);
        await fsp.writeFile(sfcPath, compressed);
        if (verbose) console.log('[FileStorage]', `Converted and saved as ${sfcPath}`);
        await tryDeleteFile(jsonPath, verbose);
      } catch (err) {
        console.error(`[FileStorage] Error converting ${jsonPath} to gzip:`, err);
      }
    }
  }
};

export {
  convertJsonToGzip,
  ensureFolderExists,
  postProcessRestore,
  preProcessBackup,
  preProcessChanges,
  tryDeleteFile,
};
