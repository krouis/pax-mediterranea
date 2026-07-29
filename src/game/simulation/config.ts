import { quickMap, scenarios } from '../../content/gameContent';
import type { Territory } from '../engine/types';
import type { PersonaId, SimulationConfig, SkillLevel } from './types';

/**
 * Stable map identifiers for the simulation layer. The production app only ships one map
 * today (`quickMap`); this registry exists so simulation configuration, experiments, and
 * reports never depend on translated names or file paths, and so a second map can be added
 * later without changing any experiment/baseline schema.
 */
export const mapRegistry: Record<string, Territory[]> = {
  'mediterranean-small': quickMap,
};

export const personaIds: PersonaId[] = [
  'objective-rusher',
  'expansionist',
  'aggressor',
  'defender',
  'merchant',
  'naval-strategist',
  'opportunist',
  'explorer',
];

export const skillLevels: SkillLevel[] = ['novice', 'competent', 'expert'];

export function resolveMap(mapId: string): Territory[] {
  const map = mapRegistry[mapId];
  if (!map) {
    throw new Error(
      `Unknown simulation mapId "${mapId}". Known maps: ${Object.keys(mapRegistry).join(', ')}`,
    );
  }
  return map;
}

export function resolveScenarioId(scenarioId: string | undefined): string | undefined {
  if (!scenarioId) return undefined;
  const scenario = scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) {
    throw new Error(
      `Unknown simulation scenarioId "${scenarioId}". Known scenarios: ${scenarios.map((s) => s.id).join(', ')}`,
    );
  }
  return scenario.id;
}

export const DEFAULT_MAX_TURNS = 30;
export const DEFAULT_MAX_ACTIONS_PER_TURN = 24;
export const DEFAULT_EQUILIBRIUM_WINDOW = 6;

export function validateSimulationConfig(config: SimulationConfig): string[] {
  const errors: string[] = [];
  resolveMap(config.mapId);
  if (config.scenarioId) resolveScenarioId(config.scenarioId);
  if (config.maxTurns < 1) errors.push('maxTurns must be at least 1.');
  if (config.equilibriumWindow < 2) errors.push('equilibriumWindow must be at least 2 half-turns.');
  if (config.players.length !== 2) errors.push('Exactly two player profiles are required.');
  const [p1, p2] = config.players;
  if (p1 && p2 && p1.factionId === p2.factionId) errors.push('Player factions must differ.');
  for (const profile of config.players) {
    if (!personaIds.includes(profile.personaId))
      errors.push(`Unknown personaId "${profile.personaId}".`);
    if (!skillLevels.includes(profile.skillLevel))
      errors.push(`Unknown skillLevel "${profile.skillLevel}".`);
  }
  return errors;
}

export function withDefaults(
  config: Partial<SimulationConfig> & Pick<SimulationConfig, 'players'>,
): SimulationConfig {
  return {
    seed: config.seed ?? 1,
    mapId: config.mapId ?? 'mediterranean-small',
    scenarioId: config.scenarioId,
    maxTurns: config.maxTurns ?? DEFAULT_MAX_TURNS,
    maxActionsPerTurn: config.maxActionsPerTurn ?? DEFAULT_MAX_ACTIONS_PER_TURN,
    players: config.players,
    captureTrace: config.captureTrace ?? false,
    detectRepeatedStates: config.detectRepeatedStates ?? true,
    equilibriumWindow: config.equilibriumWindow ?? DEFAULT_EQUILIBRIUM_WINDOW,
  };
}
