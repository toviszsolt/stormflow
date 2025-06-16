import { getType } from '../../src/utils/type.js';

describe('getType', () => {
  it('returns correct type for values', () => {
    expect(getType(null)).toBe('null');
    expect(getType([])).toBe('array');
    expect(getType(new Date())).toBe('date');
    expect(getType('hello')).toBe('string');
    expect(getType(123)).toBe('number');
    expect(getType(true)).toBe('boolean');
    expect(getType({})).toBe('object');
    expect(getType(() => {})).toBe('function');
    expect(getType(undefined)).toBe('undefined');
    expect(getType(NaN)).toBe('number');
    expect(getType(Symbol('sym'))).toBe('symbol');
  });
});
