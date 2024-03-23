const { applyQuery } = require('../../src/lib/query');

describe('applyQuery', () => {
  const collection = [
    { name: 'Alice', age: 30, city: 'New York', address: { street: 'Main St', number: 123 } },
    { name: 'Bob', age: 25, city: 'Los Angeles', address: { street: 'Park Ave', number: 456 } },
    { name: 'Charlie', age: 35, city: 'Chicago', address: { street: 'Market St', number: 789 } },
  ];

  it('return the original collection if no query is provided', () => {
    const result = applyQuery(collection, null);
    expect(result).toEqual(collection);
  });

  it('filter with $and operator', () => {
    const query = { $and: [{ age: { $gt: 25 } }, { city: 'Chicago' }] };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age > 25 && el.city === 'Chicago';
      }),
    );
  });

  it('filter with deep $and operator', () => {
    const query = { $and: [{ age: { $gt: 25 } }, { city: 'Chicago' }, { 'address.street': 'Market St' }] };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age > 25 && el.city === 'Chicago' && el.address.street === 'Market St';
      }),
    );
  });

  it('filter with $or operator', () => {
    const query = { $or: [{ age: { $lt: 25 } }, { city: 'New York' }] };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age < 25 || el.city === 'New York';
      }),
    );
  });

  it('filter with $not operator', () => {
    const query = { $not: { age: { $lt: 25 } } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age >= 25;
      }),
    );
  });

  it('filter with $nor operator', () => {
    const query = { $nor: [{ age: { $lt: 25 } }, { city: 'New York' }] };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age >= 25 && el.city !== 'New York';
      }),
    );
  });

  it('filter with $and and $or operator', () => {
    const query = { $or: [{ age: { $lt: 25 } }, { city: 'New York' }] };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age < 25 || el.city === 'New York';
      }),
    );
  });

  it('filter with $eq operator', () => {
    const query = { name: { $eq: 'Alice' } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.name === 'Alice';
      }),
    );
  });

  it('filter with $ne operator', () => {
    const query = { name: { $ne: 'Alice' } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.name !== 'Alice';
      }),
    );
  });

  it('filter with $in operator', () => {
    const query = { name: { $in: ['Alice', 'Bob'] } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.name === 'Alice' || el.name === 'Bob';
      }),
    );
  });

  it('filter with $nin operator', () => {
    const query = { name: { $nin: ['Alice', 'Bob'] } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.name !== 'Alice' && el.name !== 'Bob';
      }),
    );
  });

  it('filter with $lt operator', () => {
    const query = { age: { $lt: 30 } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age < 30;
      }),
    );
  });

  it('filter with $lte operator', () => {
    const query = { age: { $lte: 30 } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age <= 30;
      }),
    );
  });

  it('filter with $gt operator', () => {
    const query = { age: { $gt: 30 } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age > 30;
      }),
    );
  });

  it('filter with $gte operator', () => {
    const query = { age: { $gte: 30 } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.age >= 30;
      }),
    );
  });

  it('filter with $regex operator', () => {
    const query = { name: { $regex: '^A' } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.name.match(/^A/);
      }),
    );
  });

  it('filter with $regex and $options operator', () => {
    const query = { name: { $regex: '^A', $options: 'i' } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.name.match(/^A/i);
      }),
    );
  });

  it('filter with invalid operators', () => {
    const query = { name: { $invalid: 'Alice' } };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return false;
      }),
    );
  });

  it('filter without operators', () => {
    const query = { name: 'Alice' };
    const result = applyQuery(collection, query);
    expect(result).toEqual(
      collection.filter((el) => {
        return el.name === 'Alice';
      }),
    );
  });
});
