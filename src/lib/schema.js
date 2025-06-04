const { config } = require('./config');
const { objClone, objTraverse, objPathResolve, objPathSet } = require('../utils/object');
const { getType } = require('../utils/type');
const { timeFromStr } = require('../utils/unixtime');

const allowedTypes = ['string', 'number', 'boolean', 'date'];
const allowedDefinitions = ['type', 'required', 'default', 'unique', '$ref'];

const Schema = (schemaObj = {}) => {
  if (getType(schemaObj) !== 'object' || Object.keys(schemaObj).length === 0) {
    const msg = `Invalid "object" type of schema definition.`;
    throw new Error(msg);
  }

  const clone = objClone(schemaObj);

  // Transform Shorthand functions
  objTraverse(clone, ({ key, value, parent, isNode }) => {
    const typeValue = getType(value);
    const isTypeShorthand = !isNode && !parent.hasOwnProperty('type');

    if (typeValue === 'function') {
      const type = value.name.toLowerCase();
      if (isTypeShorthand) parent[key] = { type };
      if (key === 'type') parent[key] = type;
    }
  });

  // Validate the final Schema object
  objTraverse(clone, ({ key, value, parent, isNode }) => {
    if (getType(value) === 'array' && value.length !== 1) {
      const msg = `Invalid "array" elements in schema definition.`;
      throw new Error(msg);
    }

    if (isNode) {
      if (!Object.keys(value).length) {
        const msg = `Invalid empty object in schema definition.`;
        throw new Error(msg);
      }

      if (value.type && !allowedTypes.includes(value.type)) {
        const msg =
          `Invalid "type" key in schema definition: "${value.type}".` +
          '\r\n' +
          `Allowed types: "${allowedTypes.join('", "')}".`;
        throw new Error(msg);
      }

      if (value.default !== undefined) {
        const typeDefault = getType(value.default);
        const typeFinalDefault = typeDefault === 'function' ? getType(value.default()) : typeDefault;

        if (value.required !== undefined) {
          const msg = `Invalid combination of "default" and "required" keys in schema definition.`;
          throw new Error(msg);
        }

        if (
          (value.type === 'date' && typeFinalDefault !== 'number') ||
          (value.type !== 'date' && value.type !== typeFinalDefault)
        ) {
          const msg = `Invalid type of "default" key in schema definition. Expexted type is "${value.type}".`;
          throw new Error(msg);
        }
      }
    } else {
      if (key !== '$ref' && !parent.type) {
        const msg = `Missing "type" key in schema definition.`;
        throw new Error(msg);
      }

      if (!allowedDefinitions.includes(key)) {
        const msg =
          `Invalid key in schema definition: "${key}".` +
          '\r\n' +
          `Allowed keys: "${allowedDefinitions.join('", "')}".`;
        throw new Error(msg);
      }
    }
  });

  return clone;
};

const applySchema = (source, schema) => {
  const target = {};

  if (source === undefined) {
    if (config.strict) {
      const msg = `Invalid "undefined" source object.`;
      throw new Error(msg);
    }
    return;
  }

  if (getType(schema) !== 'object') {
    if (config.strict) {
      const msg = `Invalid "object" type of schema definition.`;
      throw new Error(msg);
    }
    return;
  }

  objTraverse(schema, ({ value, path, parent }) => {
    const valueDefault = getType(value.default) === 'function' ? value.default() : value.default;
    const _val = objPathResolve(source, path);
    const valueSource = _val === undefined && valueDefault !== undefined ? valueDefault : _val;
    const typeSchema = value.type || getType(value);
    const typeParent = getType(parent);
    const typeSource = getType(valueSource);
    const typeMatch = typeSchema === 'date' ? typeSource === 'number' : typeSchema === typeSource;

    // Init array nodes
    if (typeSchema === 'array') objPathSet(target, path, []);

    // Skip undefined source value and array item
    if (valueSource === undefined || typeParent === 'array') return;

    // Validate type of source value
    if (config.strict && !typeMatch) {
      const msg = `Invalid type of "${path}" value. Expected type is "${typeSchema}".`;
      throw new Error(msg);
    }

    // Handle refs
    if (value.$ref) {
      const ref = { _ref: { collection: value?.$ref, id: valueSource?._id } };
      objPathSet(target, path.replace(/.$ref/g, ''), ref);
      return;
    }

    // Handle object nodes
    if (typeSchema === 'object' && typeSource === 'object') {
      objPathSet(target, path, {});
    }

    // Handle array nodes
    if (typeSchema === 'array' && typeSource === 'array') {
      valueSource.forEach((el, i) => {
        const itemPath = [path, i].join('.');
        const { itemValue } = applySchema({ itemValue: el }, { itemValue: value[0] });
        objPathSet(target, itemPath, itemValue);
      });
    }

    // Handle definitions
    switch (value.type) {
      case 'string':
        objPathSet(target, path, String(valueSource));
        break;

      case 'number':
        objPathSet(target, path, Number(valueSource) || 0);
        break;

      case 'boolean':
        objPathSet(target, path, Boolean(valueSource));
        break;

      case 'date':
        objPathSet(target, path, timeFromStr(valueSource) || 0);
        break;
    }
  });

  return target;
};

module.exports = { Schema, applySchema };
