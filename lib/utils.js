const { crc32 } = require('crc');

const unixTimeStamp = () => Math.floor(new Date().getTime() / 1000);

const deepClone = (obj) => JSON.parse(JSON.stringify(obj || null));

function generateUniqueId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const randomCharacter = alphabet[Math.floor(Math.random() * alphabet.length)];

  return (
    randomCharacter +
    crc32(Math.random().toString(36).substring(2, 7) + Date.now().toString()).toString(16)
  );
}

module.exports = {
  unixTimeStamp,
  deepClone,
  generateUniqueId,
};
