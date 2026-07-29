import { validateSimulationConfig } from './config';
import { executeMatch } from './match-runner';
import type { SimulationConfig, SimulationResult } from './types';

/**
 * Public entry point for running one deterministic, headless match against the production
 * game engine. Validates the configuration (map/scenario ids, persona/skill ids, faction
 * distinctness, player-id convention) before executing, so malformed experiment/CLI input fails
 * fast with a clear message rather than deep inside the engine.
 */
export function runSimulatedMatch(config: SimulationConfig): SimulationResult {
  const errors = validateSimulationConfig(config);
  if (errors.length > 0) {
    throw new Error(
      `Invalid simulation config:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
  return executeMatch(config);
}
