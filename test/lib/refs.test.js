import model from '../../src/lib/model.js';
import { resolveRefs } from '../../src/lib/refs.js';
import { Schema } from '../../src/lib/schema.js';

const schemaCategory = Schema({ name: String });
const schemaColor = Schema({ name: String, category: { $ref: 'categories' } });
const schemaItem = Schema({ colors: [{ $ref: 'colors' }], badRef: { $ref: 'nonExists' } });

const Category = model('categories', schemaCategory);
const Color = model('colors', schemaColor);
const Item = model('items', schemaItem);

beforeEach(async () => {
  await Category.deleteMany({});
  await Color.deleteMany({});
  await Item.deleteMany({});
});

describe('resolveRefs', () => {
  it('resolve references correctly', async () => {
    const createdCategories = await Category.insertMany([{ name: 'warm' }, { name: 'cold' }, { name: 'natural' }]);
    const createdColors = await Color.insertMany([
      { name: 'red', category: createdCategories[0] },
      { name: 'green', category: createdCategories[1] },
      { name: 'blue', category: createdCategories[1] },
      { name: 'white', category: createdCategories[2] },
      { name: 'unknown' },
    ]);
    const createdItems = await Item.insertMany([
      { colors: [createdColors[0], createdColors[1]] },
      { colors: [createdColors[1], createdColors[2]] },
      { colors: [createdColors[2], createdColors[3]] },
      { colors: [createdColors[3], createdColors[4]], badRef: { $ref: 'nonExists' } },
    ]);

    createdItems.forEach((el, i) => {
      expect(el.colors[0]).toHaveProperty('_id');
      expect(el.colors[1]).toHaveProperty('_id');
      expect(el.colors[0].name).toEqual(createdColors[i].name);
      expect(el.colors[1].name).toEqual(createdColors[i + 1].name);
      if (i === 3) {
        expect(el.colors[0].category).toHaveProperty('_id');
        expect(el.colors[1].category).toBeUndefined();
      } else {
        expect(el.colors[0].category).toHaveProperty('_id');
        expect(el.colors[1].category).toHaveProperty('_id');
      }
    });
  });

  it('removes invalid reference collection', async () => {
    const createdItems = await Item.insertOne({ badRef: {} });
    expect(createdItems.badRef).toBeUndefined();
  });

  it('handles invalid reference id properly', async () => {
    const createdColor = await Color.insertOne({ name: 'unknown' });
    const createdItem = await Item.insertOne({ colors: [createdColor] });
    expect(createdItem.colors[0]).toHaveProperty('_id');

    await Color.deleteOne({ _id: createdColor._id });
    const queryItem = await Item.findOne({});
    expect(queryItem.colors[0]).toBeUndefined();
  });

  it('returns primitives unchanged if input is not object or array', () => {
    expect(resolveRefs(true)).toEqual(true);
    expect(resolveRefs('hello')).toEqual('hello');
    expect(resolveRefs(123)).toEqual(123);
    expect(resolveRefs({ norefs: true })).toEqual({ norefs: true });
  });

  it('handles multiple refs in array with missing references', async () => {
    const cat = await Category.insertOne({ name: 'cat1' });
    const color1 = await Color.insertOne({ name: 'color1', category: cat });
    const color2 = { _ref: { collection: 'colors', id: 'nonexistentid' } };
    const item = await Item.insertOne({ colors: [color1, color2] });

    const resolved = resolveRefs(item);
    expect(resolved.colors[0]).toHaveProperty('name', 'color1');
    expect(resolved.colors[1]).toBeUndefined();
  });

  it('does not mutate original input object', async () => {
    const cat = await Category.insertOne({ name: 'cat' });
    const color = await Color.insertOne({ name: 'color', category: cat });
    const item = {
      colors: [{ _ref: { collection: 'colors', id: color._id } }],
    };

    const cloned = resolveRefs(item);
    expect(cloned).not.toBe(item);
    expect(item.colors[0]).toHaveProperty('_ref');
  });

  it('handles non-_id identifiers gracefully', async () => {
    const fakeRef = { _ref: { collection: 'categories', id: 'fake-id' } };
    const input = { something: fakeRef };
    const resolved = resolveRefs(input);
    expect(resolved.something).toBeUndefined();
  });

  it('returns primitives as is (edge primitive cases)', () => {
    expect(resolveRefs(null)).toBeNull();
    expect(resolveRefs(false)).toBe(false);
    expect(resolveRefs(0)).toBe(0);
    expect(resolveRefs('')).toBe('');
  });

  it('handles empty arrays and objects correctly', () => {
    expect(resolveRefs([])).toEqual([]);
    expect(resolveRefs({})).toEqual({});
  });
});
