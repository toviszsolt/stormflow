import { config, defaultConfig, getConfig, setConfig } from './lib/config.js';
import model from './lib/model.js';
import { Schema } from './lib/schema.js';
import { initAdapters } from './storage/storage.js';

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
 * Initializes the Stormflow system with the provided configuration and adapters.
 *
 * @async
 * @param {Object} [options=defaultConfig] - Configuration options for Stormflow.
 * @param {Object|null} [storageAdapter=null] - Custom storage adapter to use, or null for default.
 * @param {Object|null} [backupAdapter=null] - Custom backup adapter to use, or null for default.
 * @returns {Promise<void>} Resolves when initialization is complete.
 */
const start = async (options = defaultConfig, storageAdapter = null, backupAdapter = null) => {
  if (!init) {
    init = true;
    setConfig(options);
    await initAdapters({ storageAdapter, backupAdapter });
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
  utils,
};
