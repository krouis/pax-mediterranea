import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { aggregateTelemetry } from '../src/game/simulation/analysis/aggregate';
import {
  compareToBaseline,
  worstSeverity,
  type BaselineFile,
} from '../src/game/simulation/analysis/regression';
import {
  runExperiment,
  validateExperimentDefinition,
  type ExperimentDefinition,
} from '../src/game/simulation/experiment-runner';
import { structuralInvariantsFromMatches, writeTextFile } from './simulation-lib';

const usage = `Run an experiment fresh and compare its aggregate metrics against a committed baseline.

Usage:
  npm run simulate:compare -- --baseline <path.json> --experiment <path.json> [--output <path.json>]

Exit code is non-zero only for a structural-regression finding (crash, illegal action,
non-determinism, dropped-to-zero natural completion rate, or pathological duration) — a metric
warning or an insufficient sample does not fail the process, per docs/SIMULATION.md.

Options:
  --baseline <path>     Required. Baseline JSON produced by simulate:baseline.
  --experiment <path>   Required. Experiment definition to re-run and compare.
  --output <path>       Optional. Write the full comparison finding list as JSON here.
  --help                Show this message
`;

const { values } = parseArgs({
  options: {
    baseline: { type: 'string' },
    experiment: { type: 'string' },
    output: { type: 'string' },
    help: { type: 'boolean', default: false },
  },
});

if (values.help || !values.baseline || !values.experiment) {
  console.log(usage);
  process.exit(values.help ? 0 : 1);
}

const baseline = JSON.parse(readFileSync(values.baseline, 'utf8')) as BaselineFile;
const definition = JSON.parse(readFileSync(values.experiment, 'utf8')) as ExperimentDefinition;
const errors = validateExperimentDefinition(definition);
if (errors.length > 0) {
  console.error(`Invalid experiment "${values.experiment}":`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Running "${definition.id}" for baseline comparison...`);
const experiment = runExperiment(definition);
const metrics = aggregateTelemetry(experiment.matches);
const structuralInvariants = structuralInvariantsFromMatches(experiment.matches);
const findings = compareToBaseline(baseline, { metrics, structuralInvariants });
const severity = worstSeverity(findings);

console.log(`\nComparison result: ${severity}\n`);
for (const finding of findings) {
  if (finding.severity === 'pass') continue;
  console.log(`[${finding.severity}] ${finding.metric}: ${finding.message}`);
}

if (values.output) {
  writeTextFile(values.output, JSON.stringify(findings, null, 2) + '\n');
  console.log(`\nFull findings written to ${values.output}`);
}

if (severity === 'structural-regression') {
  console.error('\nStructural regression detected — failing.');
  process.exitCode = 1;
}
