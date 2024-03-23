// yourModule.test.js

const fs = require('fs');
const { initFileStorage, data, saveDataToFile } = require('../../src/lib/storage');
const { defaultConfig, setConfig } = require('../../src/lib/config');

jest.mock('fs');

beforeEach(() => {
  setConfig(defaultConfig);
});

describe('initFileStorage', () => {
  it.skip('should initialize file storage', () => {
    // @ts-ignore
    fs.existsSync.mockReturnValueOnce(true);
    // @ts-ignore
    fs.readdirSync.mockReturnValueOnce(['test-collection.json']);
    // @ts-ignore
    fs.readFileSync.mockReturnValueOnce('[{"key": "value"}]');

    setConfig({ diskWrite: true });
    initFileStorage();

    expect(data['test-collection']).toEqual([{ key: 'value' }]);
  });
});

describe('saveDataToFile', () => {
  it.skip('should save data to file', () => {
    // @ts-ignore
    fs.existsSync.mockReturnValueOnce(true);

    setConfig({ diskWrite: true });
    saveDataToFile('test-collection');

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('data/test-collection.json'),
      '{"key":"value"}',
      expect.any(Object),
    );
  });
});
