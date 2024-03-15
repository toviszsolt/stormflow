const { getType } = require('../utils/type');

const middlewares = [];

const registerMiddleware = (type, collection, method, fn) => {
  if (getType(method) === 'array') {
    return method.forEach((el) => {
      registerMiddleware(type, collection, el, fn);
    });
  }

  if (String(type) && String(collection) && String(method) && getType(fn) === 'function') {
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
