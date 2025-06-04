/**
 * Serialize an object
 * @param {object} obj The object to serialize
 * @returns {*} The serialized object
 */
const objSerialize = (obj) => {
  return obj === undefined ? undefined : JSON.parse(JSON.stringify(obj));
};

/**
 * Deep clone an object
 * @param {object} obj The object to clone
 * @returns {object} The cloned object
 */
const objClone = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const clone = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach((key) => (clone[key] = objClone(obj[key])));

  return clone;
};

/**
 * Traverse through an object
 * @param {object} parent The object to traverse
 * @param {string} parentPath The path of the parent object, e.g. 'a.b.c'
 * @param {function} callback The callback function to call for each property
 * @returns {void}
 */
const traverse = (parent, parentPath, callback) => {
  if (typeof parent !== 'object' || parent === null) return parent;

  Object.keys(parent).forEach((key) => {
    const value = parent[key];
    const path = parentPath ? `${parentPath}.${key}` : key;
    const result = { key, value, parent, path, parentPath: parentPath || null };

    if (typeof value === 'object' && value !== null) {
      result.isNode = true;
      callback(result);
      traverse(value, path, callback);
    } else {
      result.isNode = false;
      callback(result);
    }
  });
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
 * Resolve a path in an object
 * @param {object} obj The object to resolve the path in
 * @param {string} path The path to resolve in the object, e.g. 'a.b.c'
 * @returns {any} The value of the resolved path in the object, or the object if the path is empty or undefined.
 */
const objPathResolve = (obj, path) => {
  if (!path) return obj;
  obj = obj || {};
  const properties = path.split('.');

  return objPathResolve(obj[properties.shift()], properties.join('.'));
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
    const isIndex = Number.isInteger(Number(rawKey));
    const key = isIndex ? Number(rawKey) : rawKey;
    const isLast = i === keys.length - 1;

    if (isLast) {
      if (value === undefined) {
        Array.isArray(node) ? node.splice(Number(key), 1) : delete node[key];
      } else {
        node[key] = value;
      }
    } else {
      const nextIsIndex = Number.isInteger(Number(keys[i + 1]));
      if (!(key in node)) node[key] = nextIsIndex ? [] : {};
      node = node[key];
    }
  }
};

module.exports = { objSerialize, objClone, objTraverse, objPathResolve, objPathSet };
