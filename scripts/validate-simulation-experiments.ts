import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveMap, resolveScenarioId } from '../src/game/simulation/config';
import {
  validateExperimentDefinition,
  type ExperimentDefinition,
} from '../src/game/simulation/experiment-runner';

const dir = resolve('simulation/experiments');
const files = readdirSync(dir).filter((file) => file.endsWith('.json'));
const errors: string[] = [];

if (files.length === 0) errors.push('No experiment definitions found in simulation/experiments/.');

for (const file of files) {
  const path = resolve(dir, file);
  let definition: ExperimentDefinition;
  try {
    definition = JSON.parse(readFileSync(path, 'utf8')) as ExperimentDefinition;
  } catch (error) {
    errors.push(`${file}: invalid JSON (${String(error)})`);
    continue;
  }

  for (const issue of validateExperimentDefinition(definition)) errors.push(`${file}: ${issue}`);

  for (const mapId of definition.maps ?? []) {
    try {
      resolveMap(mapId);
    } catch (error) {
      errors.push(`${file}: ${String(error)}`);
    }
  }
  for (const scenarioId of definition.scenarios ?? []) {
    if (scenarioId === null) continue;
    try {
      resolveScenarioId(scenarioId);
    } catch (error) {
      errors.push(`${file}: ${String(error)}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${files.length} simulation experiment definition(s) validated.`);
}
