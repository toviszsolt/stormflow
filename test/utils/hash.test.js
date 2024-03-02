const { uniqueId } = require('../../utils/hash');

describe('uniqueId', () => {
  it('generates a unique id', () => {
    const id1 = uniqueId();
    const id2 = uniqueId();
    expect(id1).not.toBe(id2);
  });

  it('generated id has the correct format', () => {
    const id = uniqueId();
    const regex = /^[0-9a-f]{7,8}$/;
    expect(id).toMatch(regex);
  });
});
