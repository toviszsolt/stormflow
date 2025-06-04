const { objSerialize, objClone, objTraverse, objPathResolve, objPathSet } = require('../../src/utils/object');

describe('objSerialize', () => {
  it('serialize object correctly', () => {
    const obj = { a: 1, b: { c: 2 } };
    const serialized = objSerialize(obj);
    expect(serialized).toEqual(obj);
  });

  it('serialize array correctly', () => {
    const obj = [1, null, 2];
    const serialized = objSerialize(obj);
    expect(serialized).toEqual(obj);
  });

  it('serialize null and undefined correctly', () => {
    expect(objSerialize(null)).toBeNull();
    expect(objSerialize(undefined)).toBeUndefined();
  });

  it('serialize primitives correctly', () => {
    expect(objSerialize(123)).toBe(123);
    expect(objSerialize('it')).toBe('it');
    expect(objSerialize(true)).toBe(true);
    expect(objSerialize(false)).toBe(false);
  });
});

describe('objClone', () => {
  it('clone object correctly', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = objClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Ensure deep cloning
  });

  it('clone empty object correctly', () => {
    const obj = {};
    const cloned = objClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Ensure deep cloning
  });

  it('clone array correctly', () => {
    const obj = [1, 2, 3];
    const cloned = objClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Ensure deep cloning
  });

  it('clone empty array correctly', () => {
    const obj = [];
    const cloned = objClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Ensure deep cloning
  });

  it('clone null or undefined correctly', () => {
    expect(objClone(null)).toBeNull();
    expect(objClone(undefined)).toBeUndefined();
  });

  it('clone primitives correctly', () => {
    expect(objClone(123)).toBe(123);
    expect(objClone('it')).toBe('it');
    expect(objClone(true)).toBe(true);
    expect(objClone(false)).toBe(false);
  });

  it('clone object with own properties only', () => {
    const parent = { name: 'John', age: 40 };
    const child = Object.create(parent);
    child.gender = 'male';

    const cloned = objClone(child);

    expect(cloned).toEqual(child);
    expect(cloned).not.toBe(child);
  });

  it('does not clone function', () => {
    const func = () => {};
    const cloned = objClone(func);
    expect(typeof cloned).toBe('function');
    expect(cloned).toEqual(func);
  });

  it('does not clone Date object', () => {
    const date = new Date();
    const cloned = objClone(date);
    expect(cloned).toEqual({});
  });

  it('does not clone RegExp object', () => {
    const regex = /abc/g;
    const cloned = objClone(regex);
    expect(cloned).toEqual({});
  });
});

describe('objTraverse', () => {
  it('traverse through object correctly', () => {
    const obj = { a: 1, b: { c: 2 } };
    const mockCallback = jest.fn();
    objTraverse(obj, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(3); // 'a', 1, 'b.c'
  });

  it('handle null or undefined input', () => {
    const mockCallback = jest.fn();
    objTraverse(null, mockCallback);
    expect(mockCallback).not.toHaveBeenCalled();
  });
});

describe('objPathResolve', () => {
  it('resolve object paths correctly', () => {
    const obj = { a: { b: { c: 123 } } };
    expect(objPathResolve(obj, 'a.b.c')).toBe(123);
  });

  it('return the object if the path is empty or undefined', () => {
    const obj = { a: 123 };
    expect(objPathResolve(obj, '')).toBe(obj);
    expect(objPathResolve(obj, undefined)).toBe(obj);
  });

  it('handle non-existent paths', () => {
    const obj = { a: { b: { c: 123 } } };
    expect(objPathResolve(obj, 'x.y.z')).toBeUndefined();
  });
});

describe('objPathSet', () => {
  it('set object property correctly', () => {
    const obj1 = {};
    objPathSet(obj1, 'a.b.c', 123);
    expect(obj1).toEqual({ a: { b: { c: 123 } } });

    const obj2 = {};
    objPathSet(obj2, 'a.b.0', 99);
    expect(obj2).toEqual({ a: { b: [99] } });

    const obj3 = {};
    objPathSet(obj3, 'a.b.1', 99);
    expect(obj3).toEqual({ a: { b: [, 99] } });
  });

  it('overwrite existing value correctly', () => {
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
