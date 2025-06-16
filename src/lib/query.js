import { objPathResolve } from '../utils/object.js';
import { getType } from '../utils/type.js';

const applyQuery = (collection, query) => {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    return collection;
  }

  if (getType(query.$and) === 'array') {
    return query.$and.reduce((acc, andQuery) => {
      const results = applyQuery(collection, andQuery);
      return acc.filter((el) => results.includes(el));
    }, collection);
  }

  if (getType(query.$or) === 'array') {
    return query.$or.map((el) => applyQuery(collection, el)).flat();
  }

  if (getType(query.$not) === 'object') {
    const exclude = applyQuery(collection, query.$not);
    return collection.filter((el) => !exclude.includes(el));
  }

  if (getType(query.$nor) === 'array') {
    const exclude = query.$nor.map((query) => applyQuery(collection, query));
    return collection.filter((el) => exclude.every((result) => !result.includes(el)));
  }

  return collection.filter((el) => {
    return Object.keys(query).every((key) => {
      const condition = query[key];
      const value = objPathResolve(el, key);

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

export { applyQuery };
