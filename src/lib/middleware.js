const { uniqueId } = require('../utils/hash');
const { getType } = require('../utils/type');

const middlewares = new Map();

const allowedTypes = ['pre', 'post'];
const allowedMethods = ['create', 'read', 'update', 'replace', 'delete'];

const registerMiddleware = (type, collection, method, fn) => {
  if (getType(method) === 'array') {
    return method.map((el) => registerMiddleware(type, collection, el, fn));
  }

  if (!allowedTypes.includes(type)) {
    throw new Error(`Invalid middleware type: ${type}`);
  }

  if (getType(collection) !== 'string') {
    throw new Error(`Invalid middleware collection: ${collection}`);
  }

  if (getType(method) !== 'string' || !allowedMethods.includes(method)) {
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
  for (const middleware of middlewares.values()) {
    if (middleware.type === type && middleware.collection === collection && middleware.method === method) {
      results.push(middleware);
    }
  }

  for (const el of results) {
    await el.fn(res);
  }
};

const executeMiddleware = async (type, collection, method, res) => {
  const results = getType(res) === 'array' ? res : [res];

  for (const el of results) {
    await executeOneMiddleware(type, collection, method, el);
  }
};

module.exports = {
  registerMiddleware,
  unregisterMiddleware,
  executeMiddleware,
};
