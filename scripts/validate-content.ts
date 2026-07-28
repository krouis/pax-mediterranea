import { quickMap, scenarios } from '../src/content/gameContent';

const target = process.argv[2];
const errors: string[] = [];

if (!target || target === 'maps') {
  const ids = new Set(quickMap.map(({ id }) => id));
  if (ids.size !== quickMap.length) errors.push('Map contains duplicate territory IDs.');
  for (const territory of quickMap) {
    for (const connection of territory.connections) {
      const other = quickMap.find(({ id }) => id === connection);
      if (!other) errors.push(`${territory.id} connects to missing ${connection}.`);
      else if (!other.connections.includes(territory.id))
        errors.push(`${territory.id} -> ${connection} is not reciprocal.`);
    }
  }
}

if (!target || target === 'scenarios') {
  const territoryIds = new Set(quickMap.map(({ id }) => id));
  for (const scenario of scenarios) {
    if (!scenario.id || !scenario.titleKey || !scenario.objectiveKey)
      errors.push('Invalid scenario.');
    const { objective } = scenario;
    if (!objective || objective.type !== 'controlAtTurn')
      errors.push(`${scenario.id} is missing a resolvable objective.`);
    else {
      if (!territoryIds.has(objective.territoryId))
        errors.push(`${scenario.id} objective references unknown territory ${objective.territoryId}.`);
      if (!Number.isInteger(objective.turn) || objective.turn < 1)
        errors.push(`${scenario.id} objective turn must be a positive integer.`);
      if (objective.factionId !== 'carthage' && objective.factionId !== 'rome')
        errors.push(`${scenario.id} objective references an unknown faction.`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${target ?? 'Content'} validation passed.`);
}
