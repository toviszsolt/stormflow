const db = require('../stormflow');

db.start({ diskWrite: false });

describe('stormflow', () => {
  it('should not re-init and throw error', () => {
    expect(() => db.start()).toThrow();
  });

  it('should not re-init without throw error', () => {
    db.setConfig({ strict: false });
    expect(() => db.start()).not.toThrow();
    db.setConfig({ strict: true });
  });
});
