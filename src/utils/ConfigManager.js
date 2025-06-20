import { objClone } from './object.js';
import { getType } from './type.js';

/**
 * ConfigManager class for managing application configuration.
 * @class
 */
class ConfigManager {
  constructor(defaultConfig = {}) {
    if (getType(defaultConfig) !== 'object') {
      throw new Error('defaultConfig must be an object');
    }

    this.defaultConfig = objClone(defaultConfig);
    this.config = objClone(defaultConfig);
  }

  /**
   * Returns a clone of the current configuration.
   * @returns {Object} The cloned configuration.
   */
  getConfig() {
    return objClone(this.config);
  }

  /**
   * Validates the provided options against the allowed keys and types.
   * @param {Object} options - The options to validate.
   * @throws {Error} If invalid options are provided.
   */
  mergeOptions(options) {
    const allowedKeys = Object.keys(this.defaultConfig);

    if (getType(options) !== 'object') {
      throw new Error('Invalid type of options. Expected type is "object"');
    }

    Object.keys(options).forEach((key) => {
      if (!allowedKeys.includes(key)) {
        const allowedKeysAsString = allowedKeys.join('", "');
        throw new Error(`Invalid "${key}" key in options.\r\nAllowed keys: "${allowedKeysAsString}"`);
      }

      const typeDefault = getType(this.defaultConfig[key]);
      const typeOptions = getType(options[key]);

      if (typeOptions !== typeDefault) {
        throw new Error(`Invalid type of "${key}" key in options. Expected type is ${typeDefault}`);
      }
    });
  }

  /**
   * Merges the provided options with the default configuration.
   * @param {Object} options - The options to merge.
   * @returns {void}
   */
  setConfig(options) {
    this.mergeOptions(options);
    Object.assign(this.config, this.defaultConfig, options);
  }

  /**
   * Resets the configuration to the default values.
   * @returns {void}
   */
  resetConfig() {
    this.config = objClone(this.defaultConfig);
  }
}

export default ConfigManager;
