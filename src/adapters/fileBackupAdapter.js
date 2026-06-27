import fsp from 'fs/promises';
import path from 'path';
import * as tar from 'tar';
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

  const cleanExpiredBackupFiles = async () => {
    try {
      const { backupFolder, maxBackups, verbose } = config.getConfig();
      const files = await fsp.readdir(backupFolder);
      const tarFiles = await Promise.all(
        files
          .filter((f) => f.endsWith('.tar'))
          .map(async (f) => ({
            name: f,
            time: (await fsp.stat(path.join(backupFolder, f))).mtime.getTime(),
          })),
      );

      if (tarFiles.length > maxBackups) {
        tarFiles.sort((a, b) => b.time - a.time);
        const toDelete = tarFiles.slice(maxBackups);
        for (const file of toDelete) {
          const fullPath = path.join(backupFolder, file.name);
          if (verbose) console.log('Deleting expired backup:', fullPath);
          await tryDeleteFile(fullPath, verbose);
        }
      }
    } catch (err) {
      console.error('Error cleaning expired backups:', err);
    }
  };

  const backup = async (data) => {
    const { verbose, backupFolder } = config.getConfig();

    if (!data || Object.keys(data).length === 0) {
      if (verbose) console.warn('Backup data is empty, skipping backup.');
      return;
    }

    await ensureFolderExists(backupFolder);

    const filename = `${Date.now()}.tar`;
    const tmpFilePath = path.join(backupFolder, `${filename}.tmp`);
    const targetFilePath = path.join(backupFolder, filename);

    try {
      const files = await preProcessBackup(data);
      const tmpDir = path.join(backupFolder, `_tmp_${Date.now()}`);
      await fsp.mkdir(tmpDir, { recursive: true });

      try {
        for (const { fileName, fileContent } of files) {
          await fsp.writeFile(path.join(tmpDir, fileName), fileContent);
          if (verbose) console.log(`Prepared for backup: ${fileName}`);
        }

        await tar.create(
          { file: tmpFilePath, gzip: false, cwd: tmpDir },
          files.map((f) => f.fileName),
        );
      } finally {
        await fsp.rm(tmpDir, { recursive: true, force: true });
      }

      await fsp.rename(tmpFilePath, targetFilePath);

      if (verbose) console.log(`Backup file created: ${targetFilePath}`);

      await cleanExpiredBackupFiles();
    } catch (err) {
      console.error('Backup error:', err);
      await tryDeleteFile(tmpFilePath, verbose);
    }
  };

  const init = async () => {
    const { backupFolder, backupInterval } = config.getConfig();
    await ensureFolderExists(backupFolder);
    return { backupInterval };
  };

  return { backup, init };
};

export default fileBackupAdapter;
