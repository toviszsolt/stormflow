const { resolveRefs } = require('../../lib/refs');
const db = require('../../stormflow');

db.start({ diskWrite: false });

const schemCategory = db.Schema({ name: String });
const schemaColor = db.Schema({ name: String, category: { $ref: 'categories' } });
const schemaItem = db.Schema({ colors: [{ $ref: 'colors' }], badRef: { $ref: 'nonExists' } });

const Category = db.model('categories', schemCategory);
const Color = db.model('colors', schemaColor);
const Item = db.model('items', schemaItem);

describe('resolveRefs', () => {
  afterEach(() => {
    Category.deleteMany({});
    Color.deleteMany({});
    Item.deleteMany({});
  });

  it('resolve references', async () => {
    const createdCategories = await Category.create([{ name: 'warm' }, { name: 'cold' }, { name: 'natural' }]);
    const createdColors = await Color.create([
      { name: 'red', category: createdCategories[0] },
      { name: 'green', category: createdCategories[1] },
      { name: 'blue', category: createdCategories[1] },
      { name: 'white', category: createdCategories[2] },
      { name: 'unknown' },
    ]);
    const createdItems = await Item.create([
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
    const createdItems = await Item.create({ badRef: {} });
    expect(createdItems.badRef).toBeUndefined();
  });

  it('invalid reference id', async () => {
    const createdColor = await Color.create([{ name: 'unknown' }]);
    const createdItem = await Item.create({ colors: [createdColor] });

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
