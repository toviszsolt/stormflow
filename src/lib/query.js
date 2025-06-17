import { objPathResolve } from '../utils/object.js';
import { getType } from '../utils/type.js';

const applyQuery = (collection, query) => {
  const dataSet = collection instanceof Map ? Array.from(collection.values()) : collection;

  if (getType(query) !== 'object') return dataSet;

  const queryKeys = Object.keys(query);

  if (queryKeys.length === 1 && query._id !== undefined) {
    return [collection.get(query._id)];
  }

  if (getType(query.$and) === 'array') {
    return query.$and.reduce((acc, andQuery) => {
      const results = applyQuery(acc, andQuery);
      return acc.filter((el) => results.includes(el));
    }, dataSet);
  }

  if (getType(query.$or) === 'array') {
    return query.$or.map((el) => applyQuery(dataSet, el)).flat();
  }

  if (getType(query.$not) === 'object') {
    const exclude = applyQuery(dataSet, query.$not);
    return dataSet.filter((el) => !exclude.includes(el));
  }

  if (getType(query.$nor) === 'array') {
    const exclude = query.$nor.map((query) => applyQuery(dataSet, query));
    return dataSet.filter((el) => exclude.every((result) => !result.includes(el)));
  }

  return dataSet.filter((el) => {
    return queryKeys.every((key) => {
      const condition = query[key];
      const value = objPathResolve(el, key);

      if (['object', 'array'].includes(getType(condition))) {
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
