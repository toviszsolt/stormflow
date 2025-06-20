import { objClone } from './object.js';
import { getType } from './type.js';

/**
 * Létrehoz egy konfigurációkezelő objektumot closure-ral.
 * @param {Object} defaultConfig - Az alapértelmezett konfiguráció.
 * @returns {Object} Konfigurációkezelő API
 */
const configManager = (defaultConfig = {}) => {
  if (getType(defaultConfig) !== 'object') {
    throw new Error('defaultConfig must be an object');
  }

  let _defaultConfig = objClone(defaultConfig);
  let _config = objClone(defaultConfig);

  const mergeOptions = (options) => {
    const allowedKeys = Object.keys(_defaultConfig);
    if (getType(options) !== 'object') {
      throw new Error('Invalid type of options. Expected type is "object"');
    }
    Object.keys(options).forEach((key) => {
      if (!allowedKeys.includes(key)) {
        const allowedKeysAsString = allowedKeys.join('", "');
        throw new Error(`Invalid "${key}" key in options.\r\nAllowed keys: "${allowedKeysAsString}"`);
      }
      const typeDefault = getType(_defaultConfig[key]);
      const typeOptions = getType(options[key]);
      if (typeOptions !== typeDefault) {
        throw new Error(`Invalid type of "${key}" key in options. Expected type is ${typeDefault}`);
      }
    });
  };

  return {
    /**
     * Visszaadja az alapértelmezett konfiguráció másolatát.
     * @returns {Object}
     */
    getDefaultConfig() {
      return objClone(_defaultConfig);
    },
    /**
     * Visszaállítja a konfigurációt az alapértelmezettre.
     */
    resetConfig() {
      _config = objClone(_defaultConfig);
    },
    /**
     * Visszaadja az aktuális konfiguráció másolatát.
     * @returns {Object}
     */
    getConfig() {
      return objClone(_config);
    },
    /**
     * Beállítja a konfigurációt az opciókkal.
     * @param {Object} options
     */
    setConfig(options) {
      mergeOptions(options);
      Object.assign(_config, _defaultConfig, options);
    },
    /**
     * Lekér egy konfigurációs értéket.
     * @param {string} key
     * @returns {*}
     */
    get(key) {
      return _config[key];
    },
    /**
     * Beállít egy konfigurációs értéket.
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
      _config[key] = value;
    },
  };
};

export default configManager;
