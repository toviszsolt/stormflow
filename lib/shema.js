const { deepClone } = require('./utils');

const Schema = (schemaObj) => {
  try {
    const schema = {};

    const processField = (fieldName, fieldSchema) => {
      const fieldDefinition = {};

      if (typeof fieldSchema === 'function') {
        fieldDefinition.type = fieldSchema.name.toLowerCase();
      } else if (typeof fieldSchema === 'object' && fieldSchema.type) {
        if (typeof fieldSchema.type === 'function') {
          fieldDefinition.type = fieldSchema.type.name.toLowerCase();
        } else if (typeof fieldSchema.type === 'string') {
          fieldDefinition.type = fieldSchema.type.toLowerCase();
        } else {
          throw new Error(
            `Invalid type for property "${fieldName}" in ${JSON.stringify(schemaObj)}`,
          );
        }

        if (fieldSchema.required) {
          fieldDefinition.required = true;
        }

        if (fieldSchema.default !== undefined) {
          fieldDefinition.default = fieldSchema.default;
        }
      } else if (typeof fieldSchema === 'object') {
        fieldDefinition.type = 'object';
        fieldDefinition.properties = {};

        for (const key in fieldSchema) {
          if (fieldSchema.hasOwnProperty(key)) {
            if (key === 'ref') {
              delete fieldDefinition.properties;
              fieldDefinition.ref = fieldSchema[key];
            } else {
              fieldDefinition.properties[key] = processField(key, fieldSchema[key]);
            }
          }
        }
      } else {
        throw new Error(
          `Invalid schema definition for "${fieldName}" field in ${JSON.stringify(schemaObj)}`,
        );
      }

      return fieldDefinition;
    };

    for (const key in schemaObj) {
      if (schemaObj.hasOwnProperty(key)) {
        const fieldSchema = schemaObj[key];
        schema[key] = processField(key, fieldSchema);
      }
    }

    return deepClone(schema);
  } catch (e) {
    throw e;
  }
};

const applySchema = (source, schema) => {
  if (!schema) return;

  if (schema.ref) {
    return { _ref: { collection: schema.ref, id: source._id } };
  } else if (typeof schema === 'object') {
    if (schema.type) {
      if (typeof source === schema.type.toLowerCase()) {
        return source;
      }
    } else {
      if (typeof source === 'object' && source !== null) {
        const target = {};
        Object.keys(schema).forEach((key) => {
          const subSchema = schema[key];
          const subSource = source[key];
          if (subSchema.ref && subSource) {
            target[key] = { _ref: { collection: subSchema.ref, id: subSource._id } };
          } else {
            const subResult = applySchema(subSource, subSchema);
            if (subResult !== undefined) {
              target[key] = subResult;
            } else if (subSchema.required) {
              target[key] = {};
            }
          }
        });
        return target;
      }
    }
  }

  return source;
};

module.exports = { Schema, applySchema };
