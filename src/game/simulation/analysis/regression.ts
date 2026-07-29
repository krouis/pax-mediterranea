import { MIN_RELIABLE_SAMPLE } from './distributions';
import type { AggregateMetrics } from './aggregate';

export interface StructuralInvariants {
  illegalActionRate: number;
  simulationErrorRate: number;
  /** Set by the baseline/comparison tooling after re-running a sample of configs twice and
   * checking finalStateHash equality; not computed per-match by default (expensive). */
  nonDeterminismDetected: boolean;
  /** Wall-clock ceiling observed across the batch, in ms per match, for duration regression
   * checks. Wall-clock is a performance diagnostic, not part of gameplay determinism. */
  maxWallClockMsPerMatch: number;
}

export interface BaselineFile {
  schemaVersion: 1;
  gitCommit: string;
  generatedAt: string;
  nodeVersion: string;
  experimentId: string;
  seedRange: { start: number; count: number };
  metrics: AggregateMetrics;
  structuralInvariants: StructuralInvariants;
}

export type ComparisonSeverity =
  'pass' | 'warning' | 'structural-regression' | 'expected-difference' | 'insufficient-sample';

export interface ComparisonFinding {
  metric: string;
  baselineValue: number;
  currentValue: number;
  delta: number;
  severity: ComparisonSeverity;
  message: string;
}

const DURATION_CEILING_MS = 5000;
const WARNING_DELTA = 0.15;

export function compareToBaseline(
  baseline: BaselineFile,
  current: { metrics: AggregateMetrics; structuralInvariants: StructuralInvariants },
): ComparisonFinding[] {
  const findings: ComparisonFinding[] = [];
  const push = (
    metric: string,
    baselineValue: number,
    currentValue: number,
    severity: ComparisonSeverity,
    message: string,
  ) => {
    findings.push({
      metric,
      baselineValue,
      currentValue,
      delta: currentValue - baselineValue,
      severity,
      message,
    });
  };

  if (current.structuralInvariants.illegalActionRate > 0) {
    push(
      'illegalActionRate',
      baseline.structuralInvariants.illegalActionRate,
      current.structuralInvariants.illegalActionRate,
      'structural-regression',
      'At least one match produced an action the engine rejected as illegal; every simulated candidate is expected to already be legal.',
    );
  }
  if (current.structuralInvariants.simulationErrorRate > 0) {
    push(
      'simulationErrorRate',
      baseline.structuralInvariants.simulationErrorRate,
      current.structuralInvariants.simulationErrorRate,
      'structural-regression',
      'At least one match threw during simulation.',
    );
  }
  if (current.structuralInvariants.nonDeterminismDetected) {
    push(
      'nonDeterminismDetected',
      0,
      1,
      'structural-regression',
      'Re-running an identical config produced a different final state hash.',
    );
  }
  if (current.structuralInvariants.maxWallClockMsPerMatch > DURATION_CEILING_MS) {
    push(
      'maxWallClockMsPerMatch',
      baseline.structuralInvariants.maxWallClockMsPerMatch,
      current.structuralInvariants.maxWallClockMsPerMatch,
      'structural-regression',
      `A match took ${current.structuralInvariants.maxWallClockMsPerMatch}ms, exceeding the ${DURATION_CEILING_MS}ms generous ceiling — likely a non-terminating or pathological loop.`,
    );
  }

  const insufficientSample =
    baseline.metrics.matchCount < MIN_RELIABLE_SAMPLE ||
    current.metrics.matchCount < MIN_RELIABLE_SAMPLE;

  if (
    baseline.metrics.naturalCompletionRate > 0.1 &&
    current.metrics.naturalCompletionRate === 0 &&
    !insufficientSample
  ) {
    push(
      'naturalCompletionRate',
      baseline.metrics.naturalCompletionRate,
      current.metrics.naturalCompletionRate,
      'structural-regression',
      'Natural completion rate dropped from a meaningful baseline to zero.',
    );
  }

  for (const seat of ['p1', 'p2'] as const) {
    const value = current.metrics.victoryRateBySeat[seat];
    if (!insufficientSample && (value === 0 || value === 1)) {
      push(
        `victoryRateBySeat.${seat}`,
        baseline.metrics.victoryRateBySeat[seat],
        value,
        'warning',
        `Seat ${seat} won or lost every deterministic match in this sample. This can be a legitimate seat/faction advantage, but is also the signature of an obvious regression — investigate before trusting it either way.`,
      );
    }
  }

  const softMetrics: Array<[string, number, number]> = [
    ['completionRate', baseline.metrics.completionRate, current.metrics.completionRate],
    [
      'naturalCompletionRate',
      baseline.metrics.naturalCompletionRate,
      current.metrics.naturalCompletionRate,
    ],
    ['meanTurns', baseline.metrics.meanTurns, current.metrics.meanTurns],
    [
      'meanIdleHalfTurnRate',
      baseline.metrics.meanIdleHalfTurnRate,
      current.metrics.meanIdleHalfTurnRate,
    ],
    ['stalemateRate', baseline.metrics.stalemateRate, current.metrics.stalemateRate],
    ['comebackRate', baseline.metrics.comebackRate, current.metrics.comebackRate],
    ['fleetUsageRate', baseline.metrics.fleetUsageRate, current.metrics.fleetUsageRate],
    ['favorUsageRate', baseline.metrics.favorUsageRate, current.metrics.favorUsageRate],
  ];
  for (const [metric, baselineValue, currentValue] of softMetrics) {
    if (findings.some((finding) => finding.metric === metric)) continue;
    if (insufficientSample) {
      push(
        metric,
        baselineValue,
        currentValue,
        'insufficient-sample',
        'Sample size too small to compare reliably.',
      );
      continue;
    }
    const reference = Math.max(Math.abs(baselineValue), 0.01);
    const relativeDelta = Math.abs(currentValue - baselineValue) / reference;
    if (relativeDelta >= WARNING_DELTA) {
      push(
        metric,
        baselineValue,
        currentValue,
        'warning',
        `${metric} moved by ${(relativeDelta * 100).toFixed(0)}% relative to baseline (${baselineValue.toFixed(3)} -> ${currentValue.toFixed(3)}). This is a design-relevant shift, not necessarily a bug — review before merging a mechanics change.`,
      );
    } else {
      push(
        metric,
        baselineValue,
        currentValue,
        'pass',
        `${metric} is within the ${WARNING_DELTA * 100}% tolerance.`,
      );
    }
  }

  return findings;
}

export function worstSeverity(findings: ComparisonFinding[]): ComparisonSeverity {
  const order: ComparisonSeverity[] = [
    'structural-regression',
    'warning',
    'insufficient-sample',
    'expected-difference',
    'pass',
  ];
  for (const severity of order) {
    if (findings.some((finding) => finding.severity === severity)) return severity;
  }
  return 'pass';
}
