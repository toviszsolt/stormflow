const { setConfig } = require('../../src/lib/config');
const { resolveRefs } = require('../../src/lib/refs');
const { Schema } = require('../../src/lib/shema');
const model = require('../../src/lib/model');

setConfig({ diskWrite: false });

const schemCategory = Schema({ name: String });
const schemaColor = Schema({ name: String, category: { $ref: 'categories' } });
const schemaItem = Schema({ colors: [{ $ref: 'colors' }], badRef: { $ref: 'nonExists' } });

const Category = model('categories', schemCategory);
const Color = model('colors', schemaColor);
const Item = model('items', schemaItem);

beforeEach(async () => {
  await Category.deleteMany({});
  await Color.deleteMany({});
  await Item.deleteMany({});
});

describe('resolveRefs', () => {
  it('resolve references', async () => {
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

  it('invalid reference collection', async () => {
    const createdItems = await Item.insertOne({ badRef: {} });
    expect(createdItems.badRef).toBeUndefined();
  });

  it('invalid reference id', async () => {
    const createdColor = await Color.insertOne({ name: 'unknown' });
    const createdItem = await Item.insertOne({ colors: [createdColor] });

    expect(createdItem.colors[0]).toHaveProperty('_id');

    await Color.deleteOne({ _id: createdColor._id });
    const queryItem = await Item.findOne({});
    expect(queryItem.colors[0]).toBeUndefined();
  });

  it('invalid type', () => {
    expect(resolveRefs(true)).toEqual(true);
    expect(resolveRefs('hello')).toEqual('hello');
    expect(resolveRefs(123)).toEqual(123);
    expect(resolveRefs({ norefs: true })).toEqual({ norefs: true });
  });
});
