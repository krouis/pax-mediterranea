import { describe, expect, it } from 'vitest';
import { mean, median, percentile, percentileSet } from './distributions';

describe('distributions', () => {
  it('handles the empty sample without NaN/Infinity', () => {
    expect(mean([])).toBe(0);
    expect(median([])).toBe(0);
    expect(percentile([], 50)).toBe(0);
    expect(percentileSet([])).toEqual({ p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 });
  });

  it('computes mean and median correctly for a simple sample', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(median([1, 2, 3, 4, 5])).toBe(3);
  });

  it('is order-independent', () => {
    const a = [5, 1, 4, 2, 3];
    const b = [1, 2, 3, 4, 5];
    expect(percentileSet(a)).toEqual(percentileSet(b));
  });

  it('percentiles are monotonically non-decreasing', () => {
    const values = Array.from({ length: 37 }, (_, index) => index * 3 + 1);
    const set = percentileSet(values);
    expect(set.p10).toBeLessThanOrEqual(set.p25);
    expect(set.p25).toBeLessThanOrEqual(set.p50);
    expect(set.p50).toBeLessThanOrEqual(set.p75);
    expect(set.p75).toBeLessThanOrEqual(set.p90);
  });

  it('p100-equivalent (p90 of a single value) returns that value', () => {
    expect(percentile([42], 90)).toBe(42);
  });
});
