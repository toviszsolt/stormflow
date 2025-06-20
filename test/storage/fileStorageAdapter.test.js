import fsp from 'fs/promises';
import path from 'path';
import fileStorageAdapter from '../../src/storage/fileStorageAdapter.js';

const testRoot = './test-data';
const storageDir = path.join(testRoot, 'storage');

describe('fileStorageAdapter', () => {
  beforeAll(async () => {
    await fsp.mkdir(testRoot, { recursive: true });
  });

  afterAll(async () => {
    await fsp.rm(testRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await fsp.mkdir(storageDir, { recursive: true });
  });

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await fsp.rm(storageDir, { recursive: true, force: true });
  });

  it('should handle write with empty collection', async () => {
    const adapter = fileStorageAdapter({ dataFolder: storageDir, throttle: 10 });
    await adapter.insert({ collectionName: 'test', collectionData: [] });
  });

  it('should handle write errors', async () => {
    const invalidPath = path.join(testRoot, 'nonexistent');
    await fsp.mkdir(invalidPath, { recursive: true });
    const adapter = fileStorageAdapter({ dataFolder: invalidPath, throttle: 100 });
    await adapter.insert({ collectionName: 'test', collectionData: [{ id: 1 }] });
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  it('should handle throttled writes', async () => {
    const adapter = fileStorageAdapter({ dataFolder: storageDir, throttle: 100 });

    await adapter.insert({ collectionName: 'test', collectionData: [{ id: 1 }] });
    await new Promise((resolve) => setTimeout(resolve, 150));

    await adapter.update({ collectionName: 'test', collectionData: [{ id: 2 }] });
    await new Promise((resolve) => setTimeout(resolve, 150));

    await adapter.delete({ collectionName: 'test', collectionData: [] });
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  it('should handle file rename errors', async () => {
    const adapter = fileStorageAdapter({ dataFolder: storageDir });
    await fsp.chmod(storageDir, 0o444).catch(() => {});
    await adapter.insert({ collectionName: 'test', collectionData: [{ id: 1 }] });
    await new Promise((resolve) => setTimeout(resolve, 150));
    await fsp.chmod(storageDir, 0o777).catch(() => {});
  });
});
