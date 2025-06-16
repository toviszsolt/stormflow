import { config, defaultConfig, getConfig, setConfig } from './lib/config.js';
import model from './lib/model.js';
import { Schema } from './lib/schema.js';
import { diskStats, initFileStorage } from './lib/storage.js';

import * as hashUtils from './utils/hash.js';
import * as objectUtils from './utils/object.js';
import * as typeUtils from './utils/type.js';
import * as unixtimeUtils from './utils/unixtime.js';

const utils = {
  ...hashUtils,
  ...objectUtils,
  ...typeUtils,
  ...unixtimeUtils,
};

let init = false;

/**
 * Initializes Stormflow with the given options.
 * @param {import('./lib/config.js').Config} options - The options to merge.
 * @throws {Error} If invalid options are provided.
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

export default {
  start,
  getConfig,
  setConfig,
  Schema,
  model,
  stats: diskStats,
  utils,
};
