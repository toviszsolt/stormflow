import { config, defaultConfig, getConfig, setConfig } from '../../src/lib/config.js';

beforeEach(() => {
  setConfig(defaultConfig);
});

describe('config', () => {
  it('object exists', () => {
    expect(typeof config).toBe('object');
  });
});

describe('defaultConfig', () => {
  it('object exists and has correct properties', () => {
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
  it('returns the current Config object', () => {
    expect(getConfig()).toEqual(config);
  });

  it('reflects changes after setConfig', () => {
    const newOptions = { verbose: true };
    setConfig(newOptions);
    expect(getConfig().verbose).toBe(true);
  });
});

describe('setConfig', () => {
  it('merges default config with provided valid options', () => {
    const options = { diskWrite: false, backupInterval: 5 };
    setConfig(options);
    expect(config).toEqual({
      ...defaultConfig,
      ...options,
    });
  });

  it('accepts valid types for properties', () => {
    expect(() => setConfig({ verbose: true })).not.toThrow();
    expect(() => setConfig({ strict: false })).not.toThrow();
    expect(() => setConfig({ dataDirectory: '/tmp' })).not.toThrow();
  });

  it('throws error for invalid types', () => {
    expect(() => setConfig('invalid')).toThrow();
    expect(() => setConfig({ invalidKey: true })).toThrow();

    expect(() => setConfig({ verbose: 'not boolean' })).toThrow();
    expect(() => setConfig({ strict: 'yes' })).toThrow();
    expect(() => setConfig({ dataDirectory: 123 })).toThrow();
  });

  it('throws error for invalid diskWriteThrottle values', () => {
    expect(() => setConfig({ diskWriteThrottle: 40 })).toThrow();
    expect(() => setConfig({ diskWriteThrottle: 3010 })).toThrow();
  });

  it('throws error for invalid backupInterval values', () => {
    expect(() => setConfig({ backupInterval: 0 })).toThrow();
    expect(() => setConfig({ backupInterval: 25 })).toThrow();
  });
});
