const { objPathResolve } = require('../utils/object');

const applyQuery = (collection, query) => {
  if (!query) return collection;

  if (query.$and && Array.isArray(query.$and)) {
    return query.$and.reduce((acc, andQuery) => {
      const results = applyQuery(collection, andQuery);
      return acc.filter((item) => results.includes(item));
    }, collection);
  }

  if (query.$or && Array.isArray(query.$or)) {
    return query.$or.map((item) => applyQuery(collection, item)).flat();
  }

  if (query.$not && typeof query.$not === 'object' && !Array.isArray(query.$not)) {
    const exclude = applyQuery(collection, query.$not);
    return collection.filter((item) => !exclude.includes(item));
  }

  if (query.$nor && Array.isArray(query.$nor)) {
    const exclude = query.$nor.map((query) => applyQuery(collection, query));
    return collection.filter((item) => exclude.every((result) => !result.includes(item)));
  }

  return collection.filter((item) => {
    return Object.keys(query).every((key) => {
      const condition = query[key];
      const value = objPathResolve(item, key);

      if (typeof condition === 'object') {
        if (condition.$eq !== undefined) return value === condition.$eq;
        if (condition.$ne !== undefined) return value !== condition.$ne;
        if (condition.$in !== undefined) return condition.$in.includes(value);
        if (condition.$nin !== undefined) return !condition.$nin.includes(value);
        if (condition.$lt !== undefined) return value < condition.$lt;
        if (condition.$lte !== undefined) return value <= condition.$lte;
        if (condition.$gt !== undefined) return value > condition.$gt;
        if (condition.$gte !== undefined) return value >= condition.$gte;
        if (condition.$regex !== undefined) {
          const regex = new RegExp(condition.$regex, condition?.$options);
          return regex.test(value);
        }
      } else {
        return value === condition;
      }
    });
  });
};

module.exports = { applyQuery };
