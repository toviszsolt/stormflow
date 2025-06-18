import db from '../src/stormflow.js';

beforeAll(async () => {
  await db.start();
});

beforeEach(() => {
  db.setConfig({ strict: true });
});

describe('stormflow', () => {
  it('does not re-init and throw error', async () => {
    await expect(db.start()).rejects.toThrow();
  });

  it('does not re-init without throw error', async () => {
    db.setConfig({ strict: false });
    await expect(db.start()).resolves.not.toThrow();
  });
});
