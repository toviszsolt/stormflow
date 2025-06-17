import { objClone, objPathSet, objTraverse } from '../utils/object.js';
import { getType } from '../utils/type.js';
import { data } from './storage.js';

const resolveRefs = (items) => {
  if (['object', 'array'].includes(getType(items))) {
    const clone = objClone(items);

    objTraverse(clone, ({ key, value, parent, path }) => {
      if (getType(value) === 'object' && value._ref) {
        const { collection, id } = value._ref;
        const collectionRef = data[collection];

        delete parent[key];

        if (collectionRef) {
          const refItem = collectionRef.get(id);
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

export { resolveRefs };
