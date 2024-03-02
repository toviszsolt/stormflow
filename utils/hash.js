const { crc32 } = require('crc');

/**
 * Generates a crc32 like unique id.
 * @returns {string} A unique id.
 */
const uniqueId = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const randomCharacter = alphabet[Math.floor(Math.random() * alphabet.length)];
  const randomHash = Math.random().toString(36).substring(2, 10);
  const timeStamp = Date.now().toString();

  return crc32(randomCharacter + randomHash + timeStamp).toString(16);
};

module.exports = { uniqueId };
