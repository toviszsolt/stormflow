const applyQuery = (collection, query) => {
  if (!query) return collection;

  if (query.$or && Array.isArray(query.$or)) {
    const orQueries = query.$or;
    const orResults = orQueries.map((orQuery) => {
      return applyQuery(collection, orQuery);
    });
    return orResults.reduce((acc, curr) => acc.concat(curr), []);
  }

  let result = [...collection];

  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      const value = query[key];

      if (typeof value === 'object') {
        if (value.$in !== undefined && Array.isArray(value.$in)) {
          result = result.filter((el) => value.$in.includes(el[key]));
        } else if (value.$lt !== undefined) {
          result = result.filter((el) => el[key] < value.$lt);
        } else if (value.$lte !== undefined) {
          result = result.filter((el) => el[key] <= value.$lte);
        } else if (value.$gt !== undefined) {
          result = result.filter((el) => el[key] > value.$gt);
        } else if (value.$gte !== undefined) {
          result = result.filter((el) => el[key] >= value.$gte);
        } else if (value.$regex !== undefined && value.$options !== undefined) {
          const regex = new RegExp(value.$regex, value.$options);
          result = result.filter((el) => regex.test(el[key]));
        }
      } else {
        result = result.filter((el) => el[key] === value);
      }
    }
  }

  return result;
};

module.exports = { applyQuery };
