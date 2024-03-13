const model = require('./lib/model');
const { defaultConfig, config, getConfig, setConfig } = require('./lib/config');
const { diskStats, initFileStorage } = require('./lib/storage');
const { Schema } = require('./lib/shema');
const utils = {
  ...require('./utils/hash'),
  ...require('./utils/object'),
  ...require('./utils/type'),
  ...require('./utils/unixtime'),
};

let init = false;

/**
 * Initializes Stormflow with the given options.
 * @param {object} [options=defaultConfig] - The options to use for initializing Stormflow.
 * @returns {void}
 */
const start = (options = defaultConfig) => {
  if (!init) {
    init = true;
    setConfig(options);
    initFileStorage();
  } else if (config.strict) {
    const msg = 'Stormflow is already initialized.';
    throw new Error(msg);
  }
};

module.exports = {
  start,
  getConfig,
  setConfig,
  Schema,
  model,
  stats: diskStats,
  utils,
};
