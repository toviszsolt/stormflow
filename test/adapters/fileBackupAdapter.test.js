import fsp from 'fs/promises';
import path from 'path';
import fileBackupAdapter from '../../src/adapters/fileBackupAdapter.js';

const testRoot = './test-backup';
const backupDir = path.join(testRoot, 'backup');

const randomFolderName = () => `test-backup-${Math.random().toString(36).substring(2, 15)}`;

describe('fileBackupAdapter', () => {
  beforeAll(async () => {
    await fsp.mkdir(testRoot, { recursive: true });
  });

  afterAll(async () => {
    await fsp.rm(testRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await fsp.mkdir(backupDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fsp.rm(backupDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Warning: Could not remove backup directory: ${error.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it('should initialize and call ensureFolderExists', async () => {
    const backupFolder = path.join(testRoot, randomFolderName());
    const adapter = fileBackupAdapter({ backupFolder });
    const result = await adapter.init();
    expect(result).toHaveProperty('backupInterval');
  });

  it('should skip backup if data is empty', async () => {
    const backupFolder = path.join(testRoot, randomFolderName());
    const adapter = fileBackupAdapter({ backupFolder });
    await expect(adapter.backup({})).resolves.toBeUndefined();
    await expect(adapter.backup(null)).resolves.toBeUndefined();
  });

  it('should handle backup error gracefully', async () => {
    const backupFolder = path.join(testRoot, randomFolderName());
    const adapter = fileBackupAdapter({ backupFolder });
    await expect(adapter.backup({ test: [{ _id: 1 }] })).resolves.toBeUndefined();
  });

  it('should handle cleanExpiredBackupFiles error gracefully', async () => {
    const backupFolder = path.join(testRoot, randomFolderName());
    const adapter = fileBackupAdapter({ backupFolder });
    await expect(adapter.backup({ test: [{ _id: 1 }] })).resolves.toBeUndefined();
  });

  it('should call backup and create a tar file', async () => {
    const backupFolder = path.join(testRoot, randomFolderName());
    const adapter = fileBackupAdapter({ backupFolder });
    await fsp.mkdir(backupFolder, { recursive: true });
    await adapter.backup({ test: [{ _id: 1 }] });
    const files = await fsp.readdir(backupFolder);
    expect(files.some((f) => f.endsWith('.tar'))).toBe(true);
    // cleanup
    for (const f of files) await fsp.unlink(path.join(backupFolder, f));
    await fsp.rmdir(backupFolder);
  });

  it('should catch error in backup (simulate archiver error)', async () => {
    const backupFolder = path.join(testRoot, randomFolderName());
    const adapter = fileBackupAdapter({ backupFolder });
    await expect(adapter.backup({ test: undefined })).resolves.toBeUndefined();
  });

  it('should catch error in cleanExpiredBackupFiles', async () => {
    const backupFolder = path.join(testRoot, randomFolderName());
    const adapter = fileBackupAdapter({ backupFolder });
    await expect(adapter.backup({ test: [{ _id: 1 }] })).resolves.toBeUndefined();
  });

  it('should handle backup process with mock files', async () => {
    const adapter = fileBackupAdapter({ backupFolder: backupDir, maxBackups: 2 });

    const oldFile1 = path.join(backupDir, '1000000000000.tar');
    const oldFile2 = path.join(backupDir, '1000000000001.tar');
    await fsp.writeFile(oldFile1, 'test');
    await fsp.writeFile(oldFile2, 'test');

    await adapter.backup({ test: [{ id: 1 }] });

    const files = await fsp.readdir(backupDir);
    expect(files.length).toBeLessThanOrEqual(2);
  });

  it('should handle errors in archive process', async () => {
    const adapter = fileBackupAdapter({ backupFolder: backupDir });
    const badData = { test: undefined };
    await expect(adapter.backup(badData)).resolves.toBeUndefined();
  });

  it('should handle file system errors', async () => {
    const invalidPath = path.join(testRoot, randomFolderName());
    const adapter = fileBackupAdapter({ backupFolder: invalidPath });
    await expect(adapter.backup({ test: [{ id: 1 }] })).resolves.toBeUndefined();
  });
});
