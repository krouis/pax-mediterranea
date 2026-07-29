import { describe, expect, it } from 'vitest';
import { classifyTermination, detectEquilibrium, detectRepeatedState } from './equilibrium';

describe('detectRepeatedState', () => {
  it('finds no cycle in a monotonically changing history', () => {
    expect(detectRepeatedState(['a', 'b', 'c', 'd']).detected).toBe(false);
  });

  it('detects a period-1 repeat (identical consecutive states)', () => {
    const result = detectRepeatedState(['a', 'b', 'c', 'c']);
    expect(result).toEqual({ detected: true, period: 1 });
  });

  it('detects a period-2 oscillation', () => {
    const result = detectRepeatedState(['a', 'x', 'y', 'x', 'y']);
    expect(result).toEqual({ detected: true, period: 2 });
  });

  it('requires at least two entries', () => {
    expect(detectRepeatedState(['a']).detected).toBe(false);
    expect(detectRepeatedState([]).detected).toBe(false);
  });
});

describe('detectEquilibrium', () => {
  it('is not detected below the window', () => {
    expect(detectEquilibrium(5, 6).detected).toBe(false);
  });

  it('is detected at or above the window', () => {
    expect(detectEquilibrium(6, 6).detected).toBe(true);
    expect(detectEquilibrium(10, 6).detected).toBe(true);
  });
});

describe('classifyTermination', () => {
  const base = {
    winnerId: undefined,
    scenarioWinner: false,
    maxTurnsReached: false,
    repeatedStateDetected: false,
    equilibriumDetected: false,
    illegalActionOccurred: false,
    simulationError: false,
  };

  it('prioritizes simulation-error and illegal-action over everything else', () => {
    expect(classifyTermination({ ...base, simulationError: true, winnerId: 'p1' })).toBe(
      'simulation-error',
    );
    expect(classifyTermination({ ...base, illegalActionOccurred: true, winnerId: 'p1' })).toBe(
      'illegal-action',
    );
  });

  it('distinguishes scenario victory from generic natural victory', () => {
    expect(classifyTermination({ ...base, winnerId: 'p1', scenarioWinner: true })).toBe(
      'scenario-victory',
    );
    expect(classifyTermination({ ...base, winnerId: 'p1' })).toBe('natural-victory');
  });

  it('reports repeated-state-cycle and stable-frontier before falling back to no-progress', () => {
    expect(classifyTermination({ ...base, repeatedStateDetected: true })).toBe(
      'repeated-state-cycle',
    );
    expect(classifyTermination({ ...base, equilibriumDetected: true })).toBe('stable-frontier');
    expect(classifyTermination({ ...base, maxTurnsReached: true })).toBe('no-progress');
  });
});
