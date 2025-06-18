import fsp from 'fs/promises';
import path from 'path';
import { initAdapters, storageController } from '../../src/storage/storageController.js';

const testRoot = './test-data';
const storageDir = path.join(testRoot, 'storage');
const backupDir = path.join(testRoot, 'backup');

describe('storage', () => {
  beforeAll(async () => {
    await fsp.mkdir(testRoot, { recursive: true });
  });

  afterAll(async () => {
    await fsp.rm(testRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await fsp.mkdir(storageDir, { recursive: true });
    await fsp.mkdir(backupDir, { recursive: true });
  });

  afterEach(async () => {
    storageController.stopBackup();
    await fsp.rm(storageDir, { recursive: true, force: true });
    await fsp.rm(backupDir, { recursive: true, force: true });
  });

  it('should handle operations without storage adapter', async () => {
    await storageController.initCollections();
    await storageController.onInsert('test', []);
    await storageController.onUpdate('test', []);
    await storageController.onDelete('test', []);
  });

  it('should handle backup operations without backup adapter', async () => {
    await storageController.onBackup();
  });

  it('should handle backup interval', async () => {
    const mockBackupAdapter = {
      init: async () => ({ backupInterval: 0.0001 }), // 0.0001 perc = 6ms
      backup: jest.fn(),
    };
    const mockStorageAdapter = {
      init: async () => ({}),
    };

    await initAdapters({ storageAdapter: mockStorageAdapter, backupAdapter: mockBackupAdapter });

    await new Promise((resolve) => setTimeout(resolve, 100)); // Hosszabb várakozás

    expect(mockBackupAdapter.backup).toHaveBeenCalled();
  });

  it('should handle storage adapter init with collections', async () => {
    const mockStorageAdapter = {
      init: async () => ({
        collections: [{ collectionName: 'test', collectionData: [{ _id: '1', value: 'test' }] }],
      }),
    };

    await initAdapters({ storageAdapter: mockStorageAdapter, backupAdapter: null });
  });
});
