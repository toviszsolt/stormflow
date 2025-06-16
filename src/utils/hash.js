import crypto from 'crypto';

/**
 * Generates a unique hash id.
 * @returns {string} A unique id.
 */
const uniqueId = () => {
  return crypto.randomBytes(6).toString('hex');
};

export { uniqueId };
