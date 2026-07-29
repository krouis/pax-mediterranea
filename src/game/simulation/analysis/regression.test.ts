import { describe, expect, it } from 'vitest';
import type { AggregateMetrics } from './aggregate';
import {
  compareToBaseline,
  worstSeverity,
  type BaselineFile,
  type StructuralInvariants,
} from './regression';
import { MIN_RELIABLE_SAMPLE } from './distributions';

function fakeMetrics(overrides: Partial<AggregateMetrics> = {}): AggregateMetrics {
  return {
    matchCount: MIN_RELIABLE_SAMPLE,
    completionRate: 0.8,
    naturalCompletionRate: 0.6,
    victoryRateByFaction: { carthage: 0.5, rome: 0.5 },
    victoryRateBySeat: { p1: 0.5, p2: 0.5 },
    victoryRateByPersona: {},
    matchesByPersona: {},
    victoryRateByPatron: {},
    meanTurns: 15,
    medianTurns: 15,
    turnPercentiles: { p10: 5, p25: 10, p50: 15, p75: 20, p90: 25 },
    meanIdleHalfTurnRate: 0.2,
    medianIdleHalfTurnRate: 0.2,
    meanTimeToFirstCombat: 3,
    combatRatePerMatch: 2,
    meanTerritoryChurn: 4,
    meanLeadChanges: 1,
    comebackRate: 0.1,
    terminationRate: { 'natural-victory': 0.6, 'stable-frontier': 0.4 },
    stalemateRate: 0.4,
    repeatedStateRate: 0.05,
    recruitmentMixByType: { infantry: 0.6, cavalry: 0.2, fleet: 0.2 },
    fleetUsageRate: 0.5,
    cardUsageRate: {},
    favorUsageRate: 0.5,
    favorUsageRateByFavor: {},
    unusedCardIds: [],
    unusedFavorIds: [],
    averageCoinsEarned: 10,
    averageCoinsSpent: 8,
    averageCoinsRetained: 2,
    averageFinalPax: 5,
    ...overrides,
  };
}

function fakeInvariants(overrides: Partial<StructuralInvariants> = {}): StructuralInvariants {
  return {
    illegalActionRate: 0,
    simulationErrorRate: 0,
    nonDeterminismDetected: false,
    maxWallClockMsPerMatch: 20,
    ...overrides,
  };
}

function fakeBaseline(
  metrics: AggregateMetrics,
  structuralInvariants: StructuralInvariants,
): BaselineFile {
  return {
    schemaVersion: 1,
    gitCommit: 'base',
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version,
    experimentId: 'test',
    seedRange: { start: 1, count: metrics.matchCount },
    metrics,
    structuralInvariants,
  };
}

describe('compareToBaseline', () => {
  it('passes when current metrics equal the baseline', () => {
    const metrics = fakeMetrics();
    const invariants = fakeInvariants();
    const findings = compareToBaseline(fakeBaseline(metrics, invariants), {
      metrics,
      structuralInvariants: invariants,
    });
    expect(worstSeverity(findings)).toBe('pass');
  });

  it('flags a structural regression for any illegal action or simulation error', () => {
    const metrics = fakeMetrics();
    const baseline = fakeBaseline(metrics, fakeInvariants());
    const illegal = compareToBaseline(baseline, {
      metrics,
      structuralInvariants: fakeInvariants({ illegalActionRate: 0.01 }),
    });
    expect(worstSeverity(illegal)).toBe('structural-regression');

    const errored = compareToBaseline(baseline, {
      metrics,
      structuralInvariants: fakeInvariants({ simulationErrorRate: 0.01 }),
    });
    expect(worstSeverity(errored)).toBe('structural-regression');
  });

  it('flags a structural regression when natural completion drops from meaningful to zero', () => {
    const baseline = fakeBaseline(fakeMetrics({ naturalCompletionRate: 0.5 }), fakeInvariants());
    const findings = compareToBaseline(baseline, {
      metrics: fakeMetrics({ naturalCompletionRate: 0 }),
      structuralInvariants: fakeInvariants(),
    });
    expect(worstSeverity(findings)).toBe('structural-regression');
  });

  it('flags a duration ceiling breach as structural regression', () => {
    const baseline = fakeBaseline(fakeMetrics(), fakeInvariants());
    const findings = compareToBaseline(baseline, {
      metrics: fakeMetrics(),
      structuralInvariants: fakeInvariants({ maxWallClockMsPerMatch: 999_999 }),
    });
    expect(worstSeverity(findings)).toBe('structural-regression');
  });

  it('warns (does not fail) on a 100%/0% seat win rate with an adequate sample', () => {
    const baseline = fakeBaseline(fakeMetrics(), fakeInvariants());
    const findings = compareToBaseline(baseline, {
      metrics: fakeMetrics({ victoryRateBySeat: { p1: 1, p2: 0 } }),
      structuralInvariants: fakeInvariants(),
    });
    expect(worstSeverity(findings)).toBe('warning');
    expect(findings.find((finding) => finding.metric === 'victoryRateBySeat.p1')?.severity).toBe(
      'warning',
    );
  });

  it('reports insufficient-sample instead of a hard failure for a small batch', () => {
    const baseline = fakeBaseline(
      fakeMetrics({ matchCount: MIN_RELIABLE_SAMPLE }),
      fakeInvariants(),
    );
    const findings = compareToBaseline(baseline, {
      metrics: fakeMetrics({ matchCount: 3 }),
      structuralInvariants: fakeInvariants(),
    });
    expect(worstSeverity(findings)).toBe('insufficient-sample');
  });

  it('warns on a large relative shift in a soft metric with an adequate sample', () => {
    const baseline = fakeBaseline(fakeMetrics({ meanTurns: 15 }), fakeInvariants());
    const findings = compareToBaseline(baseline, {
      metrics: fakeMetrics({ meanTurns: 25 }),
      structuralInvariants: fakeInvariants(),
    });
    expect(findings.find((finding) => finding.metric === 'meanTurns')?.severity).toBe('warning');
    expect(worstSeverity(findings)).toBe('warning');
  });
});
