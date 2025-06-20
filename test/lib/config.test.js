import config from '../../src/lib/config.js';

const { getDefaultConfig, getConfig, setConfig } = config;

describe('defaultConfig', () => {
  it('should have the correct default keys', () => {
    const defaultConfig = getDefaultConfig();
    expect(defaultConfig).toHaveProperty('strict');
    expect(defaultConfig).toHaveProperty('defaultFields');
    expect(defaultConfig).toHaveProperty('verbose');
  });
});

describe('setConfig', () => {
  it('should merge options with defaultConfig', () => {
    setConfig({ strict: false, verbose: true });
    const currentConfig = getConfig();
    expect(currentConfig.strict).toBe(false);
    expect(currentConfig.verbose).toBe(true);
    expect(currentConfig.defaultFields).toBe(true);
  });

  it('should throw error for invalid type', () => {
    expect(() => setConfig('not-an-object')).toThrow();
  });

  it('should throw error for invalid key', () => {
    expect(() => setConfig({ notAKey: true })).toThrow();
  });

  it('should throw error for invalid type of value', () => {
    expect(() => setConfig({ strict: 'yes' })).toThrow();
  });
});
