const path = require('path');
const { objClone } = require('../utils/object');
const { getType } = require('../utils/type');

/**
 * @typedef {Object} Config
 * @property {boolean} [strict=true] Strict validation when applying a schema to data
 * @property {string} [dataDirectory="./data"] - The directory where data is stored.
 * @property {boolean} [diskWrite=true] - Indicates whether disk writing is enabled.
 * @property {number} [diskWriteThrottle=100] - Throttling time for disk writes in milliseconds.
 * @property {boolean} [backupFiles=true] - Indicates whether file backups are enabled.
 * @property {number} [backupInterval=10] - Interval for file backups in minutes.
 * @property {boolean} [defaultFields=true] - Indicates whether default fields are used.
 * @property {boolean} [verbose=false] - Indicates whether verbose mode is enabled.
 */
const config = {};

/**
 * @typedef {Config} DefaultConfig
 */
const defaultConfig = {
  strict: true,
  dataDirectory: path.join(process.cwd(), './data'),
  diskWrite: true,
  diskWriteThrottle: 100,
  backupFiles: true,
  backupInterval: 10,
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
  const { diskWriteThrottle, backupInterval } = options;
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

  if (diskWriteThrottle != undefined && (diskWriteThrottle < 50 || diskWriteThrottle > 3000)) {
    const msg = 'Invalid value of "diskWriteThrottle". It should be between 50 and 3000 in milliseconds.';
    throw new Error(msg);
  }

  if (backupInterval != undefined && (backupInterval < 1 || backupInterval > 24)) {
    const msg = 'Invalid value of "backupInterval". It should be between 1 and 24 in minutes.';
    throw new Error(msg);
  }

  Object.assign(config, defaultConfig, options);
};

module.exports = { config, defaultConfig, setConfig, getConfig };
