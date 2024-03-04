const path = require('path');
const { config, defaultConfig, setConfig, getConfig } = require('../../lib/config');

describe('config', () => {
  it('object is exists', () => {
    expect(typeof config).toBe('object');
  });
});

describe('defaultConfig', () => {
  it('object is exists and has correct properties', () => {
    expect(typeof defaultConfig).toBe('object');
    expect(defaultConfig).toHaveProperty('strict');
    expect(defaultConfig).toHaveProperty('dataDirectory');
    expect(defaultConfig).toHaveProperty('diskWrite');
    expect(defaultConfig).toHaveProperty('diskWriteThrottle');
    expect(defaultConfig).toHaveProperty('backupFiles');
    expect(defaultConfig).toHaveProperty('backupInterval');
    expect(defaultConfig).toHaveProperty('defaultFields');
    expect(defaultConfig).toHaveProperty('verbose');
  });
});

describe('getConfig', () => {
  it('return the Config object', () => {
    expect(getConfig()).toEqual(config);
  });
});

describe('setConfig', () => {
  beforeEach(() => {
    // Reset config object before each it
    Object.keys(config).forEach((key) => delete config[key]);
  });

  it('merge default config with provided options', () => {
    const options = { diskWrite: false, backupInterval: 5 };

    setConfig(options);

    expect(config).toEqual({
      ...defaultConfig,
      ...options,
    });
  });

  it('throw error for invalid options', () => {
    expect(() => setConfig('invalid')).toThrow();
    expect(() => setConfig({ invalidKey: true })).toThrow();
  });

  it('throw error for invalid option value (diskWriteThrottle)', () => {
    expect(() => setConfig({ diskWriteThrottle: 40 })).toThrow();
    expect(() => setConfig({ diskWriteThrottle: 3010 })).toThrow();
  });

  it('throw error for invalid option value (backupInterval)', () => {
    expect(() => setConfig({ backupInterval: 0 })).toThrow();
    expect(() => setConfig({ backupInterval: 25 })).toThrow();
  });
});
