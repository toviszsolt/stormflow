import archiver from 'archiver';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import configManager from '../utils/configManager.js';
import { ensureFolderExists, preProcessBackup, tryDeleteFile } from './helpers.js';

const fileBackupAdapter = (options = {}) => {
  const config = configManager({
    backupFolder: './data/backup',
    backupInterval: 60,
    maxBackups: 5,
    verbose: false,
    ...options,
  });

  const cleanExpiredBackupFiles = async (backupDir, maxBackups = 5, verbose = false) => {
    try {
      const files = await fsp.readdir(backupDir);
      const tarFiles = await Promise.all(
        files
          .filter((f) => f.endsWith('.tar'))
          .map(async (f) => ({
            name: f,
            time: (await fsp.stat(path.join(backupDir, f))).mtime.getTime(),
          })),
      );

      if (tarFiles.length > config.get('maxBackups')) {
        tarFiles.sort((a, b) => b.time - a.time);
        const toDelete = tarFiles.slice(config.get('maxBackups'));
        for (const file of toDelete) {
          const fullPath = path.join(backupDir, file.name);
          if (config.get('verbose')) console.log('Deleting expired backup:', fullPath);
          await tryDeleteFile(fullPath, config.get('verbose'));
        }
      }
    } catch (err) {
      console.error('Error cleaning expired backups:', err);
    }
  };

  const backup = async (data) => {
    if (!data || Object.keys(data).length === 0) {
      if (config.get('verbose')) console.warn('Backup data is empty, skipping backup.');
      return;
    }

    await ensureFolderExists(config.get('backupFolder'));

    const filename = `${Date.now()}.tar`;
    const tmpFilePath = path.join(config.get('backupFolder'), `${filename}.tmp`);
    const targetFilePath = path.join(config.get('backupFolder'), filename);

    try {
      const output = fs.createWriteStream(tmpFilePath);
      const archive = archiver('tar', { gzip: false });

      archive.pipe(output);

      const files = await preProcessBackup(data);

      for (const { fileName, fileContent } of files) {
        archive.append(fileContent, { name: fileName });
        if (config.get('verbose')) console.log(`Prepared for backup: ${fileName}`);
      }

      await new Promise((resolve, reject) => {
        output.on('close', () => resolve(true));
        archive.on('error', reject);
        archive.finalize();
      });

      await fsp.rename(tmpFilePath, targetFilePath);

      if (config.get('verbose')) console.log(`Backup file created: ${targetFilePath}`);

      await cleanExpiredBackupFiles(config.get('backupFolder'), config.get('maxBackups'), config.get('verbose'));
    } catch (err) {
      console.error('Backup error:', err);
    }
  };

  const init = async () => {
    await ensureFolderExists(config.get('backupFolder'));
    return { backupInterval: config.get('backupInterval') };
  };

  return { backup, init };
};

export default fileBackupAdapter;
