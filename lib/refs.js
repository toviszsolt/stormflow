const { data } = require('./storage');
const { deepClone } = require('./utils');

const resolveRefs = (items) => {
  const deepCloneItems = deepClone(items);

  const resolveRecursively = (input) => {
    if (input && typeof input === 'object') {
      for (const key in input) {
        if (input[key] && input[key]._ref) {
          const { collection, id } = input[key]._ref;
          const refCollection = data[collection];
          if (refCollection) {
            const refItem = refCollection.find((el) => el._id === id);
            if (refItem) {
              const { _ref, ...rest } = refItem;
              input[key] = rest;
            }
          }
        } else if (Array.isArray(input[key])) {
          input[key] = resolveRecursively(input[key]);
        } else if (input[key] && typeof input[key] === 'object') {
          input[key] = resolveRecursively(input[key]);
        }
      }
    }
    return input;
  };

  return deepClone(resolveRecursively(deepCloneItems));
};

module.exports = { resolveRefs };
