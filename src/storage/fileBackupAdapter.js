import archiver from 'archiver';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { ensureFolderExists, preProcessBackup, tryDeleteFile } from './helpers.js';

const fileBackupAdapter = ({
  backupFolder = './data/backup',
  backupInterval = 60,
  maxBackups = 5,
  verbose = false,
}) => {
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

      if (tarFiles.length > maxBackups) {
        tarFiles.sort((a, b) => b.time - a.time);
        const toDelete = tarFiles.slice(maxBackups);
        for (const file of toDelete) {
          const fullPath = path.join(backupDir, file.name);
          if (verbose) console.log('Deleting expired backup:', fullPath);
          await tryDeleteFile(fullPath, verbose);
        }
      }
    } catch (err) {
      console.error('Error cleaning expired backups:', err);
    }
  };

  const backup = async (data) => {
    if (!data || Object.keys(data).length === 0) {
      if (verbose) console.warn('Backup data is empty, skipping backup.');
      return;
    }

    await ensureFolderExists(backupFolder);

    const filename = `${Date.now()}.tar`;
    const tmpFilePath = path.join(backupFolder, `${filename}.tmp`);
    const targetFilePath = path.join(backupFolder, filename);

    try {
      const output = fs.createWriteStream(tmpFilePath);
      const archive = archiver('tar', { gzip: false });

      archive.pipe(output);

      const files = await preProcessBackup(data);

      for (const { fileName, fileContent } of files) {
        archive.append(fileContent, { name: fileName });
        if (verbose) console.log(`Prepared for backup: ${fileName}`);
      }

      await new Promise((resolve, reject) => {
        output.on('close', () => resolve(true));
        archive.on('error', reject);
        archive.finalize();
      });

      await fsp.rename(tmpFilePath, targetFilePath);

      if (verbose) console.log(`Backup file created: ${targetFilePath}`);

      await cleanExpiredBackupFiles(backupFolder, maxBackups, verbose);
    } catch (err) {
      console.error('Backup error:', err);
    }
  };

  const init = async () => {
    await ensureFolderExists(backupFolder);
    return { backupInterval };
  };

  return {
    backup,
    init,
  };
};

export default fileBackupAdapter;
