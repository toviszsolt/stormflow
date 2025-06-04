const { registerMiddleware, executeMiddleware } = require('../../src/lib/middleware');

let fnCallbackSync, fnCallbackAsync;

beforeEach(() => {
  jest.clearAllMocks();
  fnCallbackSync = jest.fn();
  fnCallbackAsync = jest.fn(async (doc, next) => next());
});

describe('executeMiddleware', () => {
  it('calls a single middleware method', async () => {
    const res = {};
    registerMiddleware('pre', 'products', 'create', fnCallbackSync);
    await executeMiddleware('pre', 'products', 'create', res);
    expect(fnCallbackSync).toHaveBeenCalled();
    expect(fnCallbackSync).toHaveBeenCalledTimes(1);
  });

  it('calls middleware for multiple methods', async () => {
    const res = {};
    registerMiddleware('pre', 'products', ['create', 'update'], fnCallbackAsync);
    await executeMiddleware('pre', 'products', 'create', res);
    await executeMiddleware('pre', 'products', 'update', res);
    expect(fnCallbackAsync).toHaveBeenCalledTimes(2);
  });

  it('calls middleware multiple times when input is an array', async () => {
    const res = {};
    registerMiddleware('pre', 'products', ['create', 'update'], fnCallbackAsync);
    await executeMiddleware('pre', 'products', 'create', [res, res]);
    expect(fnCallbackAsync).toHaveBeenCalledTimes(2);
  });

  it('does not call middleware if invalid args in registerMiddleware', async () => {
    const res = {};
    registerMiddleware(null);
    await executeMiddleware('pre', 'products', 'create', res);
    expect(fnCallbackSync).not.toHaveBeenCalled();
  });

  it('does not call middleware if phase does not exist', async () => {
    const res = {};
    registerMiddleware('pre', 'products', 'create', fnCallbackSync);
    await executeMiddleware('post', 'products', 'create', res);
    expect(fnCallbackSync).not.toHaveBeenCalled();
  });

  it('throws when middleware callback errors', async () => {
    const res = {};
    const errorMessage = 'Error message';
    const mockedCallback = jest.fn((doc, next) => next(new Error(errorMessage)));
    registerMiddleware('pre', 'products', 'create', mockedCallback);
    await expect(executeMiddleware('pre', 'products', 'create', res)).rejects.toThrow(errorMessage);
    expect(mockedCallback).toHaveBeenCalledTimes(1);
    expect(mockedCallback).toHaveBeenCalledWith(res, expect.any(Function));
  });

  it('ignores invalid middleware types and resources', async () => {
    const res = {};
    const fnOther = jest.fn();
    expect(() => registerMiddleware('invalidType', 'products', 'create', fnOther)).not.toThrow();
    await executeMiddleware('invalidType', 'products', 'create', res);
    expect(fnOther).not.toHaveBeenCalled();
    registerMiddleware('pre', 'products', 'create', fnCallbackSync);
    await executeMiddleware('pre', 'nonexistentResource', 'create', res);
    await executeMiddleware('pre', 'products', 'nonexistentMethod', res);
    expect(fnCallbackSync).not.toHaveBeenCalled();
  });
});
