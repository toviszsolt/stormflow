import { uniqueId } from '../../src/utils/hash.js';

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
    expect(id).toBe(id.toLowerCase());
  });

  it('generates 1000 unique ids', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(uniqueId());
    }
    expect(ids.size).toBe(1000);
  });

  it('generates ids efficiently', () => {
    const start = Date.now();
    for (let i = 0; i < 10000; i++) {
      uniqueId();
    }
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500); // 10k ID < 0.5s legyen
  });
});
