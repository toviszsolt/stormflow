const { getType } = require('../utils/type');

const middlewares = [];

const registerMiddleware = (type, collection, method, fn) => {
  if (getType(method) === 'array') {
    return method.forEach((el) => {
      registerMiddleware(type, collection, el, fn);
    });
  }

  if (
    getType(type) === 'string' &&
    getType(collection) === 'string' &&
    getType(method) === 'string' &&
    getType(fn) === 'function'
  ) {
    middlewares.push({ type, collection, method, fn });
  }
};

const executeOneMiddleware = async (type, collection, method, res) => {
  const results = middlewares.filter((el) => {
    return el.type === type && el.collection === collection && el.method === method;
  });

  for (const el of results) {
    if (el.fn.length === 2) {
      await new Promise((resolve, reject) => {
        el.fn(res, (err) => (err ? reject(err) : resolve()));
      });
    } else {
      el.fn(res);
    }
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
  executeMiddleware,
};
