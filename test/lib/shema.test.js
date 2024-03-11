const { Schema, applySchema } = require('../../lib/shema');
const db = require('../../stormflow');

db.start({ diskWrite: false });

const setStrictMode = (strict) => db.setConfig({ strict });

describe('Schema', () => {
  it('throw error for invalid or missing schema definition', () => {
    expect(() => Schema()).toThrow();
    expect(() => Schema(undefined)).toThrow();
    expect(() => Schema(null)).toThrow();
    expect(() => Schema({})).toThrow();
    expect(() => Schema('invalid')).toThrow();
    expect(() => Schema({ _properties: true })).toThrow();
    expect(() => Schema({ _items: true })).toThrow();
    expect(() => Schema({ _ref: true })).toThrow();
    expect(() => Schema({ name: null })).toThrow();
    expect(() => Schema({ name: 123 })).toThrow();
    expect(() => Schema({ name: [] })).toThrow();
    expect(() => Schema({ name: {} })).toThrow();
    expect(() => Schema({ name: 'string' })).toThrow();
    expect(() => Schema({ name: Symbol })).toThrow();
    expect(() => Schema({ address: { city: 'string' } })).toThrow();
    expect(() => Schema({ name: [String, String] })).toThrow();
    expect(() => Schema({ invalidKey: true })).toThrow();
    expect(() => Schema({ name: { invalidKey: true } })).toThrow();
    expect(() => Schema({ name: { default: 'N/A', required: true } })).toThrow();
    expect(() => Schema({ name: { type: 'invalid' } })).toThrow();
    expect(() => Schema({ name: { type: 'string', invalidKey: true } })).toThrow();
    expect(() => Schema({ name: { type: 'string', default: 123 } })).toThrow();
    expect(() => Schema({ name: { type: 'date', default: '123' } })).toThrow();
  });

  it('transform shorthand functions', () => {
    const schema1 = Schema({ name: String, age: Number });
    expect(schema1).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
    });

    const schema2 = Schema({ name: { type: String }, age: { type: Number } });
    expect(schema2).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
    });

    const schema3 = Schema({ name: { type: 'string' }, age: { type: 'number' } });
    expect(schema3).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
    });

    const schema4 = Schema({ name: String, tags: [String] });
    expect(schema4).toEqual({
      name: { type: 'string' },
      tags: [{ type: 'string' }],
    });

    const schema5 = Schema({ name: String, tags: [{ type: String }] });
    expect(schema5).toEqual({
      name: { type: 'string' },
      tags: [{ type: 'string' }],
    });

    const schema6 = Schema({ date: { type: Date, default: Date.now } });
    expect(schema6).toEqual({
      date: { type: 'date', default: Date.now },
    });
  });
});

