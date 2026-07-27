import { describe, expect, it } from 'vitest';
import { nextRandom } from './random';

describe('seeded random generator', () => {
  it('reproduces a sequence and stays in range', () => {
    const first = nextRandom(1234);
    const second = nextRandom(1234);
    expect(first).toEqual(second);
    expect(first[0]).toBeGreaterThanOrEqual(0);
    expect(first[0]).toBeLessThan(1);
  });
});
