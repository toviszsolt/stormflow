import { applyQuery } from '../../src/lib/query.js';

describe('applyQuery', () => {
  const collection = [
    { name: 'Alice', age: 30, city: 'New York', address: { street: 'Main St', number: 123 } },
    { name: 'Bob', age: 25, city: 'Los Angeles', address: { street: 'Park Ave', number: 456 } },
    { name: 'Charlie', age: 35, city: 'Chicago', address: { street: 'Market St', number: 789 } },
    { name: 'Dave', age: 40, city: 'Boston', address: { street: 'Broadway', number: 100, details: { zip: '02115' } } },
  ];

  it('return the original collection if no query is provided', () => {
    expect(applyQuery(collection, null)).toEqual(collection);
  });

  it('returns original collection if query is null or undefined', () => {
    expect(applyQuery(collection, null)).toEqual(collection);
    expect(applyQuery(collection, undefined)).toEqual(collection);
  });

  it('returns original collection if query is invalid type', () => {
    [42, 'string', true].forEach((q) => {
      expect(applyQuery(collection, q)).toEqual(collection);
    });
  });

  it('returns original collection if query is empty object', () => {
    expect(applyQuery(collection, {})).toEqual(collection);
  });

  it('returns empty array if collection is empty', () => {
    expect(applyQuery([], { age: { $gt: 20 } })).toEqual([]);
  });

  it('filter with $and operator', () => {
    const query = { $and: [{ age: { $gt: 25 } }, { city: 'Chicago' }] };
    const collectionArr = Array.from(collection.values());
    expect(applyQuery(collection, query)).toEqual(collectionArr.filter((el) => el.age > 25 && el.city === 'Chicago'));
  });

  it('filter with deep $and operator', () => {
    const query = { $and: [{ age: { $gt: 25 } }, { city: 'Chicago' }, { 'address.street': 'Market St' }] };
    const collectionArr = Array.from(collection.values());
    expect(applyQuery(collection, query)).toEqual(
      collectionArr.filter((el) => el.age > 25 && el.city === 'Chicago' && el.address.street === 'Market St'),
    );
  });

  it('filter with $or operator', () => {
    const query = { $or: [{ age: { $lt: 25 } }, { city: 'New York' }] };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.age < 25 || el.city === 'New York'));
  });

  it('filter with $not operator', () => {
    const query = { $not: { age: { $lt: 25 } } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.age >= 25));
  });

  it('filter with $nor operator', () => {
    const query = { $nor: [{ age: { $lt: 25 } }, { city: 'New York' }] };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.age >= 25 && el.city !== 'New York'));
  });

  it('filter with combined $and and $or operators', () => {
    const query = { $and: [{ age: { $gte: 25 } }, { $or: [{ city: 'Chicago' }, { 'address.street': 'Main St' }] }] };

    const result = applyQuery(collection, query);
    const uniqueResult = Array.from(new Set(result));

    const expected = collection.filter(
      (el) => el.age >= 25 && (el.city === 'Chicago' || el.address?.street === 'Main St'),
    );

    const sortFn = (a, b) => {
      if (a._id && b._id) return a._id.localeCompare(b._id);
      if (a.name && b.name) return a.name.localeCompare(b.name);
      return 0;
    };

    uniqueResult.sort(sortFn);
    expected.sort(sortFn);

    expect(uniqueResult).toEqual(expected);
  });

  it('filter with $eq operator', () => {
    const query = { name: { $eq: 'Alice' } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.name === 'Alice'));
  });

  it('filter with $ne operator', () => {
    const query = { name: { $ne: 'Alice' } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.name !== 'Alice'));
  });

  it('filter with $in operator', () => {
    const query = { name: { $in: ['Alice', 'Bob'] } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.name === 'Alice' || el.name === 'Bob'));
  });

  it('filter with $nin operator', () => {
    const query = { name: { $nin: ['Alice', 'Bob'] } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.name !== 'Alice' && el.name !== 'Bob'));
  });

  it('filter with $lt operator', () => {
    const query = { age: { $lt: 30 } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.age < 30));
  });

  it('filter with $lte operator', () => {
    const query = { age: { $lte: 30 } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.age <= 30));
  });

  it('filter with $gt operator', () => {
    const query = { age: { $gt: 30 } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.age > 30));
  });

  it('filter with $gte operator', () => {
    const query = { age: { $gte: 30 } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.age >= 30));
  });

  it('filter with $regex operator', () => {
    const query = { name: { $regex: '^A' } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.name.match(/^A/)));
  });

  it('filter with $regex and $options operator', () => {
    const query = { name: { $regex: '^A', $options: 'i' } };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.name.match(/^A/i)));
  });

  it('filter with invalid operators returns empty array', () => {
    const query = { name: { $invalid: 'Alice' } };
    expect(applyQuery(collection, query)).toEqual([]);
  });

  it('filter without operators works as $eq', () => {
    const query = { name: 'Alice' };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.name === 'Alice'));
  });

  it('returns empty array if filtering on non-existent field', () => {
    const query = { nonExistentField: { $eq: 'value' } };
    expect(applyQuery(collection, query)).toEqual([]);
  });

  it('filter with deeply nested property', () => {
    const query = { 'address.details.zip': '02115' };
    expect(applyQuery(collection, query)).toEqual(collection.filter((el) => el.address?.details?.zip === '02115'));
  });

  it('returns empty array if type does not match', () => {
    const query = { age: { $eq: '30' } };
    expect(applyQuery(collection, query)).toEqual([]);
  });
});
