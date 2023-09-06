const middlewares = [];

const registerMiddleware = (type, collection, method, fn) => {
  if (Array.isArray(method)) {
    for (const itemMethod of method) {
      registerMiddleware(type, collection, itemMethod, fn);
    }
  } else {
    if (
      ['pre', 'post'].includes(type) &&
      typeof method === 'string' &&
      typeof collection === 'string' &&
      typeof fn === 'function'
    ) {
      middlewares.push({ type, collection, method, fn });
    }
  }
};

const executeMiddleware = async (type, collection, method, res) => {
  try {
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
  } catch (e) {
    throw e;
  }
};

module.exports = {
  registerMiddleware,
  executeMiddleware,
};
