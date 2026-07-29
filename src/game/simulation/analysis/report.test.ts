import { describe, expect, it } from 'vitest';
import { runExperiment, type ExperimentDefinition } from '../experiment-runner';
import { aggregateTelemetry } from './aggregate';
import { buildMatchupMatrix } from './matchup-matrix';
import { generateMdaHypotheses } from './mda';
import { buildCsvReports } from './report-csv';
import { buildJsonReport, serializeJsonReport } from './report-json';
import { buildMarkdownReport } from './report-markdown';
import { compareToBaseline, type BaselineFile, type StructuralInvariants } from './regression';

function smokeDefinition(): ExperimentDefinition {
  return {
    id: 'report-test',
    description: 'report pipeline smoke test',
    maps: ['mediterranean-small'],
    scenarios: [null, 'sicilian-question'],
    seeds: { start: 1, count: 3 },
    maxTurns: 12,
    seatSwaps: true,
    profiles: [
      { personaId: 'aggressor', skillLevel: 'competent' },
      { personaId: 'defender', skillLevel: 'competent' },
      { personaId: 'merchant', skillLevel: 'novice' },
    ],
  };
}

describe('report pipeline', () => {
  it('produces well-formed JSON, CSV, and Markdown reports from a real experiment run', () => {
    const experiment = runExperiment(smokeDefinition());
    const metrics = aggregateTelemetry(experiment.matches);
    const matchupMatrix = buildMatchupMatrix(experiment.matches);
    const mda = generateMdaHypotheses(metrics);

    const structuralInvariants: StructuralInvariants = {
      illegalActionRate: 0,
      simulationErrorRate: 0,
      nonDeterminismDetected: false,
      maxWallClockMsPerMatch: 50,
    };
    const baseline: BaselineFile = {
      schemaVersion: 1,
      gitCommit: 'abc123',
      generatedAt: new Date().toISOString(),
      nodeVersion: process.version,
      experimentId: experiment.definition.id,
      seedRange: experiment.definition.seeds,
      metrics,
      structuralInvariants,
    };
    const comparison = compareToBaseline(baseline, { metrics, structuralInvariants });

    const jsonReport = buildJsonReport({
      definition: experiment.definition,
      matches: experiment.matches,
      wallClockMs: experiment.wallClockMs,
      metrics,
      matchupMatrix,
      mda,
      comparison,
      gitCommit: 'abc123',
    });
    const serialized = serializeJsonReport(jsonReport);
    expect(() => JSON.parse(serialized)).not.toThrow();
    expect(serialized).not.toContain('"NaN"');
    expect(serialized).not.toContain('Infinity');

    const csv = buildCsvReports(experiment.matches, metrics, matchupMatrix);
    expect(csv.matchSummary.split('\n').filter(Boolean).length).toBe(experiment.matches.length + 1);
    for (const table of Object.values(csv)) {
      expect(table).not.toMatch(/NaN|Infinity|undefined/);
    }

    const markdown = buildMarkdownReport({
      definition: experiment.definition,
      matches: experiment.matches,
      metrics,
      matchupMatrix,
      mda,
      comparison,
      wallClockMs: experiment.wallClockMs,
      gitCommit: 'abc123',
    });
    expect(markdown).toContain('# Simulation Report');
    expect(markdown).toContain('## MDA Interpretation');
    expect(markdown).toContain('## Baseline Comparison');
    expect(markdown).toContain('## Limitations');
    expect(markdown).not.toMatch(/NaN|undefined/);
  });

  it('never emits NaN/Infinity even for a single-match, all-zero-variance batch', () => {
    const definition: ExperimentDefinition = {
      id: 'single-match',
      description: 'single match edge case',
      maps: ['mediterranean-small'],
      scenarios: [null],
      seeds: { start: 1, count: 1 },
      maxTurns: 5,
      seatSwaps: false,
      profiles: [
        { personaId: 'opportunist', skillLevel: 'competent' },
        { personaId: 'opportunist', skillLevel: 'competent' },
      ],
    };
    const experiment = runExperiment(definition);
    const metrics = aggregateTelemetry(experiment.matches);
    const matchupMatrix = buildMatchupMatrix(experiment.matches);
    const mda = generateMdaHypotheses(metrics);
    const markdown = buildMarkdownReport({
      definition,
      matches: experiment.matches,
      metrics,
      matchupMatrix,
      mda,
      wallClockMs: experiment.wallClockMs,
    });
    expect(markdown).not.toMatch(/NaN|Infinity/);
    expect(metrics.matchCount).toBe(1);
    expect(metrics.sampleWarning).toBeDefined();
  });
});
