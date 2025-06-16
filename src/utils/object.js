/**
 * Deep clone an object
 * @param {object} obj The object to clone
 * @returns {object} The cloned object
 */
const objClone = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    const clone = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      clone[i] = objClone(obj[i]);
    }
    return clone;
  } else {
    const clone = {};
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      clone[keys[i]] = objClone(obj[keys[i]]);
    }
    return clone;
  }
};

/**
 * @typedef {object} PropertyInfo
 * @property  {string} key The key of the property
 * @property  {any} value The value of the property
 * @property  {boolean} isNode Whether the property is a node or not
 * @property  {object} parent The parent property
 * @property  {string} path The path of the property
 * @property  {string} parentPath The path of the parent property
 */

/**
 * @callback traverseCallback
 * @param {PropertyInfo} info The information about the property
 */

/**
 * Traverse through an object
 * @param {object} obj The object to traverse
 * @param {traverseCallback} callback The callback function to call for each property
 * @returns {void}
 */
const objTraverse = (obj, callback) => traverse(obj, '', callback);

/**
 * Traverse through an object
 * @param {object} parent The object to traverse
 * @param {string} parentPath The path of the parent object, e.g. 'a.b.c'
 * @param {function} callback The callback function to call for each property
 * @returns {void}
 */
const traverse = (parent, parentPath, callback) => {
  if (typeof parent !== 'object' || parent === null) return;

  const keys = Object.keys(parent);
  const parentPathIsEmpty = !parentPath;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = parent[key];
    const path = parentPathIsEmpty ? key : `${parentPath}.${key}`;
    const _parentPath = parentPathIsEmpty ? null : parentPath;
    const isNode = typeof value === 'object' && value !== null;

    callback({ key, value, parent, path, parentPath: _parentPath, isNode });

    if (typeof value === 'object' && value !== null) {
      traverse(value, path, callback);
    }
  }
};

/**
 * Resolve a path in an object
 * @param {object} obj The object to resolve the path in
 * @param {string} path The path to resolve in the object, e.g. 'a.b.c'
 * @returns {any} The value of the resolved path in the object, or the object if the path is empty or undefined.
 */
const objPathResolve = (obj, path) => {
  if (!path) return obj;

  obj = obj || {};

  const properties = path.split('.');
  let current = obj;

  for (let i = 0; i < properties.length; i++) {
    if (current == null) return undefined;
    current = current[properties[i]];
  }

  return current;
};

/**
 * Set a value in an object at a given path
 * @param {object} obj The object to set the value in
 * @param {string} path The path to set the value in, e.g. 'a.b.c'
 * @param {any} value The value to set
 * @returns {void}
 */
const objPathSet = (obj, path, value) => {
  const keys = path.split('.');
  let node = obj;

  for (let i = 0; i < keys.length; i++) {
    const rawKey = keys[i];

    const isIndex = rawKey === `${+rawKey}`;
    const key = isIndex ? +rawKey : rawKey;
    const isLast = i === keys.length - 1;

    if (isLast) {
      if (value === undefined) {
        if (Array.isArray(node)) {
          node.splice(Number(key), 1);
        } else {
          delete node[key];
        }
      } else {
        node[key] = value;
      }
    } else {
      const nextRaw = keys[i + 1];
      const nextIsIndex = nextRaw === `${+nextRaw}`;

      if (!(key in node) || node[key] === null) {
        node[key] = nextIsIndex ? [] : {};
      }

      node = node[key];
    }
  }
};

export { objClone, objPathResolve, objPathSet, objTraverse };
