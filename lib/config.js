const path = require('path');
const { objClone } = require('../utils/object');

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
  const validKeys = Object.keys(defaultConfig);

  if (typeof options !== 'object' || options === null) {
    const msg = 'Invalid options. An object is expected.';
    throw new Error(msg);
  }

  for (const key in options) {
    if (!validKeys.includes(key) || typeof options[key] !== typeof defaultConfig[key]) {
      const msg =
        `Invalid key "${key}" in options.` +
        '\r\n' +
        `Allowed keys: "${Object.keys(defaultConfig).join('", "')}`;
      throw new Error(msg);
    }
  }

  if (
    options.diskWriteThrottle != null &&
    (options.diskWriteThrottle < 50 || options.diskWriteThrottle > 3000)
  ) {
    const msg =
      'Invalid value for diskWriteThrottle. It should be between 50 and 3000 in milliseconds.';
    throw new Error(msg);
  }

  if (
    options.backupInterval != null &&
    (options.backupInterval < 1 || options.backupInterval > 24)
  ) {
    const msg = 'Invalid value for backupInterval. It should be between 1 and 24 in minutes.';
    throw new Error(msg);
  }

  Object.assign(config, defaultConfig, options);
};

module.exports = { config, defaultConfig, setConfig, getConfig };
