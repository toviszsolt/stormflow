const db = require('../stormflow');

db.start({ diskWrite: false });

describe('stormflow', () => {
  afterAll(() => {
    db.setConfig({ strict: true });
  });

  it('does not re-init and throw error', () => {
    expect(() => db.start()).toThrow();
  });

  it('does not re-init without throw error', () => {
    db.setConfig({ strict: false });
    expect(() => db.start()).not.toThrow();
  });
});
