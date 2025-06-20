import fsp from 'fs/promises';
import path from 'path';
import * as helpers from '../../src/storage/helpers.js';

const testRoot = './test-data';
const helperDir = path.join(testRoot, 'helpers');

describe('helpers', () => {
  beforeAll(async () => {
    await fsp.mkdir(testRoot, { recursive: true });
  });

  afterAll(async () => {
    await fsp.rm(testRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await fsp.mkdir(helperDir, { recursive: true });
  });

  afterEach(async () => {
    await fsp.rm(helperDir, { recursive: true, force: true });
  });

  it('should ensure folder exists', async () => {
    const folder = path.join(testRoot, 'test-folder');
    await expect(helpers.ensureFolderExists(folder)).resolves.toBeUndefined();
  });

  it('should try to delete non-existing file without error', async () => {
    const fakeFile = path.join(testRoot, 'not-exist-file');
    await expect(helpers.tryDeleteFile(fakeFile)).resolves.toBeUndefined();
  });

  it('should preProcessChanges and postProcessRestore', async () => {
    const data = [{ _id: '1', name: 'A' }];
    const pre = await helpers.preProcessChanges('test', data);
    expect(pre).toHaveProperty('fileName');
    const post = await helpers.postProcessRestore([{ fileName: pre.fileName, fileContent: pre.fileContent }]);
    expect(Array.isArray(post)).toBe(true);
  });

  it('should preProcessBackup', async () => {
    const data = { test: [{ _id: '1', name: 'A' }] };
    const files = await helpers.preProcessBackup(data);
    expect(Array.isArray(files)).toBe(true);
    expect(files[0]).toHaveProperty('fileName');
  });
});

describe('helpers edge cases', () => {
  it('postProcessRestore should return undefined for non-array input', async () => {
    await expect(helpers.postProcessRestore(null)).resolves.toBeUndefined();
    await expect(helpers.postProcessRestore({})).resolves.toBeUndefined();
  });

  it('convertJsonToGzip should handle .json to .sfc conversion and errors', async () => {
    const testFolder = './test-json2sfc';
    await fsp.mkdir(testFolder, { recursive: true });
    const jsonPath = path.join(testFolder, 'test.json');
    await fsp.writeFile(jsonPath, JSON.stringify([{ a: 1 }]));
    await helpers.convertJsonToGzip(testFolder, false);
    const files = await fsp.readdir(testFolder);
    expect(files.some((f) => f.endsWith('.sfc'))).toBe(true);
    for (const f of files) await fsp.unlink(path.join(testFolder, f));
    await fsp.rm(testFolder, { recursive: true, force: true });
  });

  it('convertJsonToGzip should handle readFile error gracefully', async () => {
    const folder = path.join(testRoot, 'invalid-folder');
    await expect(helpers.convertJsonToGzip(folder, false)).resolves.toBeUndefined();
  });
});
