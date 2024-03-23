const { defaultConfig, setConfig } = require('../../src/lib/config');
const model = require('../../src/lib/model');
const { Schema } = require('../../src/lib/shema');
const { data } = require('../../src/lib/storage');

const resetConfig = () => {
  setConfig({ ...defaultConfig, diskWrite: false });
};

resetConfig();

const storageData = data;

const testSchema = Schema({
  name: String,
  age: Number,
  address: {
    city: String,
  },
});

const testModel = model('tests', testSchema);
const testModelNoSchema = model('tests');

const testData = [
  { name: 'John', age: 20, address: { city: 'New York' } },
  { name: 'Jane', age: 25, address: { city: 'Los Angeles' } },
  { name: 'Bob', age: 30, address: { city: 'Chicago' } },
];

beforeEach(async () => {
  resetConfig();
  await testModel.deleteMany({});
  await testModel.insertMany(testData);
});

describe('model', () => {
  it('invalid collection name', () => {
    expect(() => model('test')).toThrow(/name/);
    expect(() => model('Test')).toThrow(/name/);
    expect(() => model('te st')).toThrow(/name/);
  });

  it('use an existing collection or create a new one', async () => {
    storageData._tests = [{ test: true }];
    model('_tests');
    expect(storageData._tests).toEqual([{ test: true }]);

    delete storageData._tests;
    expect(storageData._tests).toBeUndefined();

    model('_tests');
    expect(storageData._tests).toEqual([]);
  });
});

describe('model.insertOne', () => {
  it('insert a document', async () => {
    const data = { name: 'Loren', age: 35, address: { city: 'Manhattan' } };
    const created = await testModel.insertOne(data);
    expect(created).toEqual(expect.objectContaining(data));
    expect(created._id).toBeDefined();
    expect(created._version).toBeDefined();
    expect(created._created).toBeDefined();
    expect(created._updated).toBeDefined();
    await expect(testModel.insertOne()).rejects.toThrow(/item/);
  });

  it('insert without defaultFields', async () => {
    setConfig({ defaultFields: false });
    const data = { name: 'Loren', age: 35, address: { city: 'Manhattan' } };
    const created = await testModelNoSchema.insertOne(data);
    expect(created).toEqual(expect.objectContaining(data));
    expect(created._id).toBeDefined();
    expect(created._version).toBeDefined();
    expect(created._created).toBeUndefined();
    expect(created._updated).toBeUndefined();
  });

  it('insert empty document', async () => {
    setConfig({ strict: false });
    const created = await testModel.insertOne({});
    expect(created).toBeUndefined();
  });

  it('insert without schema', async () => {
    const data = { name: 'Loren', age: 35, address: { city: 'Manhattan' } };
    const created = await testModelNoSchema.insertOne(data);
    expect(created).toEqual(expect.objectContaining(data));
  });
});

describe('model.insertMany', () => {
  it('insert many document', async () => {
    const data = [
      { name: 'Loren', age: 35, address: { city: 'Manhattan' } },
      { name: 'Mike', age: 40, address: { city: 'London' } },
    ];
    const created = await testModel.insertMany(data);
    expect(created.length).toBe(2);
    created.forEach((doc) => {
      expect(doc._id).toBeDefined();
      expect(doc._version).toBeDefined();
      expect(doc._created).toBeDefined();
      expect(doc._updated).toBeDefined();
    });
    await expect(testModel.insertMany()).rejects.toThrow(/items/);
  });
});

describe('model.update', () => {
  it('update a document', async () => {
    const data = { age: 32, address: { city: 'Miami' } };
    const updated = await testModel.update({ name: 'John' }, data);
    expect(updated[0].age).toBe(32);
    expect(updated[0].address.city).toBe('Miami');
    expect(updated[0]._version).toBe(2);
    expect(updated[0]._updated).toBeDefined();
    await expect(testModel.update(null, data)).rejects.toThrow(/query/);
    await expect(testModel.update({ name: 'John' }, null)).rejects.toThrow(/updates/);
  });
});

