/** Nearest-rank percentile over a numeric sample. Returns 0 for an empty sample. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[rank];
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]): number {
  return percentile(values, 50);
}

export interface PercentileSet {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export function percentileSet(values: number[]): PercentileSet {
  return {
    p10: percentile(values, 10),
    p25: percentile(values, 25),
    p50: percentile(values, 50),
    p75: percentile(values, 75),
    p90: percentile(values, 90),
  };
}

/** Minimum sample size below which rate/percentile statistics are annotated as low-confidence
 * in reports rather than presented as if they were reliable. See docs/SIMULATION-METRICS.md. */
export const MIN_RELIABLE_SAMPLE = 20;
