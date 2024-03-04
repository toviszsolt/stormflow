const { getType } = require('../../utils/type');

describe('getType', () => {
  it('return correct type for different values', () => {
    expect(getType(null)).toBe('null');
    expect(getType([])).toBe('array');
    expect(getType(new Date())).toBe('date');
    expect(getType('hello')).toBe('string');
    expect(getType(123)).toBe('number');
    expect(getType(true)).toBe('boolean');
    expect(getType({})).toBe('object');
    expect(getType(() => {})).toBe('function');
  });
});
