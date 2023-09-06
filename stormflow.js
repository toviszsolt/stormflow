const { defaultConfig, mergeConfig } = require('./lib/config');
const { diskStats, initFileStorage } = require('./lib/storage');
const { Schema } = require('./lib/shema');
const model = require('./lib/model');

let init = false;

const start = (options = defaultConfig) => {
  if (!init) {
    init = true;
    mergeConfig(options);
    initFileStorage();
  }
};

module.exports = {
  start,
  Schema,
  model,
  stats: diskStats,
};
