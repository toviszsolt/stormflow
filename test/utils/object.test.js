const {
  objSerialize,
  objClone,
  objTraverse,
  objPathResolve,
  objPathSet,
} = require('../../utils/object');

describe('objSerialize', () => {
  it('serializes an object correctly', () => {
    const obj = { a: 1, b: { c: 2 } };
    const serialized = objSerialize(obj);
    expect(serialized).toEqual(obj);
  });

  it('serializes an array correctly', () => {
    const obj = [1, null, 2];
    const serialized = objSerialize(obj);
    expect(serialized).toEqual(obj);
  });

  it('serializes null and undefined correctly', () => {
    expect(objSerialize(null)).toBeNull();
    expect(objSerialize(undefined)).toBeUndefined();
  });

  it('serializes primitives correctly', () => {
    expect(objSerialize(123)).toBe(123);
    expect(objSerialize('it')).toBe('it');
    expect(objSerialize(true)).toBe(true);
    expect(objSerialize(false)).toBe(false);
  });
});

describe('objClone', () => {
  it('clones an object correctly', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = objClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Ensure deep cloning
  });

  it('clones empty object correctly', () => {
    const obj = {};
    const cloned = objClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Ensure deep cloning
  });

  it('clones an array correctly', () => {
    const obj = [1, 2, 3];
    const cloned = objClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Ensure deep cloning
  });

  it('clones empty array correctly', () => {
    const obj = [];
    const cloned = objClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Ensure deep cloning
  });

  it('clones null or undefined correctly', () => {
    expect(objClone(null)).toBeNull();
    expect(objClone(undefined)).toBeUndefined();
  });

  it('clones a primitives correctly', () => {
    expect(objClone(123)).toBe(123);
    expect(objClone('it')).toBe('it');
    expect(objClone(true)).toBe(true);
    expect(objClone(false)).toBe(false);
  });

  it('clones object with only own properties', () => {
    const parent = { name: 'John', age: 40 };
    const child = Object.create(parent);
    child.gender = 'male';

    const cloned = objClone(child);

    expect(cloned).toEqual(child);
    expect(cloned).not.toBe(child);
  });

  it('not clones a function', () => {
    const func = () => {};
    const cloned = objClone(func);
    expect(cloned).toEqual(func);
  });

  it('not clones a Date object', () => {
    const date = new Date();
    const cloned = objClone(date);
    expect(cloned).toEqual({});
  });

  it('not clones a RegExp object', () => {
    const regex = /abc/g;
    const cloned = objClone(regex);
    expect(cloned).toEqual({});
  });
});

describe('objTraverse', () => {
  it('traverses through an object correctly', () => {
    const obj = { a: 1, b: { c: 2 } };
    const mockCallback = jest.fn();
    objTraverse(obj, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(3); // 'a', 1, 'b.c'
  });

  it('handles null or undefined input', () => {
    const mockCallback = jest.fn();
    objTraverse(null, mockCallback);
    expect(mockCallback).not.toHaveBeenCalled();
  });
});

describe('objPathResolve', () => {
  it('resolves paths correctly in an object', () => {
    const obj = { a: { b: { c: 123 } } };
    expect(objPathResolve(obj, 'a.b.c')).toBe(123);
  });

  it('returns the object if the path is empty or undefined', () => {
    const obj = { a: 123 };
    expect(objPathResolve(obj, '')).toBe(obj);
    expect(objPathResolve(obj, undefined)).toBe(obj);
  });

  it('handles non-existent paths', () => {
    const obj = { a: { b: { c: 123 } } };
    expect(objPathResolve(obj, 'x.y.z')).toBeUndefined();
  });
});

describe('objPathSet', () => {
  it('set value in object at given path', () => {
    const obj = {};
    objPathSet(obj, 'a.b.c', 123);
    expect(obj).toEqual({ a: { b: { c: 123 } } });
  });

  it('overwrite existing value at given path', () => {
    const obj = { a: { b: { c: 123 } } };
    objPathSet(obj, 'a.b.c', 456);
    expect(obj).toEqual({ a: { b: { c: 456 } } });
  });

  it('handle nested path with non-existent intermediate keys', () => {
    const obj = {};
    objPathSet(obj, 'a.b.c', 123);
    expect(obj).toEqual({ a: { b: { c: 123 } } });
  });
});
