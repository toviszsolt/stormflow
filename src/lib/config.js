import path from 'path';
import { objClone } from '../utils/object.js';
import { getType } from '../utils/type.js';

/**
 * @typedef {Object} Config
 * @property {boolean} [strict=true] Strict validation when applying a schema to data
 * @property {boolean} [defaultFields=true] Indicates whether default fields are used.
 * @property {boolean} [verbose=false] Indicates whether verbose mode is enabled.
 */
const config = {};

/**
 * @typedef {Config} DefaultConfig
 */
const defaultConfig = {
  strict: true,
  defaultFields: true,
  verbose: false,
};

/**
 * Returns a clone of the current configuration.
 * @returns {Config} The cloned configuration.
 */
const getConfig = () => objClone(config);

/**
 * Merges the provided options with the default configuration.
 * @param {Config} options - The options to merge.
 * @throws {Error} If invalid options are provided.
 * @returns {void}
 */
const setConfig = (options) => {
  const allowedKeys = Object.keys(defaultConfig);

  if (getType(options) !== 'object') {
    const msg = 'Invalid type of options. Expexted type is "object"';
    throw new Error(msg);
  }

  Object.keys(options).forEach((key) => {
    const typeDefault = getType(defaultConfig[key]);
    const typeOptions = getType(options[key]);

    if (!allowedKeys.includes(key)) {
      const allowedKeysAsString = Object.keys(defaultConfig).join('", "');
      const msg = `Invalid "${key}" key in options.` + '\r\n' + `Allowed keys: "${allowedKeysAsString}`;
      throw new Error(msg);
    }

    if (typeOptions !== typeDefault) {
      const msg = `Invalid type of "${key}" key in options. Expected type is ${typeDefault}`;
      throw new Error(msg);
    }
  });

  Object.assign(config, defaultConfig, options);
};

export { config, defaultConfig, getConfig, setConfig };
