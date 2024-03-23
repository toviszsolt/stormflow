const db = require('../src/stormflow');

db.start({ diskWrite: false });

beforeEach(() => {
  db.setConfig({ strict: true });
});

describe('stormflow', () => {
  it('does not re-init and throw error', () => {
    expect(() => db.start()).toThrow();
  });

  it('does not re-init without throw error', () => {
    db.setConfig({ strict: false });
    expect(() => db.start()).not.toThrow();
  });
});
