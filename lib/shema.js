const { config } = require('./config');
const { objClone, objTraverse, objPathResolve, objPathSet } = require('../utils/object');
const { getType } = require('../utils/type');
const { timeFromStr } = require('../utils/unixtime');

const allowedTypes = ['string', 'number', 'boolean', 'date'];
const allowedDefinitions = ['type', 'required', 'default', 'unique', '$ref'];

const Schema = (schemaObj = {}) => {
  if (getType(schemaObj) !== 'object' || Object.keys(schemaObj).length === 0) {
    const msg = `Invalid "object" type in schema definition.`;
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

    if (isNode && !Object.keys(value).length) {
      const msg = `Missing "type" field in schema definition.`;
      throw new Error(msg);
    }

    if (!isNode && key !== '$ref' && !parent.type) {
      const msg = `Missing "type" field in schema definition.`;
      throw new Error(msg);
    }

    if (isNode && value.type && !allowedTypes.includes(value.type)) {
      const msg =
        `Invalid type in schema definition: "${value.type}".` +
        '\r\n' +
        `Allowed types: "${allowedTypes.join('", "')}".`;
      throw new Error(msg);
    }

    if (!isNode && !allowedDefinitions.includes(key)) {
      const msg =
        `Invalid field in schema definition: "${key}".` +
        '\r\n' +
        `Allowed fields: "${allowedDefinitions.join('", "')}".`;
      throw new Error(msg);
    }

    if (isNode && value.default !== undefined && value.required !== undefined) {
      const msg = `Invalid combination of "default" and "required" fields in schema definition.`;
      throw new Error(msg);
    }

    if (isNode && value.default !== undefined) {
      const typeDefault = getType(value.default);
      const typeFinalDefault = typeDefault === 'function' ? getType(value.default()) : typeDefault;

      if (
        (value.type === 'date' && typeFinalDefault !== 'number') ||
        (value.type !== 'date' && value.type !== typeFinalDefault)
      ) {
        const msg = `Invalid type of "default" field in schema definition. Expexted type is "${value.type}".`;
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
      const msg = `Invalid "undefined" value in source object.`;
      throw new Error(msg);
    }
    return;
  }

  if (getType(schema) !== 'object') {
    if (config.strict) {
      const msg = `Invalid "object" type in schema definition.`;
      throw new Error(msg);
    }
    return;
  }

  objTraverse(schema, ({ key, value, path, isNode }) => {
    const valueDefault = getType(value.default) === 'function' ? value.default() : value.default;
    const _valueSource = objPathResolve(source, path);
    const valueSource =
      _valueSource === undefined && valueDefault !== undefined ? valueDefault : _valueSource;
    const typeSchema = value.type || getType(value);
    const typeSource = getType(valueSource);

    // Handle refs
    if (value.$ref) {
      path = path.replace(/.$ref/g, '');
      const ref = { _ref: { collection: value?.$ref, id: valueSource?._id } };

      objPathSet(target, path, ref);
      return;
    }

    // Handle arrays
    if (typeSchema === 'array') {
      objPathSet(target, path, []);

      if (valueSource === undefined) return;

      if (typeSource !== 'array') {
        if (config.strict) {
          const msg = `Invalid type of "${path}" field. Expected type is "array".`;
          throw new Error(msg);
        }
        return;
      }

      valueSource.forEach((el, i) => {
        const pathELement = [path, i].join('.');
        const targetEl = applySchema({ item: el }, { item: value[0] });
        objPathSet(target, pathELement, targetEl.item);
      });

      return;
    }

    // Handle nodes
    if (typeSchema === 'object' && valueSource) {
      if (config.strict && typeSource !== 'object') {
        const msg = `Invalid type of "${path}" field. Expected type is "object".`;
        throw new Error(msg);
      }

      objPathSet(target, path, {});
      return;
    }

    if (valueSource === undefined) return;

    // Handle definitions
    switch (value.type) {
      case 'string':
        if (config.strict && typeSource !== 'string') {
          const msg = `Invalid type of "${path}" field. Expected type is "string".`;
          throw new Error(msg);
        }

        objPathSet(target, path, String(valueSource));
        break;

      case 'number':
        if (config.strict && typeSource !== 'number') {
          const msg = `Invalid type of "${path}" field. Expected type is "number".`;
          throw new Error(msg);
        }

        objPathSet(target, path, Number(valueSource));
        break;

      case 'boolean':
        if (config.strict && typeSource !== 'boolean') {
          const msg = `Invalid type of "${path}" field. Expected type is "boolean".`;
          throw new Error(msg);
        }

        objPathSet(target, path, Boolean(valueSource));
        break;

      case 'date':
        if (config.strict && typeSource !== 'number') {
          const msg = `Invalid type of "${path}" field. Expected type is "date".`;
          throw new Error(msg);
        }

        const time = timeFromStr(valueSource);
        objPathSet(target, path, time);
        break;
    }
  });

  return target;
};

module.exports = { Schema, applySchema };
