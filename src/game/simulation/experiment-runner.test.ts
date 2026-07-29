import { describe, expect, it } from 'vitest';
import { aggregateTelemetry } from './analysis/aggregate';
import { generateMdaHypotheses } from './analysis/mda';
import { buildMatchupMatrix } from './analysis/matchup-matrix';
import {
  compareToBaseline,
  type BaselineFile,
  type StructuralInvariants,
} from './analysis/regression';
import {
  expandExperiment,
  runExperiment,
  validateExperimentDefinition,
  type ExperimentDefinition,
} from './experiment-runner';

function smokeDefinition(overrides: Partial<ExperimentDefinition> = {}): ExperimentDefinition {
  return {
    id: 'test-smoke',
    description: 'test experiment',
    maps: ['mediterranean-small'],
    scenarios: [null],
    seeds: { start: 1, count: 4 },
    maxTurns: 15,
    seatSwaps: true,
    profiles: [
      { personaId: 'aggressor', skillLevel: 'competent' },
      { personaId: 'defender', skillLevel: 'competent' },
    ],
    ...overrides,
  };
}

describe('expandExperiment', () => {
  it('produces one seat-swapped pair per seed for a two-profile experiment', () => {
    const configs = expandExperiment(smokeDefinition());
    // 2 orderings (A-vs-B, B-vs-A) x 4 seeds x 1 map x 1 scenario slot.
    expect(configs).toHaveLength(8);
    expect(new Set(configs.map((config) => config.seed)).size).toBe(4);
    const carthagePersonas = new Set(configs.map((config) => config.players[0].personaId));
    expect(carthagePersonas).toEqual(new Set(['aggressor', 'defender']));
  });

  it('does not duplicate a mirror matchup via seat swapping', () => {
    const configs = expandExperiment(
      smokeDefinition({ profiles: [{ personaId: 'opportunist', skillLevel: 'competent' }] }),
    );
    // Only one profile provided is invalid for a real run (validate would reject it), but
    // expansion itself should not crash; use two identical profiles to test the mirror case.
    const mirrorConfigs = expandExperiment(
      smokeDefinition({
        profiles: [
          { personaId: 'opportunist', skillLevel: 'competent' },
          { personaId: 'opportunist', skillLevel: 'competent' },
        ],
      }),
    );
    expect(mirrorConfigs).toHaveLength(4); // 1 ordering x 4 seeds, no swap duplicate
    expect(configs).toHaveLength(0);
  });

  it('respects seatSwaps: false by only running one seat ordering', () => {
    const configs = expandExperiment(smokeDefinition({ seatSwaps: false }));
    expect(configs).toHaveLength(4);
  });
});

describe('validateExperimentDefinition', () => {
  it('rejects an experiment with fewer than two profiles', () => {
    const errors = validateExperimentDefinition(
      smokeDefinition({ profiles: [{ personaId: 'opportunist', skillLevel: 'competent' }] }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts a well-formed experiment', () => {
    expect(validateExperimentDefinition(smokeDefinition())).toEqual([]);
  });
});

describe('runExperiment end to end', () => {
  it('runs every expanded config and returns matching telemetry records', () => {
    const definition = smokeDefinition();
    const result = runExperiment(definition);
    expect(result.matchCount).toBe(expandExperiment(definition).length);
    for (const match of result.matches) {
      expect(match.telemetry.terminationClassification).not.toBe('illegal-action');
      expect(match.telemetry.terminationClassification).not.toBe('simulation-error');
    }
  });

  it('feeds cleanly into aggregation, matchup matrix, MDA, and baseline comparison', () => {
    const result = runExperiment(smokeDefinition({ seeds: { start: 1, count: 6 } }));
    const metrics = aggregateTelemetry(result.matches);
    expect(metrics.matchCount).toBe(result.matches.length);
    expect(metrics.sampleWarning).toBeDefined(); // small batch, below MIN_RELIABLE_SAMPLE
    expect(Number.isFinite(metrics.meanTurns)).toBe(true);
    expect(metrics.turnPercentiles.p50).toBeGreaterThanOrEqual(0);

    const matrix = buildMatchupMatrix(result.matches);
    expect(matrix.length).toBeGreaterThan(0);
    for (const cell of matrix) expect(cell.winsA + cell.winsB + cell.draws).toBe(cell.matches);

    const mdaRows = generateMdaHypotheses(metrics);
    for (const row of mdaRows) {
      expect(row.humanValidationNeeded).toBe(true);
      expect(['low', 'medium', 'high']).toContain(row.confidence);
    }

    const structuralInvariants: StructuralInvariants = {
      illegalActionRate: 0,
      simulationErrorRate: 0,
      nonDeterminismDetected: false,
      maxWallClockMsPerMatch: 50,
    };
    const baseline: BaselineFile = {
      schemaVersion: 1,
      gitCommit: 'test',
      generatedAt: new Date().toISOString(),
      nodeVersion: process.version,
      experimentId: 'test-smoke',
      seedRange: { start: 1, count: 6 },
      metrics,
      structuralInvariants,
    };
    const findings = compareToBaseline(baseline, { metrics, structuralInvariants });
    expect(
      findings.every(
        (finding) => finding.severity === 'pass' || finding.severity === 'insufficient-sample',
      ),
    ).toBe(true);
  });
});
