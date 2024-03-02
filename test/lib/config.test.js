const path = require('path');
const { config, defaultConfig, setConfig } = require('../../lib/config');

describe('mergeConfig', () => {
  beforeEach(() => {
    // Reset config object before each it
    Object.keys(config).forEach((key) => delete config[key]);
  });

  it('merges default config with provided options', () => {
    const options = {
      diskWrite: false,
      backupInterval: 5,
    };

    setConfig(options);

    expect(config).toEqual({
      strict: true,
      dataDirectory: path.join(process.cwd(), './data'),
      diskWrite: false,
      diskWriteThrottle: 100,
      backupFiles: true,
      backupInterval: 5,
      defaultFields: true,
      verbose: false,
    });
  });

  it('throws error for invalid options type', () => {
    expect(() => setConfig('invalid')).toThrow(/Invalid/);
  });

  it('throws error for invalid option key', () => {
    const options = {
      invalidKey: true,
    };

    expect(() => setConfig(options)).toThrow(/invalidKey/);
  });

  it('throws error for invalid option value (diskWriteThrottle)', () => {
    expect(() => setConfig({ diskWriteThrottle: 40 })).toThrow(/diskWriteThrottle/);
    expect(() => setConfig({ diskWriteThrottle: 3010 })).toThrow(/diskWriteThrottle/);
  });

  it('throws error for invalid option value (backupInterval)', () => {
    expect(() => setConfig({ backupInterval: 0 })).toThrow(/backupInterval/);
    expect(() => setConfig({ backupInterval: 25 })).toThrow(/backupInterval/);
  });
});

describe('defaultConfig', () => {
  it('contains expected default values', () => {
    expect(defaultConfig).toEqual({
      strict: true,
      dataDirectory: path.join(process.cwd(), './data'),
      diskWrite: true,
      diskWriteThrottle: 100,
      backupFiles: true,
      backupInterval: 10,
      defaultFields: true,
      verbose: false,
    });
  });
});
