const fs = require('fs');
const crypto = require('crypto');

/**
 * UNUSED MODULE
 *
 * This is just a sketch, the project does not use this module
 *
 * UNUSED MODULE
 */

const key = 'MySuperSecretKey';
const secret_iv = 'MySuperSecretIV';
const algorithm = 'aes-256-cbc';
const secretKey = crypto.createHash('sha256').update(key).digest('hex').substring(0, 32);
const encryptionIV = crypto.createHash('sha512').update(secret_iv).digest('hex').substring(0, 16);

function encryptFile(inputPath, outputPath) {
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);
  const cipher = crypto.createCipheriv(algorithm, secretKey, encryptionIV);

  input.pipe(cipher).pipe(output);
}

function decryptFile(inputPath, outputPath) {
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);
  const decipher = crypto.createDecipheriv(algorithm, secretKey, encryptionIV);

  input.pipe(decipher).pipe(output);
}

// const inputFile = 'data.json.gz';
// const encryptedFile = 'data_encrypted.db';
// const decryptedFile = 'data_decrypted.db';

// encryptFile(inputFile, encryptedFile);
// decryptFile(encryptedFile, decryptedFile);

module.exports = { encryptFile, decryptFile };
