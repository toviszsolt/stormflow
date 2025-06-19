import { executeMiddleware, registerMiddleware, unregisterMiddleware } from '../../src/lib/middleware.js';

describe('Middleware module', () => {
  describe('registerMiddleware', () => {
    it('throws error if invalid type is passed', () => {
      expect(() => registerMiddleware('invalidType', 'products', 'create', () => {})).toThrow(
        'Invalid middleware type: invalidType',
      );
    });

    it('throws error if collection is not a string', () => {
      expect(() => registerMiddleware('pre', 123, 'create', () => {})).toThrow('Invalid middleware collection: 123');
    });

    it('throws error if method is not string or not allowed', () => {
      expect(() => registerMiddleware('pre', 'products', 123, () => {})).toThrow('Invalid middleware method: 123');
      expect(() => registerMiddleware('pre', 'products', 'invalidMethod', () => {})).toThrow(
        'Invalid middleware method: invalidMethod',
      );
    });

    it('throws error if fn is not a function', () => {
      expect(() => registerMiddleware('pre', 'products', 'create', 'notFn')).toThrow(
        'Invalid middleware function: notFn',
      );
    });

    it('registers successfully with valid inputs', () => {
      const id = registerMiddleware('pre', 'products', 'create', () => {});
      globalThis.__registeredMiddlewareIds = globalThis.__registeredMiddlewareIds || [];
      globalThis.__registeredMiddlewareIds.push(id);
      expect(typeof id).toBe('string');
    });

    it('registers multiple middleware if method is an array', () => {
      const ids = registerMiddleware('post', 'orders', ['create', 'update'], () => {});
      globalThis.__registeredMiddlewareIds = globalThis.__registeredMiddlewareIds || [];
      globalThis.__registeredMiddlewareIds.push(...ids);
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBe(2);
      ids.forEach((id) => expect(typeof id).toBe('string'));
    });
  });

  describe('unregisterMiddleware', () => {
    it('throws error if id is not a string', () => {
      expect(() => unregisterMiddleware(123)).toThrow('Invalid middleware id: 123');
    });

    it('removes existing middleware and returns true', () => {
      const id = registerMiddleware('pre', 'products', 'create', () => {});
      globalThis.__registeredMiddlewareIds = globalThis.__registeredMiddlewareIds || [];
      globalThis.__registeredMiddlewareIds.push(id);
      expect(unregisterMiddleware(id)).toBe(true);
    });

    it('returns false if middleware id not found', () => {
      expect(unregisterMiddleware('non-existent-id')).toBe(false);
    });
  });

  describe('executeMiddleware', () => {
    it('calls middleware callback once', async () => {
      const fn = jest.fn();
      const id = registerMiddleware('pre', 'products', 'create', fn);
      globalThis.__registeredMiddlewareIds = globalThis.__registeredMiddlewareIds || [];
      globalThis.__registeredMiddlewareIds.push(id);
      const res = {};
      await executeMiddleware('pre', 'products', 'create', res);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(res);
    });

    it('calls middleware multiple times if method array and multiple res', async () => {
      const fn = jest.fn();
      const ids = registerMiddleware('pre', 'products', ['create', 'update'], fn);
      globalThis.__registeredMiddlewareIds = globalThis.__registeredMiddlewareIds || [];
      globalThis.__registeredMiddlewareIds.push(...ids);
      const resArray = [{}, {}];
      await executeMiddleware('pre', 'products', 'create', resArray);
      await executeMiddleware('pre', 'products', 'update', resArray);
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('does not call middleware if type or method does not match', async () => {
      const fn = jest.fn();
      const id = registerMiddleware('pre', 'products', 'create', fn);
      globalThis.__registeredMiddlewareIds = globalThis.__registeredMiddlewareIds || [];
      globalThis.__registeredMiddlewareIds.push(id);
      await executeMiddleware('post', 'products', 'create', {});
      expect(fn).not.toHaveBeenCalled();
    });

    it('throws if middleware function throws', async () => {
      const errorFn = jest.fn(async () => {
        throw new Error('fail');
      });
      const id = registerMiddleware('pre', 'products', 'create', errorFn);
      globalThis.__registeredMiddlewareIds = globalThis.__registeredMiddlewareIds || [];
      globalThis.__registeredMiddlewareIds.push(id);
      await expect(executeMiddleware('pre', 'products', 'create', {})).rejects.toThrow('fail');
      expect(errorFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('wildcard middleware', () => {
    it('calls middleware for any method when method is *', async () => {
      const fn = jest.fn();
      const id = registerMiddleware('pre', 'products', '*', fn);
      globalThis.__registeredMiddlewareIds = globalThis.__registeredMiddlewareIds || [];
      globalThis.__registeredMiddlewareIds.push(id);
      await executeMiddleware('pre', 'products', 'create', {});
      await executeMiddleware('pre', 'products', 'update', {});
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not call middleware for type wildcard', async () => {
      const fn = jest.fn();
      // type wildcard nem támogatott
      expect(() => registerMiddleware('*', 'products', 'create', fn)).toThrow('Invalid middleware type: *');
    });

    it('does not call middleware for collection wildcard', async () => {
      const fn = jest.fn();
      // collection wildcard nem támogatott
      expect(() => registerMiddleware('pre', '*', 'create', fn)).toThrow('Invalid middleware collection: *');
    });
  });

  afterEach(() => {
    // Az összes regisztrált middleware eltávolítása
    // A registerMiddleware visszatérési értéke lehet string vagy tömb
    if (globalThis.__registeredMiddlewareIds) {
      for (const id of globalThis.__registeredMiddlewareIds) {
        unregisterMiddleware(id);
      }
      globalThis.__registeredMiddlewareIds = [];
    }
  });
});
