import { objPathResolve } from '../utils/object.js';
import { getType } from '../utils/type.js';

const getValue = (obj, key) => {
  if (key.includes('.')) return objPathResolve(obj, key);
  return obj[key];
};

const applyQuery = (collection, query) => {
  const dataSet = collection instanceof Map ? Array.from(collection.values()) : collection;
  if (getType(query) !== 'object') return dataSet;
  const queryKeys = Object.keys(query);

  if (queryKeys.length === 1 && query._id !== undefined) {
    return [collection.get(query._id)];
  }

  if (getType(query.$and) === 'array') {
    return dataSet.filter((el) => query.$and.every((andQuery) => applyQuery([el], andQuery).length));
  }

  if (getType(query.$or) === 'array') {
    const resultSet = new Set();
    for (const orQuery of query.$or) {
      for (const el of applyQuery(dataSet, orQuery)) {
        resultSet.add(el);
      }
    }
    return Array.from(resultSet);
  }

  if (getType(query.$not) === 'object') {
    const exclude = new Set(applyQuery(dataSet, query.$not));
    return dataSet.filter((el) => !exclude.has(el));
  }

  if (getType(query.$nor) === 'array') {
    const exclude = new Set();
    for (const norQuery of query.$nor) {
      for (const el of applyQuery(dataSet, norQuery)) {
        exclude.add(el);
      }
    }
    return dataSet.filter((el) => !exclude.has(el));
  }

  return dataSet.filter((el) => {
    return queryKeys.every((key) => {
      const condition = query[key];
      const value = getValue(el, key);
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
