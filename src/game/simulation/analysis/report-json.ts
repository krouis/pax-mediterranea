import type { ExperimentDefinition, ExperimentMatchRecord } from '../experiment-runner';
import type { AggregateMetrics } from './aggregate';
import type { MatchupCell } from './matchup-matrix';
import type { MdaRow } from './mda';
import type { ComparisonFinding } from './regression';

export interface JsonReport {
  schemaVersion: 1;
  experimentId: string;
  description: string;
  generatedAt: string;
  gitCommit?: string;
  nodeVersion: string;
  seedRange: { start: number; count: number };
  matchCount: number;
  wallClockMs: number;
  metrics: AggregateMetrics;
  matchupMatrix: MatchupCell[];
  mda: MdaRow[];
  comparison?: ComparisonFinding[];
}

export interface BuildJsonReportInput {
  definition: ExperimentDefinition;
  matches: ExperimentMatchRecord[];
  wallClockMs: number;
  metrics: AggregateMetrics;
  matchupMatrix: MatchupCell[];
  mda: MdaRow[];
  comparison?: ComparisonFinding[];
  gitCommit?: string;
}

export function buildJsonReport(input: BuildJsonReportInput): JsonReport {
  return {
    schemaVersion: 1,
    experimentId: input.definition.id,
    description: input.definition.description,
    generatedAt: new Date().toISOString(),
    gitCommit: input.gitCommit,
    nodeVersion: process.version,
    seedRange: input.definition.seeds,
    matchCount: input.matches.length,
    wallClockMs: input.wallClockMs,
    metrics: input.metrics,
    matchupMatrix: input.matchupMatrix,
    mda: input.mda,
    comparison: input.comparison,
  };
}

export function serializeJsonReport(report: JsonReport): string {
  return JSON.stringify(report, null, 2);
}
