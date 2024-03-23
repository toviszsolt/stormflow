const { registerMiddleware, executeMiddleware } = require('../../src/lib/middleware');

let fnCallbackSync, fnCallbackAsync;

beforeEach(() => {
  jest.clearAllMocks();
  fnCallbackSync = jest.fn();
  fnCallbackAsync = jest.fn(async (doc, next) => next());
});

describe('executeMiddleware', () => {
  it('Single method', async () => {
    const res = {};
    registerMiddleware('pre', 'products', 'create', fnCallbackSync);
    await executeMiddleware('pre', 'products', 'create', res);

    expect(fnCallbackSync).toHaveBeenCalled();
    expect(fnCallbackSync).toHaveBeenCalledTimes(1);
  });

  it('Multiple methods', async () => {
    const res = {};
    registerMiddleware('pre', 'products', ['create', 'update'], fnCallbackAsync);
    await executeMiddleware('pre', 'products', 'create', res);
    await executeMiddleware('pre', 'products', 'update', res);
    expect(fnCallbackAsync).toHaveBeenCalledTimes(2);
  });

  it('Multiple callbacks', async () => {
    const res = {};
    registerMiddleware('pre', 'products', ['create', 'update'], fnCallbackAsync);
    await executeMiddleware('pre', 'products', 'create', [res, res]);
    expect(fnCallbackAsync).toHaveBeenCalledTimes(2);
  });

  it('Invalid middleware', async () => {
    const res = {};
    registerMiddleware(null);

    await executeMiddleware('pre', 'products', 'create', res);

    expect(fnCallbackSync).not.toHaveBeenCalled();
    expect(fnCallbackSync).toHaveBeenCalledTimes(0);
  });

  it('Non-exist middleware', async () => {
    const res = {};
    registerMiddleware('pre', 'products', 'create', fnCallbackSync);
    await executeMiddleware('post', 'products', 'create', res);

    expect(fnCallbackSync).not.toHaveBeenCalled();
    expect(fnCallbackSync).toHaveBeenCalledTimes(0);
  });

  it('Callback thow error', async () => {
    const res = {};
    const errorMessage = 'Error message';
    const mockedCallback = jest.fn((doc, next) => next(new Error(errorMessage)));

    registerMiddleware('pre', 'products', 'create', mockedCallback);

    await expect(executeMiddleware('pre', 'products', 'create', res)).rejects.toThrow(errorMessage);
    expect(mockedCallback).toHaveBeenCalledTimes(1);
    expect(mockedCallback).toHaveBeenCalledWith(res, expect.any(Function));
  });
});
