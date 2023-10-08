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

  if (query.$not && Array.isArray(query.$not)) {
    const exclude = query.$not.map((query) => applyQuery(collection, query));
    return collection.filter((item) => exclude.every((result) => !result.includes(item)));
  }

  if (query.$nor && Array.isArray(query.$nor)) {
    const exclude = query.$nor.map((query) => applyQuery(collection, query));
    return collection.filter((item) => exclude.every((result) => !result.includes(item)));
  }

  return collection.filter((item) => {
    return Object.keys(query).every((key) => {
      const value = query[key];
      if (typeof value === 'object') {
        if (value.$eq) return item[key] === value.$eq;
        if (value.$ne) return item[key] !== value.$ne;
        if (value.$in) return value.$in.includes(item[key]);
        if (value.$nin) return !value.$nin.includes(item[key]);
        if (value.$lt) return item[key] < value.$lt;
        if (value.$lte) return item[key] <= value.$lte;
        if (value.$gt) return item[key] > value.$gt;
        if (value.$gte) return item[key] >= value.$gte;
        if (value.$regex) {
          const regex = new RegExp(value.$regex, value?.$options);
          return regex.test(item[key]);
        }
      } else {
        return item[key] === value;
      }
    });
  });
};

module.exports = { applyQuery };
