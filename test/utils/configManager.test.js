import ConfigManager from '../../src/utils/ConfigManager.js';

describe('ConfigManager', () => {
  const defaultConfig = { strict: true, verbose: false };
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager(defaultConfig);
  });

  it('should initialize with default configuration', () => {
    const config = configManager.getConfig();
    expect(config).toEqual(defaultConfig);
  });

  it('should merge valid options into configuration', () => {
    const options = { strict: false };
    configManager.setConfig(options);
    const config = configManager.getConfig();
    expect(config.strict).toBe(false);
    expect(config.verbose).toBe(false);
  });

  it('should throw error for invalid option keys', () => {
    const options = { invalidKey: true };
    expect(() => configManager.setConfig(options)).toThrow(/Invalid \"invalidKey\" key/);
  });

  it('should throw error for invalid option types', () => {
    const options = { strict: 'not-a-boolean' };
    expect(() => configManager.setConfig(options)).toThrow(/Invalid type of \"strict\" key/);
  });

  it('should reset configuration to default values', () => {
    const options = { strict: false };
    configManager.setConfig(options);
    configManager.resetConfig();
    const config = configManager.getConfig();
    expect(config).toEqual(defaultConfig);
  });

  it('should handle empty options object', () => {
    const options = {};
    configManager.setConfig(options);
    const config = configManager.getConfig();
    expect(config).toEqual(defaultConfig);
  });

  it('should throw error for null options', () => {
    expect(() => configManager.setConfig(null)).toThrow(/Invalid type of options/);
  });

  it('should throw error if defaultConfig is not an object', () => {
    expect(() => new ConfigManager('not-an-object')).toThrow(/defaultConfig must be an object/);
  });

  it('should initialize with default configuration when no parameters are provided', () => {
    const configManagerWithoutParams = new ConfigManager();
    const config = configManagerWithoutParams.getConfig();
    expect(config).toEqual({});
  });
});
