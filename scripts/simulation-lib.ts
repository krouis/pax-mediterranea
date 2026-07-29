import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { aggregateTelemetry } from '../src/game/simulation/analysis/aggregate';
import { buildMatchupMatrix } from '../src/game/simulation/analysis/matchup-matrix';
import { generateMdaHypotheses } from '../src/game/simulation/analysis/mda';
import { buildCsvReports } from '../src/game/simulation/analysis/report-csv';
import { buildJsonReport, serializeJsonReport } from '../src/game/simulation/analysis/report-json';
import { buildMarkdownReport } from '../src/game/simulation/analysis/report-markdown';
import {
  compareToBaseline,
  worstSeverity,
  type BaselineFile,
  type StructuralInvariants,
} from '../src/game/simulation/analysis/regression';
import type {
  ExperimentDefinition,
  ExperimentMatchRecord,
} from '../src/game/simulation/experiment-runner';

export function getGitCommit(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

export function writeTextFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

export function structuralInvariantsFromMatches(
  matches: ExperimentMatchRecord[],
  nonDeterminismDetected = false,
): StructuralInvariants {
  const illegal = matches.filter(
    (match) => match.telemetry.terminationClassification === 'illegal-action',
  );
  const errors = matches.filter(
    (match) => match.telemetry.terminationClassification === 'simulation-error',
  );
  const maxWallClockMsPerMatch = matches.reduce(
    (max, match) => Math.max(max, match.telemetry.wallClockMs),
    0,
  );
  return {
    illegalActionRate: matches.length === 0 ? 0 : illegal.length / matches.length,
    simulationErrorRate: matches.length === 0 ? 0 : errors.length / matches.length,
    nonDeterminismDetected,
    maxWallClockMsPerMatch,
  };
}

export interface BuildAllReportsInput {
  definition: ExperimentDefinition;
  matches: ExperimentMatchRecord[];
  wallClockMs: number;
  baseline?: BaselineFile;
}

export function buildAllReports(input: BuildAllReportsInput) {
  const metrics = aggregateTelemetry(input.matches);
  const matchupMatrix = buildMatchupMatrix(input.matches);
  const mda = generateMdaHypotheses(metrics);
  const gitCommit = getGitCommit();
  const structuralInvariants = structuralInvariantsFromMatches(input.matches);
  const comparison = input.baseline
    ? compareToBaseline(input.baseline, { metrics, structuralInvariants })
    : undefined;

  const json = buildJsonReport({
    definition: input.definition,
    matches: input.matches,
    wallClockMs: input.wallClockMs,
    metrics,
    matchupMatrix,
    mda,
    comparison,
    gitCommit,
  });
  const markdown = buildMarkdownReport({
    definition: input.definition,
    matches: input.matches,
    metrics,
    matchupMatrix,
    mda,
    comparison,
    wallClockMs: input.wallClockMs,
    gitCommit,
  });
  const csv = buildCsvReports(input.matches, metrics, matchupMatrix);

  return {
    metrics,
    matchupMatrix,
    mda,
    comparison,
    structuralInvariants,
    gitCommit,
    json,
    markdown,
    csv,
  };
}

export function writeAllReports(
  outputPrefix: string,
  reports: ReturnType<typeof buildAllReports>,
): void {
  writeTextFile(`${outputPrefix}.json`, serializeJsonReport(reports.json));
  writeTextFile(`${outputPrefix}.md`, reports.markdown);
  writeTextFile(`${outputPrefix}.match-summary.csv`, reports.csv.matchSummary);
  writeTextFile(`${outputPrefix}.matchup-matrix.csv`, reports.csv.matchupMatrix);
  writeTextFile(`${outputPrefix}.faction-win-rate.csv`, reports.csv.factionWinRate);
  writeTextFile(`${outputPrefix}.action-usage.csv`, reports.csv.actionUsage);
  writeTextFile(`${outputPrefix}.content-usage.csv`, reports.csv.contentUsage);
}

export function buildBaselineFile(input: {
  experimentId: string;
  seedRange: { start: number; count: number };
  metrics: ReturnType<typeof aggregateTelemetry>;
  structuralInvariants: StructuralInvariants;
  gitCommit: string;
}): BaselineFile {
  return {
    schemaVersion: 1,
    gitCommit: input.gitCommit,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version,
    experimentId: input.experimentId,
    seedRange: input.seedRange,
    metrics: input.metrics,
    structuralInvariants: input.structuralInvariants,
  };
}

export function printComparisonSummary(
  comparisonInput: ReturnType<typeof buildAllReports>['comparison'],
): void {
  if (!comparisonInput) {
    console.log('No baseline comparison was run.');
    return;
  }
  const severity = worstSeverity(comparisonInput);
  console.log(`Baseline comparison result: ${severity}`);
  for (const finding of comparisonInput) {
    if (finding.severity === 'pass') continue;
    console.log(`  [${finding.severity}] ${finding.metric}: ${finding.message}`);
  }
}
