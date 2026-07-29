import { nextRandom } from '../../engine/random';

/**
 * Bounded, deterministic execution noise for the `novice` skill level. A novice still only ever
 * submits legal actions (candidate generation and `applyAction` validation are unaffected); it
 * simply searches a narrower, seeded subset of the legal candidate space and may settle for a
 * merely-positive option instead of the best one. This models "shorter planning horizon" and
 * "misses combinations", not illegal or nonsensical play.
 */
export interface NoiseState {
  rngState: number;
}

export function createNoiseState(seed: number): NoiseState {
  return { rngState: seed | 0 || 1 };
}

export function nextNoiseValue(noise: NoiseState): number {
  const [value, nextState] = nextRandom(noise.rngState);
  noise.rngState = nextState;
  return value;
}

/** Deterministically sample up to `size` items from `items` using the noise stream. */
export function sampleSubset<T>(items: T[], size: number, noise: NoiseState): T[] {
  if (items.length <= size) return items;
  const pool = [...items];
  const sample: T[] = [];
  while (sample.length < size && pool.length > 0) {
    const index = Math.floor(nextNoiseValue(noise) * pool.length);
    sample.push(pool.splice(index, 1)[0]);
  }
  return sample;
}

/** Weighted-random pick among positive-scoring options, favoring higher scores without always
 * choosing the single best one. */
export function weightedRandomPick<T>(
  scored: Array<{ item: T; score: number }>,
  noise: NoiseState,
): T | undefined {
  const positive = scored.filter((entry) => entry.score > 0);
  if (positive.length === 0) return undefined;
  const minScore = Math.min(...positive.map((entry) => entry.score));
  const shifted = positive.map((entry) => ({ ...entry, weight: entry.score - minScore + 0.01 }));
  const totalWeight = shifted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = nextNoiseValue(noise) * totalWeight;
  for (const entry of shifted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return shifted[shifted.length - 1]?.item;
}