describe('model.deleteOne', () => {
  it('delete a document', async () => {
    const deleted = await testModel.deleteOne({ name: 'John' });
    const findJohn = await testModel.findOne({ name: 'John' });
    const findAll = await testModel.find({});
    expect(deleted.name).toEqual('John');
    expect(findJohn).toBeUndefined();
    expect(findAll.length).toBe(2);
    await expect(testModel.deleteOne()).rejects.toThrow(/query/);
  });
});

describe('model.deleteMany', () => {
  it('delete many documents', async () => {
    const deleted = await testModel.deleteMany({ name: { $in: ['John', 'Jane'] } });
    const findJohn = await testModel.findOne({ name: 'John' });
    const findJane = await testModel.findOne({ name: 'Jane' });
    const findAll = await testModel.find({});
    expect(deleted.length).toBe(2);
    expect(findJohn).toBeUndefined();
    expect(findJane).toBeUndefined();
    expect(findAll.length).toBe(1);
    await expect(testModel.deleteMany()).rejects.toThrow(/query/);
  });
});

describe('findByIdAndDelete', () => {
  it('delete a document', async () => {
    const { _id } = await testModel.findOne({ name: 'John' });
    const deleted = await testModel.findByIdAndDelete(_id);
    const findJohn = await testModel.findOne({ name: 'John' });
    const findAll = await testModel.find({});
    expect(deleted.name).toEqual('John');
    expect(findJohn).toBeUndefined();
    expect(findAll.length).toBe(2);
    await expect(testModel.findByIdAndDelete()).rejects.toThrow(/id/);
  });
});

describe('model.count', () => {
  it('count documents', async () => {
    const countJohn = await testModel.count({ name: 'John' });
    const countNone = await testModel.count({ name: 'None' });
    const countAll = await testModel.count({});
    expect(countJohn).toBe(1);
    expect(countNone).toBe(0);
    expect(countAll).toBe(3);
    await expect(testModel.count()).rejects.toThrow(/query/);
  });
});

describe('model.exists', () => {
  it('check if document exists', async () => {
    const existsJohn = await testModel.exists({ name: 'John' });
    const existsNone = await testModel.exists({ name: 'None' });
    const existsAll = await testModel.exists({});
    expect(existsJohn).toBe(true);
    expect(existsNone).toBe(false);
    expect(existsAll).toBe(true);
    await expect(testModel.exists()).rejects.toThrow(/query/);
  });
});

describe('model.find', () => {
  it('find documents', async () => {
    const findJohn = await testModel.findOne({ name: 'John' });
    expect(findJohn.name).toEqual('John');
    await expect(testModel.find()).rejects.toThrow(/query/);
  });
});

describe('model.findById', () => {
  it('find a document by id', async () => {
    const findJohn = await testModel.findOne({ name: 'John' });
    const findId = await testModel.findById(findJohn._id);
    expect(findId.name).toEqual('John');
    await expect(testModel.findById()).rejects.toThrow(/id/);
  });
});

describe('model.findOne', () => {
  it('find a document', async () => {
    const findJohn = await testModel.findOne({ name: 'John' });
    expect(findJohn.name).toEqual('John');
    await expect(testModel.findOne()).rejects.toThrow(/query/);
  });
});

describe('model.pre', () => {
  it('pre save hook', async () => {
    const preHook = jest.fn((doc, next) => next());
    testModel.pre('create', preHook);
    const data = { name: 'Loren', age: 35, address: { city: 'Manhattan' } };
    await testModel.insertOne(data);
    expect(preHook).toHaveBeenCalled();
  });
});

describe('model.post', () => {
  it('post save hook', async () => {
    const postHook = jest.fn((doc, next) => next());
    testModel.post('create', postHook);
    const data = { name: 'Loren', age: 35, address: { city: 'Manhattan' } };
    await testModel.insertOne(data);
    expect(postHook).toHaveBeenCalled();
  });
});
