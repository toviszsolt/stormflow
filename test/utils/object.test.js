const {
  objSerialize,
  objClone,
  objTraverse,
  objPathResolve,
  objPathSet,
} = require('../../utils/object');

describe('objectUtils', () => {
  describe('objSerialize', () => {
    it('serializes an object correctly', () => {
      const obj = { a: 1, b: { c: 2 } };
      const serialized = objSerialize(obj);
      expect(serialized).toEqual(obj);
    });

    it('returns null for null or undefined input', () => {
      expect(objSerialize(null)).toBeNull();
      expect(objSerialize(undefined)).toBeNull();
    });
  });

  describe('objClone', () => {
    it('not clones class objects', () => {
      const parent = { name: 'John', age: 40 };
      const child = Object.create(parent);
      child.gender = 'male';

      const cloned = objClone(child);

      expect(cloned).toEqual(child);
      expect(cloned).not.toBe(child);
    });

    it('clones null or undefined input as is', () => {
      expect(objClone(null)).toBeNull();
      expect(objClone(undefined)).toBeUndefined();
    });

    it('clones a primitive value correctly', () => {
      expect(objClone(123)).toBe(123);
      expect(objClone('it')).toBe('it');
    });

    it('clones a Date correctly', () => {
      const date = new Date();
      const cloned = objClone(date);
      expect(cloned).toEqual({});
    });

    it('clones a RegExp correctly', () => {
      const regex = /abc/g;
      const cloned = objClone(regex);
      expect(cloned).toEqual({});
    });

    it('clones an empty object correctly', () => {
      const obj = {};
      const cloned = objClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj); // Ensure deep cloning
    });

    it('clones an object correctly', () => {
      const obj = { a: 1, b: { c: 2 } };
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

    it('returns non-objects as is', () => {
      expect(objClone(123)).toBe(123);
      expect(objClone('it')).toBe('it');
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

  describe('objPathSet function', () => {
    it('should set value in object at given path', () => {
      const obj = {};
      objPathSet(obj, 'a.b.c', 123);
      expect(obj).toEqual({ a: { b: { c: 123 } } });
    });

    it('should overwrite existing value at given path', () => {
      const obj = { a: { b: { c: 123 } } };
      objPathSet(obj, 'a.b.c', 456);
      expect(obj).toEqual({ a: { b: { c: 456 } } });
    });

    it('should handle nested path with non-existent intermediate keys', () => {
      const obj = {};
      objPathSet(obj, 'a.b.c', 123);
      expect(obj).toEqual({ a: { b: { c: 123 } } });
    });
  });
});
