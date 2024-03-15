const { getType } = require('../utils/type');

const middlewares = [];

const allowedTypes = ['pre', 'post'];
const allowedMethods = ['create', 'update'];

const registerMiddleware = (type, collection, method, fn) => {
  if (getType(method) === 'array') {
    return method.forEach((el) => {
      registerMiddleware(type, collection, el, fn);
    });
  }

  if (
    allowedTypes.includes(type) &&
    allowedMethods.includes(method) &&
    getType(collection) === 'string' &&
    getType(fn) === 'function'
  ) {
    return middlewares.push({ type, collection, method, fn });
  }
};

const executeMiddleware = async (type, collection, method, res) => {
  let currentIndex = -1;

  const result = middlewares.filter((el) => {
    return el.type === type && el.collection === collection && el.method === method;
  });

  const next = async () => {
    currentIndex++;
    if (currentIndex < result.length) {
      await result[currentIndex].fn(res, next);
    }
  };

  if (result.length > 0) {
    await next();
  } else {
    return res;
  }
};

module.exports = {
  registerMiddleware,
  executeMiddleware,
};
