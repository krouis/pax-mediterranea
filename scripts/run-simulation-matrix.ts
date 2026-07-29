import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import {
  runExperiment,
  validateExperimentDefinition,
  type ExperimentDefinition,
} from '../src/game/simulation/experiment-runner';
import { buildAllReports, printComparisonSummary, writeAllReports } from './simulation-lib';
import type { BaselineFile } from '../src/game/simulation/analysis/regression';

const usage = `Run a data-driven simulation experiment and write JSON/CSV/Markdown reports.

Usage:
  npm run simulate:matrix -- --experiment <path.json> --output <path-prefix> [--baseline <path.json>]

Options:
  --experiment <path>   Required. Path to an ExperimentDefinition JSON file.
  --output <prefix>      Required. Reports are written to <prefix>.json/.md/.*.csv
  --baseline <path>      Optional baseline JSON to compare against.
  --help                 Show this message
`;

const { values } = parseArgs({
  options: {
    experiment: { type: 'string' },
    output: { type: 'string' },
    baseline: { type: 'string' },
    help: { type: 'boolean', default: false },
  },
});

if (values.help || !values.experiment || !values.output) {
  console.log(usage);
  process.exit(values.help ? 0 : 1);
}

const definition = JSON.parse(readFileSync(values.experiment, 'utf8')) as ExperimentDefinition;
const errors = validateExperimentDefinition(definition);
if (errors.length > 0) {
  console.error(`Invalid experiment "${values.experiment}":`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Running experiment "${definition.id}" (${definition.description})...`);
const experiment = runExperiment(definition);
console.log(
  `Simulated ${experiment.matchCount} matches in ${experiment.wallClockMs}ms ` +
    `(${(experiment.matchCount / Math.max(0.001, experiment.wallClockMs / 1000)).toFixed(1)} matches/sec).`,
);

const baseline: BaselineFile | undefined = values.baseline
  ? (JSON.parse(readFileSync(values.baseline, 'utf8')) as BaselineFile)
  : undefined;

const reports = buildAllReports({
  definition: experiment.definition,
  matches: experiment.matches,
  wallClockMs: experiment.wallClockMs,
  baseline,
});
writeAllReports(values.output, reports);
console.log(`Reports written to ${values.output}.{json,md,*.csv}`);
printComparisonSummary(reports.comparison);

const illegal = reports.structuralInvariants.illegalActionRate > 0;
const errored = reports.structuralInvariants.simulationErrorRate > 0;
if (illegal || errored) {
  console.error(
    'Structural failure: at least one match produced an illegal action or simulation error.',
  );
  process.exitCode = 1;
}
