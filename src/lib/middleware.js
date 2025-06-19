import { uniqueId } from '../utils/hash.js';
import { getType } from '../utils/type.js';

const middlewares = new Map();

const allowedTypes = ['pre', 'post'];
const allowedMethods = ['create', 'read', 'update', 'replace', 'delete'];

const isAllowedType = (val) => allowedTypes.includes(val);
const isAllowedMethod = (val) => val === '*' || allowedMethods.includes(val);

const registerMiddleware = (type, collection, method, fn) => {
  if (getType(method) === 'array') {
    return method.map((el) => registerMiddleware(type, collection, el, fn));
  }

  if (!isAllowedType(type)) {
    throw new Error(`Invalid middleware type: ${type}`);
  }

  if (getType(collection) !== 'string' || collection === '*') {
    throw new Error(`Invalid middleware collection: ${collection}`);
  }

  if (!isAllowedMethod(method)) {
    throw new Error(`Invalid middleware method: ${method}`);
  }

  if (getType(fn) !== 'function') {
    throw new Error(`Invalid middleware function: ${fn}`);
  }

  const id = uniqueId();
  middlewares.set(id, { type, collection, method, fn });
  return id;
};

const unregisterMiddleware = (id) => {
  if (getType(id) !== 'string') {
    throw new Error(`Invalid middleware id: ${id}`);
  }

  return middlewares.delete(id);
};

const executeOneMiddleware = async (type, collection, method, res) => {
  const results = [];
  for (const mw of middlewares.values()) {
    if (mw.type === type && mw.collection === collection && (mw.method === '*' || mw.method === method)) {
      results.push(mw);
    }
  }

  for (const el of results) {
    await el.fn(res);
  }
};

const executeMiddleware = async (type, collection, method, res) => {
  const results = getType(res) === 'array' ? res : [res];
  await Promise.all(results.map((el) => executeOneMiddleware(type, collection, method, el)));
};

export { executeMiddleware, registerMiddleware, unregisterMiddleware };
