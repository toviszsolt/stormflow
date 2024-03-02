const { Schema, applySchema } = require('../../lib/shema');
const db = require('../../stormflow');

db.start({ diskWrite: false });

describe('Schema', () => {
  it('should throw error for invalid schema definition', () => {
    expect(() => Schema('invalid')).toThrow();
    expect(() => Schema({})).toThrow();
    expect(() => Schema({ name: 123 })).toThrow();
  });

  it('should transform shorthand functions and refs', () => {
    const schema = Schema({ name: String, age: Number });
    expect(schema).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
    });
  });
});

describe('applySchema', () => {
  it('should handle undefined value in source object', () => {
    const schema = Schema({ name: String });
    expect(() => applySchema(undefined, schema)).toThrow();
  });

  it('should handle invalid object type in schema definition', () => {
    expect(() => applySchema({ name: 'John' }, 'invalid')).toThrow();
  });

  it('throws error for empty schema object if no schema provided', () => {
    expect(() => Schema()).toThrow();
  });

  it('returns schema object with field definitions', () => {
    const schemaObj = {
      name: String,
      age: Number,
      address: {
        city: String,
        zip: Number,
      },
    };

    const result = Schema(schemaObj);

    expect(result).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
      address: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          zip: { type: 'number' },
        },
      },
    });
  });

  it('throws error for invalid schema definition', () => {
    const schemaObj = {
      invalidField: Symbol, // Symbol is not a valid schema type
    };

    expect(() => Schema(schemaObj)).toThrow();
  });

  it('throws error for invalid type in schema definition', () => {
    const schemaObj = {
      name: { type: 'InvalidType' }, // 'InvalidType' is not a valid type
    };

    expect(() => Schema(schemaObj)).toThrow();
  });
});

describe('applySchema', () => {
  it('returns undefined if no schema provided', () => {
    const input = { name: 'John', age: 30 };
    expect(() => applySchema(input)).toThrow();
  });

  it('applies schema to source object', () => {
    const schema = Schema({
      name: String,
      age: Number,
      address: {
        city: String,
        zip: Number,
      },
    });

    const source = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: 12345,
      },
    };

    const result = applySchema(source, schema);

    expect(result).toEqual(source);
  });

  it('returns object with _ref field if schema has ref property', () => {
    const source = { _id: '12345' };
    const schema = Schema({ user: { ref: 'User' } });

    const result = applySchema({ user: source }, schema);

    expect(result).toEqual({ user: { _ref: { collection: 'User', id: '12345' } } });
  });

  it('applies nested schema to source object', () => {
    const schema = Schema({
      name: String,
      age: Number,
      address: {
        city: String,
        zip: Number,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
    });

    const source = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: 12345,
        coordinates: { latitude: 40.7128, longitude: -74.006 },
      },
    };

    const result = applySchema(source, schema);

    expect(result).toEqual(source);
  });
});
