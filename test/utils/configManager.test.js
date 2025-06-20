import configManager from '../../src/utils/configManager.js';

describe('ConfigManager', () => {
  const defaultConfig = { strict: true, verbose: false };
  let config;

  beforeEach(() => {
    config = configManager(defaultConfig);
  });

  it('should initialize with default configuration', () => {
    const result = config.getConfig();
    expect(result).toEqual(defaultConfig);
  });

  it('should initialize with default configuration when no parameters are provided', () => {
    const configManagerWithoutParams = configManager();
    const result = configManagerWithoutParams.getConfig();
    expect(result).toEqual({});
  });

  it('should throw error if defaultConfig is not an object', () => {
    expect(() => configManager('not-an-object')).toThrow(/defaultConfig must be an object/);
  });

  it('should merge valid options into configuration', () => {
    const options = { strict: false };
    config.setConfig(options);
    const result = config.getConfig();
    expect(result.strict).toBe(false);
    expect(result.verbose).toBe(false);
  });

  it('should accept valid option types and keys', () => {
    const options = { strict: false, verbose: true };
    config.setConfig(options);
    const result = config.getConfig();
    expect(result.strict).toBe(false);
    expect(result.verbose).toBe(true);
  });

  it('should update value if type matches default', () => {
    const configWithDefault = configManager({ foo: 42 });
    configWithDefault.setConfig({ foo: 100 });
    const result = configWithDefault.getConfig();
    expect(result.foo).toBe(100);
  });

  it('should set a specific key to a new value', () => {
    config.set('strict', false);
    const result = config.getConfig();
    expect(result.strict).toBe(false);
  });

  it('should reset configuration to default values', () => {
    const options = { strict: false };
    config.setConfig(options);
    config.resetConfig();
    const result = config.getConfig();
    expect(result).toEqual(defaultConfig);
  });

  it('should handle empty options object', () => {
    const options = {};
    config.setConfig(options);
    const result = config.getConfig();
    expect(result).toEqual(defaultConfig);
  });

  it('should throw error for invalid option keys', () => {
    const options = { invalidKey: true };
    expect(() => config.setConfig(options)).toThrow(/Invalid \"invalidKey\" key/);
  });

  it('should throw error for invalid option types', () => {
    const options = { strict: 'not-a-boolean' };
    expect(() => config.setConfig(options)).toThrow(/Invalid type of \"strict\" key/);
  });

  it('should throw error for undefined option value', () => {
    const options = { strict: undefined };
    expect(() => config.setConfig(options)).toThrow(/Invalid type of "strict" key/);
  });

  it('should throw error for null options', () => {
    expect(() => config.setConfig(null)).toThrow(/Invalid type of options/);
  });

  it('should throw error for undefined options', () => {
    expect(() => config.setConfig(undefined)).toThrow(/Invalid type of options/);
  });

  it('should throw error if setting any key when default config is empty', () => {
    const emptyConfig = configManager({});
    expect(() => emptyConfig.setConfig({ foo: 1 })).toThrow(/Invalid "foo" key/);
  });

  it('should accept undefined value if default is also undefined', () => {
    const configWithUndefined = configManager({ foo: undefined });
    expect(() => configWithUndefined.setConfig({ foo: undefined })).not.toThrow();
    const result = configWithUndefined.getConfig();
    expect(result).toHaveProperty('foo', undefined);
  });
});
