import configManager from '../utils/configManager.js';

const config = configManager({
  strict: true,
  defaultFields: true,
  verbose: false,
});

export default config;
