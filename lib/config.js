const path = require('path');

const config = {};

const defaultConfig = {
  dataDirectory: path.join(process.cwd(), './data'),
  diskWrite: true,
  diskWriteThrottle: 100,
  backupFiles: true,
  backupInterval: 10,
  defaultFields: true,
  verbose: false,
};

const mergeConfig = (options) => {
  const validKeys = Object.keys(defaultConfig);

  if (typeof options !== 'object' || options === null) {
    throw new Error('Invalid options. An object is expected.');
  }

  for (const key in options) {
    if (!validKeys.includes(key) || typeof options[key] !== typeof defaultConfig[key]) {
      throw new Error(`Invalid key "${key}" in options.}`);
    }
  }

  if (
    options.diskWriteThrottle &&
    (options.diskWriteThrottle < 50 || options.diskWriteThrottle > 3000)
  ) {
    throw new Error(
      'Invalid value for diskWriteThrottle. It should be between 50 and 3000 in milliseconds.',
    );
  }

  if (options.backupInterval && (options.backupInterval < 1 || options.backupInterval > 24)) {
    throw new Error('Invalid value for backupInterval. It should be between 1 and 24 in minutes.');
  }

  Object.assign(config, defaultConfig, options);
};

module.exports = { config, defaultConfig, mergeConfig };
