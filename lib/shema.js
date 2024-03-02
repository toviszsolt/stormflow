const { config } = require('./config');
const { objClone, objTraverse, objPathResolve, objPathSet } = require('../utils/object');
const { getType } = require('../utils/type');
const { timeFromStr } = require('../utils/unixtime');

const allowedTypes = ['string', 'number', 'boolean', 'object', 'array', 'date'];
const allowedDefinitions = ['type', 'required', 'default', 'unique', 'ref'];

const Schema = (schemaObj = {}) => {
  if (getType(schemaObj) !== 'object' || Object.keys(schemaObj).length === 0) {
    const msg = `Invalid "object" type in schema definition.`;
    throw new Error(msg);
  }

  const clone = objClone(schemaObj);

  // Transform Objects and Arrays
  objTraverse(clone, ({ key, value, parent }) => {
    if (value.type) return;

    const typeValue = getType(value);

    if (typeValue === 'array') {
      if (value.length === 1) {
        const typeItems = getType(value[0]);
        const items =
          typeItems === 'function' ? { type: value[0] } : { type: 'object', properties: value[0] };

        if (items.properties === undefined && items.hasOwnProperty('properties')) {
          delete items.properties;
        }

        parent[key] = {
          type: typeValue,
          items,
        };
      } else {
        const msg = `Invalid "array" type in schema definition.`;
        throw new Error(msg);
      }
    } else if (typeValue === 'object' && !value.type) {
      parent[key] = {
        type: typeValue,
        properties: value,
      };
    }
  });

  // Transform Shorthand functions
  objTraverse(clone, ({ key, value, parent, isNode }) => {
    const typeValue = getType(value);
    const isShorthand = !isNode && !parent.hasOwnProperty('type');

    if (typeValue === 'function') {
      const type = value.name.toLowerCase();

      if (isShorthand) {
        parent[key] = { type };
      } else if (key === 'type') {
        parent[key] = type;
      }
    }
  });

  // Validate the final Schema object
  objTraverse(clone, ({ key, value, parent, isNode }) => {
    if (isNode && !Object.keys(value).length) {
      const msg = `Missing "type" field in schema definition.`;
      throw new Error(msg);
    }

    if (!isNode && key !== 'ref' && !parent.type) {
      const msg = `Missing "type" field in schema definition.`;
      throw new Error(msg);
    }

    if (
      isNode &&
      value.type === 'array' &&
      value.properties &&
      Object.keys(value.properties).length !== 1
    ) {
      const msg = `Invalid "array" elements in schema definition.`;
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
        console.log(value.type, typeFinalDefault);
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

  objTraverse(schema, ({ key, value, path }) => {
    if (value.properties?.ref) {
      const pathSource = path.replace(/.(properties|ref)/g, '');
      const valueSource = objPathResolve(source, pathSource);
      const ref = { _ref: { collection: value.properties?.ref, id: valueSource?._id } };

      objPathSet(target, pathSource, ref);
    } else if (value.type) {
      const pathSource = path.replace(/.(properties|items)/g, '');
      const valueDefault = getType(value.default) === 'function' ? value.default() : value.default;
      const valueSource =
        valueDefault !== undefined
          ? objPathResolve(source, pathSource) || valueDefault
          : objPathResolve(source, pathSource);
      const typeSource = getType(valueSource);

      if (key === 'items') {
        if (config.strict && typeSource !== 'array') {
          const msg = `Invalid type of "${pathSource}" field. Expected type is "array".`;
          throw new Error(msg);
        }

        if (typeSource === 'array') {
          valueSource.forEach((el, i) => {
            const pathELement = [pathSource, i].join('.');
            const targetEl = applySchema({ item: el }, { item: value });

            objPathSet(target, pathELement, targetEl.item);
          });
        }
      } else if (valueSource !== undefined && !value.properties) {
        switch (value.type) {
          case 'array':
            if (config.strict && typeSource !== 'array') {
              const msg = `Invalid type of "${pathSource}" field. Expected type is "array".`;
              throw new Error(msg);
            }

            objPathSet(target, pathSource, []);
            break;

          case 'object':
            if (config.strict && typeSource !== 'object') {
              const msg = `Invalid type of "${pathSource}" field. Expected type is "object".`;
              throw new Error(msg);
            }

            objPathSet(target, pathSource, {});
            break;

          case 'string':
            if (config.strict && typeSource !== 'string') {
              const msg = `Invalid type of "${pathSource}" field. Expected type is "string".`;
              throw new Error(msg);
            }

            objPathSet(target, pathSource, String(valueSource));
            break;

          case 'number':
            if (config.strict && typeSource !== 'number') {
              const msg = `Invalid type of "${pathSource}" field. Expected type is "number".`;
              throw new Error(msg);
            }

            objPathSet(target, pathSource, Number(valueSource));
            break;

          case 'boolean':
            if (config.strict && typeSource !== 'boolean') {
              const msg = `Invalid type of "${pathSource}" field. Expected type is "boolean".`;
              throw new Error(msg);
            }

            objPathSet(target, pathSource, Boolean(valueSource));
            break;

          case 'date':
            const time = timeFromStr(valueSource) || timeFromStr(valueDefault);

            if (config.strict && getType(time) !== 'number') {
              const msg = `Invalid type of "${pathSource}" field. Expected type is "date".`;
              throw new Error(msg);
            }

            objPathSet(target, pathSource, time);
            break;

          default:
            if (valueSource !== undefined) {
              objPathSet(target, pathSource, valueSource);
            }
            break;
        }
      }
    }
  });

  return target;
};

module.exports = { Schema, applySchema };
