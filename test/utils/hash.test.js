const { uniqueId } = require('../../src/utils/hash');

describe('uniqueId', () => {
  it('generate a unique id', () => {
    const id1 = uniqueId();
    const id2 = uniqueId();
    expect(id1).not.toBe(id2);
  });

  it('generated id has the correct format', () => {
    const id = uniqueId();
    const regex = /^[0-9a-f]{12}$/;
    expect(id).toMatch(regex);
  });
});
