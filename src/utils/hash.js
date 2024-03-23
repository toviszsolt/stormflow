const crypto = require('crypto');

/**
 * Generates a unique crc32 hash.
 * @returns {string} A unique id.
 */
const uniqueId = () => {
  return crypto.randomBytes(6).toString('hex');
};

module.exports = { uniqueId };
