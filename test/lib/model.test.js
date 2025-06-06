const { defaultConfig, setConfig } = require('../../src/lib/config');
const model = require('../../src/lib/model');
const { Schema } = require('../../src/lib/schema');
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
    expect(() => model()).toThrow(/name/);
    expect(() => model('')).toThrow(/name/);
    expect(() => model(' ')).toThrow(/name/);
    expect(() => model('test')).toThrow(/name/);
    expect(() => model('Test')).toThrow(/name/);
    expect(() => model('te st')).toThrow(/name/);
    expect(() => model('__proto__')).toThrow(/name/);
    expect(() => model('prototype')).toThrow(/name/);
    expect(() => model('constructor')).toThrow(/name/);
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

  it('insert with rejection', async () => {
    const data = { name: 123 };
    await expect(testModel.insertOne(data)).rejects.toThrow(/type/);
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

describe('model.updateOne', () => {
  it('update a document', async () => {
    const data = { age: 32, address: { city: 'Miami' } };
    const updated = await testModel.updateOne({ name: 'John' }, data);
    expect(updated.age).toBe(32);
    expect(updated.address.city).toBe('Miami');
    expect(updated._version).toBe(2);
    expect(updated._updated).toBeDefined();
    await expect(testModel.updateOne(null, data)).rejects.toThrow(/query/);
    await expect(testModel.updateOne({ name: 'John' }, null)).rejects.toThrow(/updates/);
  });

  it('replace a document', async () => {
    const data = { name: 'John Replaced', age: 50, address: { city: 'Seattle' } };
    const updated = await testModel.replaceOne({ name: 'John' }, data);
    expect(updated.name).toBe('John Replaced');
    expect(updated.age).toBe(50);
    expect(updated.address.city).toBe('Seattle');
    expect(updated._version).toBe(2);
    expect(updated._updated).toBeDefined();
    await expect(testModel.replaceOne(null, data)).rejects.toThrow(/query/);
    await expect(testModel.replaceOne({ name: 'John' }, null)).rejects.toThrow(/updates/);
  });

  it('update a document without schema', async () => {
    const data = { age: 32, address: { city: 'Miami' } };
    const updated = await testModelNoSchema.updateOne({ name: 'John' }, data);
    expect(updated.age).toBe(32);
    expect(updated.address.city).toBe('Miami');
    expect(updated._version).toBe(2);
    expect(updated._updated).toBeDefined();
  });

  it('update a document with skip _id, _version, _created, _updated', async () => {
    const data = { age: 32, address: { city: 'Miami' }, _id: 0, _version: 0, _created: 0, _updated: 0 };
    const updated = await testModel.updateOne({ name: 'John' }, data);
    expect(updated._id).not.toBe(0);
    expect(updated._version).not.toBe(0);
    expect(updated._created).not.toBe(0);
    expect(updated._updated).not.toBe(0);
  });

  it('update a document with same value', async () => {
    const data = { age: 20 };
    const updated = await testModel.updateOne({ name: 'John' }, data);
    expect(updated.age).toBe(20);
  });

  it('update a document without version', async () => {
    delete storageData['tests'][0]._version;
    const data = { age: 21 };
    const updated = await testModel.updateOne({ name: 'John' }, data);
    expect(updated._version).toBe(2);
  });

  it('update a document without defaultFields', async () => {
    setConfig({ defaultFields: false });
    const data = { age: 21, address: { city: 'Orlando' } };
    await testModel.insertOne({ name: 'Angela', age: 19 });
    const updated = await testModel.updateOne({ name: 'Angela' }, data);
    expect(updated.age).toBe(21);
    expect(updated.address.city).toBe('Orlando');
    expect(updated._version).toBe(2);
    expect(updated._created).toBeUndefined();
    expect(updated._updated).toBeUndefined();
  });

  it('update a document with $unset', async () => {
    const data = { $unset: { address: 1 } };
    const updated = await testModel.updateOne({ name: 'John' }, data);
    expect(updated.address).toBeUndefined();
  });

  it('replace a document with $unset', async () => {
    const data = { $unset: { address: 1 } };
    expect(() => testModel.replaceOne({ name: 'John' }, data)).rejects.toThrow();
  });

  it('update a document with $unset (non-existing field)', async () => {
    const data = { $unset: { color: 1 } };
    const updated = await testModel.updateOne({ name: 'John' }, data);
    expect(updated.color).toBeUndefined();
  });
});

describe('model.updateMany', () => {
  it('update many documents', async () => {
    const data = { age: 32, address: { city: 'Miami' } };
    const updated = await testModel.updateMany({ name: { $in: ['John', 'Jane'] } }, data);
    expect(updated.length).toBe(2);
    expect(updated[0].age).toBe(32);
    expect(updated[0].address.city).toBe('Miami');
    expect(updated[0]._version).toBe(2);
    expect(updated[0]._updated).toBeDefined();
    await expect(testModel.updateMany(null, data)).rejects.toThrow(/query/);
    await expect(testModel.updateMany({ name: 'John' }, null)).rejects.toThrow(/updates/);
  });
});

describe('model.replaceMany', () => {
  it('replace many documents', async () => {
    const data = { name: 'John Replaced', age: 50, address: { city: 'Seattle' } };
    const updated = await testModel.replaceMany({ name: { $in: ['John', 'Jane'] } }, data);
    expect(updated.length).toBe(2);
    expect(updated[0].name).toBe('John Replaced');
    expect(updated[0].age).toBe(50);
    expect(updated[0].address.city).toBe('Seattle');
    expect(updated[0]._version).toBe(2);
    expect(updated[0]._updated).toBeDefined();
    await expect(testModel.replaceMany(null, data)).rejects.toThrow(/query/);
    await expect(testModel.replaceMany({ name: 'John' }, null)).rejects.toThrow(/updates/);
  });
});

describe('model.findByIdAndUpdate ', () => {
  it('update a document', async () => {
    const find = await testModel.findOne({ name: 'John' });
    const data = { age: 32, address: { city: 'Miami' } };
    const updated = await testModel.findByIdAndUpdate(find._id, data);
    expect(updated.age).toBe(32);
    expect(updated.address.city).toBe('Miami');
    expect(updated._version).toBe(2);
    expect(updated._updated).toBeDefined();
  });
});

describe('model.findByIdAndReplace', () => {
  it('replace a document by id', async () => {
    const find = await testModel.findOne({ name: 'John' });
    const replacement = { name: 'John Replaced', age: 50, address: { city: 'Seattle' } };
    const replaced = await testModel.findByIdAndReplace(find._id, replacement);
    expect(replaced.name).toBe('John Replaced');
    expect(replaced.age).toBe(50);
    expect(replaced.address.city).toBe('Seattle');
    expect(replaced._version).toBe(2);
    expect(replaced._updated).toBeDefined();
    expect(replaced._created).toBeDefined();
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
    const preHook = jest.fn();
    testModel.pre('create', preHook);
    const data = { name: 'Loren', age: 35, address: { city: 'Manhattan' } };
    await testModel.insertOne(data);
    expect(preHook).toHaveBeenCalled();
  });
});

describe('model.post', () => {
  it('post save hook', async () => {
    const postHook = jest.fn();
    testModel.post('create', postHook);
    const data = { name: 'Loren', age: 35, address: { city: 'Manhattan' } };
    await testModel.insertOne(data);
    expect(postHook).toHaveBeenCalled();
  });
});

describe('additional tests for model', () => {
  it('resetConfig sets config to defaultConfig with diskWrite false', () => {
    setConfig({ diskWrite: true, defaultFields: false });
    resetConfig();
    const currentConfig = require('../../src/lib/config').getConfig?.() || {};
    expect(currentConfig.diskWrite).toBe(false);
    expect(currentConfig.defaultFields).toBe(defaultConfig.defaultFields);
  });

  it('insertOne accepts document with missing fields when strict mode is disabled', async () => {
    resetConfig();
    setConfig({ strict: false });
    const data = { name: 'Anna' };
    const created = await testModel.insertOne(data);
    expect(created.name).toBe('Anna');
  });

  it('find accepts empty object {} as valid query', async () => {
    const allDocs = await testModel.find({});
    expect(allDocs.length).toBeGreaterThan(0);
  });

  it('updateOne merges nested object fields rather than replacing whole object', async () => {
    const initial = await testModel.findOne({ name: 'John' });
    const partialUpdate = { address: { city: 'Boston' } };
    const updated = await testModel.updateOne({ _id: initial._id }, partialUpdate);
    expect(updated.address.city).toBe('Boston');
  });

  it('multiple updates increment version correctly', async () => {
    const initial = await testModel.findOne({ name: 'John' });
    const firstUpdate = await testModel.updateOne({ _id: initial._id }, { age: 40 });
    expect(firstUpdate._version).toBe((initial._version || 1) + 1);
    const secondUpdate = await testModel.updateOne({ _id: initial._id }, { age: 45 });
    expect(secondUpdate._version).toBe(firstUpdate._version + 1);
  });

  it('count rejects when query is missing or invalid', async () => {
    await expect(testModel.count()).rejects.toThrow(/query/);
    await expect(testModel.count(null)).rejects.toThrow(/query/);
  });
});

describe('Model update unique field validation', () => {
  let users;

  beforeAll(() => {
    users = model('users', {
      email: { type: 'string', unique: true },
      name: { type: 'string' },
    });
  });

  beforeEach(async () => {
    await users.deleteMany({});
  });

  test('should throw error when inserting duplicate unique field', async () => {
    await users.insertOne({ email: 'a@example.com', name: 'User A' });
    await expect(users.insertOne({ email: 'a@example.com', name: 'User B' })).rejects.toThrow();
  });

  test('should not throw error when inserting null unique field', async () => {
    const user = await users.insertOne({ email: undefined, name: 'User A' });
    expect(user.email).toBe(undefined);
  });

  test('should throw error when updating to duplicate unique field', async () => {
    await users.insertOne({ email: 'a@example.com', name: 'User A' });
    const user2 = await users.insertOne({ email: 'b@example.com', name: 'User B' });

    await expect(users.updateOne({ _id: user2._id }, { email: 'a@example.com' })).rejects.toThrow();
  });

  test('should allow updating unique field if no conflict', async () => {
    const user = await users.insertOne({ email: 'c@example.com', name: 'User C' });
    const updated = await users.updateOne({ _id: user._id }, { email: 'd@example.com' });
    expect(updated.email).toBe('d@example.com');
  });

  test('should allow updating non-unique fields freely', async () => {
    const user = await users.insertOne({ email: 'e@example.com', name: 'User E' });
    const updated = await users.updateOne({ _id: user._id }, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
    expect(updated.email).toBe('e@example.com');
  });
});
