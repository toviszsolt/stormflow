const { objClone, objTraverse, objPathSet } = require('../utils/object');
const { getType } = require('../utils/type');
const { data } = require('./storage');

const resolveRefs = (items) => {
  if (['object', 'array'].includes(getType(items))) {
    const clone = objClone(items);

    objTraverse(clone, ({ key, value, parent, path }) => {
      if (getType(value) === 'object' && value._ref) {
        const { collection, id } = value._ref;
        const collectionRef = data[collection];
        delete parent[key];

        if (collectionRef) {
          const refItem = collectionRef.find((el) => el._id === id);
          if (refItem) {
            const { _ref, ...rest } = resolveRefs(refItem);
            objPathSet(clone, path, rest);
          }
        }
      }
    });

    return clone;
  } else {
    return items;
  }
};

module.exports = { resolveRefs };
