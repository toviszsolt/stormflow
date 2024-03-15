const { registerMiddleware, executeMiddleware } = require('../../lib/middleware');

let mockMiddlewareFn;

beforeEach(() => {
  jest.resetModules();
  mockMiddlewareFn = jest.fn((res, next) => {
    // console.log('Executing mock middleware...');
    next();
  });
});

describe('executeMiddleware', () => {
  it('Single method', async () => {
    const res = {};
    registerMiddleware('pre', 'products', 'create', mockMiddlewareFn);
    await executeMiddleware('pre', 'products', 'create', res);

    expect(mockMiddlewareFn).toHaveBeenCalled();
    expect(mockMiddlewareFn).toHaveBeenCalledTimes(1);
  });

  it('Multiple methods', async () => {
    const res = {};
    registerMiddleware('pre', 'products', ['create', 'update'], mockMiddlewareFn);
    await executeMiddleware('pre', 'products', 'create', res);
    await executeMiddleware('pre', 'products', 'update', res);

    expect(mockMiddlewareFn).toHaveBeenCalled();
    expect(mockMiddlewareFn).toHaveBeenCalledTimes(2);
  });

  it('Invalid middleware', async () => {
    const res = {};
    registerMiddleware(null);
    await executeMiddleware('pre', 'products', 'create', res);

    expect(mockMiddlewareFn).not.toHaveBeenCalled();
    expect(mockMiddlewareFn).toHaveBeenCalledTimes(0);
  });

  it('Non-exist middleware', async () => {
    const res = {};
    registerMiddleware('pre', 'products', 'create', mockMiddlewareFn);
    await executeMiddleware('post', 'products', 'create', res);

    expect(mockMiddlewareFn).not.toHaveBeenCalled();
    expect(mockMiddlewareFn).toHaveBeenCalledTimes(0);
  });
});