describe('applySchema', () => {
  afterEach(() => setStrictMode(true));

  it('handle undefined value of source object', () => {
    const schema = Schema({ name: String });
    const fn = () => applySchema(undefined, schema);
    expect(fn).toThrow();

    setStrictMode(false);
    expect(fn()).toBeUndefined();
  });

  it('handle invalid object type in schema definition', () => {
    const source = { name: 'John' };
    const fn = () => applySchema(source, 'invalid');
    expect(fn).toThrow();

    setStrictMode(false);
    expect(fn()).toBeUndefined();
  });

  it('return undefined if no schema provided', () => {
    const source = { name: 'John', age: 30 };
    const fn = () => applySchema(source);
    expect(fn).toThrow();

    setStrictMode(false);
    expect(fn()).toBeUndefined();
  });

  it('throw error for invalid source array type', () => {
    const schema = Schema({ tags: [String] });
    const fn = () => applySchema({ tags: 'example' }, schema);
    expect(fn).toThrow();

    setStrictMode(false);
    expect(fn()).toEqual({ tags: [] });
  });

  it('throw error for invalid source object type', () => {
    const schema = Schema({ tags: { a: String, b: Number } });
    const fn = () => applySchema({ tags: 'example' }, schema);
    expect(fn).toThrow();

    setStrictMode(false);
    expect(fn()).toEqual({});
  });

  it('throw error for invalid source string type', () => {
    const schema = Schema({ tags: String });
    const fn = () => applySchema({ tags: 123 }, schema);
    expect(fn).toThrow();

    setStrictMode(false);
    expect(fn()).toEqual({ tags: '123' });
  });

  it('throw error for invalid source number type', () => {
    const schema = Schema({ tags: Number });
    const fn = () => applySchema({ tags: '123' }, schema);
    expect(fn).toThrow();

    setStrictMode(false);
    expect(fn()).toEqual({ tags: 123 });
  });

  it('throw error for invalid source boolean type', () => {
    const schema = Schema({ tags: Boolean });
    const fn = () => applySchema({ tags: '123' }, schema);
    expect(fn).toThrow();

    setStrictMode(false);
    expect(fn()).toEqual({ tags: true });
  });

  it('throw error for invalid source date type', () => {
    const schema1 = Schema({ tags: Date });
    const schema2 = Schema({ tags: { type: Date, default: Date.length } });
    const fn1 = () => applySchema({ tags: 'not a date' }, schema1);
    const fn2 = () => applySchema({ tags: true }, schema2);
    expect(fn1).toThrow();
    expect(fn2).toThrow();

    setStrictMode(false);
    expect(fn1()).toEqual({ tags: 0 });
    expect(fn2()).toEqual({ tags: 0 });
  });

  it('apply schema to source object', () => {
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

  it('return object with _ref field if schema has $ref property', () => {
    const source = { _id: '12345' };
    const schema = Schema({ user: { $ref: 'User' } });

    const result = applySchema({ user: source }, schema);

    expect(result).toEqual({ user: { _ref: { collection: 'User', id: '12345' } } });
  });

  it('apply nested schema to source object', () => {
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

describe('Intergation', () => {
  it('apply complex schema to source corretly', () => {
    const image = {
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      size: { type: Number, default: 0 },
      format: String,
      sizes: String,
      src: String,
      srcSet: [String],
      srcSetWebp: [String],
      srcSetAvif: [String],
    };

    const locale = {
      title: { type: String, required: true },
      slug: { type: String, required: true },
      items: [{ key: String, value: String }],
      content: { type: String, required: true },
      img: image,
    };

    const product = {
      created: { type: Date, default: Date.now },
      published: { type: Boolean, default: false },
      category: { type: String, required: true },
      locales: {
        'hu-HU': locale,
        'en-US': locale,
        'ar-AE': locale,
        'de-DE': locale,
      },
    };

    const testProduct = {
      category: 'Product',
      published: true,
      locales: {
        'hu-HU': {
          title: 'Teszt termék',
          slug: 'teszt-termek',
          items: [
            { key: 'Méret', value: 'Kicsi' },
            { key: 'Szín', value: 'Piros' },
          ],
          content: 'Ez egy teszt termék leírása.',
          img: {
            width: 800,
            height: 600,
            size: 1200,
            format: 'jpeg',
            sizes: '100vw',
            src: 'http://example.com/image_hu.jpg',
            srcSet: ['http://example.com/image_hu.jpg 800w'],
            srcSetWebp: ['http://example.com/image_hu.webp 800w'],
            srcSetAvif: [
              'http://example.com/image_hu.avif 800w',
              'http://example.com/image_hu.avif 300w',
            ],
          },
        },
        'en-US': {
          title: 'Test Product',
          slug: 'test-product',
          items: [
            { key: 'Size', value: 'Small' },
            { key: 'Color', value: 'Red' },
          ],
          content: 'This is a test product description.',
          img: {
            width: 800,
            height: 600,
            size: 1200,
            format: 'jpeg',
            sizes: '100vw',
            src: 'http://example.com/image_en.jpg',
            srcSet: ['http://example.com/image_en.jpg 800w'],
            srcSetWebp: ['http://example.com/image_en.webp 800w'],
            srcSetAvif: [
              'http://example.com/image_en.avif 800w',
              'http://example.com/image_en.avif 300w',
            ],
          },
        },
        'ar-AE': {
          title: 'منتج اختبار',
          slug: 'test-product-ar',
          items: [
            { key: 'الحجم', value: 'صغير' },
            { key: 'اللون', value: 'أحمر' },
          ],
          content: 'هذا وصف لمنتج اختبار.',
          img: {
            width: 800,
            height: 600,
            size: 1200,
            format: 'jpeg',
            sizes: '100vw',
            src: 'http://example.com/image_ar.jpg',
            srcSet: ['http://example.com/image_ar.jpg 800w'],
            srcSetWebp: ['http://example.com/image_ar.webp 800w'],
            srcSetAvif: [
              'http://example.com/image_ar.avif 800w',
              'http://example.com/image_ar.avif 300w',
            ],
          },
        },
        'de-DE': {
          title: 'Test Produkt',
          slug: 'test-product-de',
          content: 'Dies ist eine Test-Produktbeschreibung.',
        },
      },
    };

    const productSchema = Schema(product);
    const result = applySchema(testProduct, productSchema);

    const created = Math.floor(Date.now() / 1000);
    expect(result).toEqual({
      created,
      ...testProduct,
      locales: {
        ...testProduct.locales,
        'de-DE': {
          title: 'Test Produkt',
          slug: 'test-product-de',
          items: [],
          content: 'Dies ist eine Test-Produktbeschreibung.',
          img: {
            width: 0,
            height: 0,
            size: 0,
            srcSet: [],
            srcSetWebp: [],
            srcSetAvif: [],
          },
        },
      },
    });
  });
});
