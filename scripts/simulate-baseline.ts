import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import {
  runExperiment,
  validateExperimentDefinition,
  type ExperimentDefinition,
} from '../src/game/simulation/experiment-runner';
import { aggregateTelemetry } from '../src/game/simulation/analysis/aggregate';
import {
  buildAllReports,
  buildBaselineFile,
  getGitCommit,
  writeAllReports,
  writeTextFile,
} from './simulation-lib';

const usage = `Run the committed baseline experiment and write simulation/baselines/current-main.json.

Usage:
  npm run simulate:baseline -- [--experiment <path.json>] [--baseline-out <path.json>] [--reports-out <prefix>]

Options:
  --experiment <path>    Experiment file (default: simulation/experiments/baseline.json)
  --baseline-out <path>  Where to write the baseline JSON (default: simulation/baselines/current-main.json)
  --reports-out <prefix> Also write full JSON/CSV/Markdown reports at this prefix
  --help                 Show this message
`;

const { values } = parseArgs({
  options: {
    experiment: { type: 'string', default: 'simulation/experiments/baseline.json' },
    'baseline-out': { type: 'string', default: 'simulation/baselines/current-main.json' },
    'reports-out': { type: 'string' },
    help: { type: 'boolean', default: false },
  },
});

if (values.help) {
  console.log(usage);
  process.exit(0);
}

const definition = JSON.parse(readFileSync(values.experiment!, 'utf8')) as ExperimentDefinition;
const errors = validateExperimentDefinition(definition);
if (errors.length > 0) {
  console.error(`Invalid experiment "${values.experiment}":`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Running baseline experiment "${definition.id}"...`);
const experiment = runExperiment(definition);
console.log(`Simulated ${experiment.matchCount} matches in ${experiment.wallClockMs}ms.`);

const metrics = aggregateTelemetry(experiment.matches);
const reports = buildAllReports({
  definition: experiment.definition,
  matches: experiment.matches,
  wallClockMs: experiment.wallClockMs,
});

const baseline = buildBaselineFile({
  experimentId: definition.id,
  seedRange: definition.seeds,
  metrics,
  structuralInvariants: reports.structuralInvariants,
  gitCommit: getGitCommit(),
});

writeTextFile(values['baseline-out']!, JSON.stringify(baseline, null, 2) + '\n');
console.log(`Baseline written to ${values['baseline-out']}`);

if (values['reports-out']) {
  writeAllReports(values['reports-out'], reports);
  console.log(`Reports written to ${values['reports-out']}.{json,md,*.csv}`);
}

if (
  reports.structuralInvariants.illegalActionRate > 0 ||
  reports.structuralInvariants.simulationErrorRate > 0
) {
  console.error(
    'Baseline run produced illegal actions or simulation errors — refusing to trust this baseline.',
  );
  process.exitCode = 1;
}
