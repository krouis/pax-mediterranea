import { DEFAULT_EQUILIBRIUM_WINDOW, DEFAULT_MAX_ACTIONS_PER_TURN } from './config';
import { runSimulatedMatch } from './simulator';
import type {
  MatchTelemetry,
  PersonaId,
  PlayerSimulationProfile,
  SimulationConfig,
  SimulationTrace,
  SkillLevel,
} from './types';

export interface ExperimentProfileTemplate {
  personaId: PersonaId;
  skillLevel: SkillLevel;
  patronId?: string;
}

export interface ExperimentDefinition {
  id: string;
  description: string;
  maps: string[];
  /** `null` means "no campaign scenario" (a generic skirmish to the Pax threshold). */
  scenarios: Array<string | null>;
  seeds: { start: number; count: number };
  maxTurns: number;
  maxActionsPerTurn?: number;
  equilibriumWindow?: number;
  /** Every unordered pair of *slots* in this list is run once; when `seatSwaps` is true,
   * non-mirror pairs also run with seats reversed. Two distinct profiles with `seatSwaps: true`
   * reproduces a single fixed matchup run both ways. A same-persona mirror is requested by
   * listing that persona/skill combination twice (two slots, one pair, no swap duplicate); a
   * longer `profiles` list produces a full persona matrix, mirrors included where repeated. */
  profiles: ExperimentProfileTemplate[];
  seatSwaps: boolean;
}

export interface ExperimentMatchRecord {
  matchId: string;
  mapId: string;
  scenarioId?: string;
  seed: number;
  telemetry: MatchTelemetry;
  /** Only populated for outliers (illegal-action/simulation-error terminations), where the
   * match is deterministically re-run once with tracing on so the failure is debuggable. Full
   * traces are otherwise never retained for a whole batch — see docs/SIMULATION.md. */
  outlierTrace?: SimulationTrace;
}

export interface ExperimentRunResult {
  definition: ExperimentDefinition;
  matches: ExperimentMatchRecord[];
  matchCount: number;
  wallClockMs: number;
}

function profileKey(template: ExperimentProfileTemplate): string {
  return `${template.personaId}:${template.skillLevel}${template.patronId ? `:${template.patronId}` : ''}`;
}

function toProfile(
  playerId: 'p1' | 'p2',
  factionId: 'carthage' | 'rome',
  template: ExperimentProfileTemplate,
): PlayerSimulationProfile {
  return {
    playerId,
    factionId,
    personaId: template.personaId,
    skillLevel: template.skillLevel,
    patronId: template.patronId,
  };
}

export function validateExperimentDefinition(definition: ExperimentDefinition): string[] {
  const errors: string[] = [];
  if (!definition.id) errors.push('Experiment is missing an id.');
  if (definition.maps.length === 0) errors.push('Experiment must list at least one map.');
  if (definition.scenarios.length === 0)
    errors.push('Experiment must list at least one scenario (use null for none).');
  if (definition.seeds.count < 1) errors.push('Experiment seeds.count must be at least 1.');
  if (definition.profiles.length < 2)
    errors.push('Experiment needs at least two profiles to form a matchup.');
  if (definition.maxTurns < 1) errors.push('Experiment maxTurns must be at least 1.');
  return errors;
}

/** Expands an experiment definition into the concrete, deterministic list of match
 * configurations it implies — every unordered pair of profile slots, seat-swapped where
 * requested, across every requested map, scenario, and seed. */
export function expandExperiment(definition: ExperimentDefinition): SimulationConfig[] {
  const configs: SimulationConfig[] = [];
  const seeds = Array.from(
    { length: definition.seeds.count },
    (_, index) => definition.seeds.start + index,
  );

  for (const mapId of definition.maps) {
    for (const scenarioId of definition.scenarios) {
      // Strict i<j: every unordered pair of *array slots* is run once. A same-persona mirror
      // is produced by listing that persona twice in `profiles` (two slots, one pair) rather
      // than by auto-pairing every slot with itself — with exactly two distinct profiles this
      // means exactly one matchup, matching the simple single-matchup experiment shape; a
      // longer `profiles` list (optionally repeating an entry to request its mirror) produces
      // the full persona matrix.
      for (let i = 0; i < definition.profiles.length; i += 1) {
        for (let j = i + 1; j < definition.profiles.length; j += 1) {
          const a = definition.profiles[i];
          const b = definition.profiles[j];
          const isContentMirror = profileKey(a) === profileKey(b);
          const orderings: Array<[ExperimentProfileTemplate, ExperimentProfileTemplate]> =
            !isContentMirror && definition.seatSwaps
              ? [
                  [a, b],
                  [b, a],
                ]
              : [[a, b]];

          for (const [carthageTemplate, romeTemplate] of orderings) {
            for (const seed of seeds) {
              configs.push({
                seed,
                mapId,
                scenarioId: scenarioId ?? undefined,
                maxTurns: definition.maxTurns,
                maxActionsPerTurn: definition.maxActionsPerTurn ?? DEFAULT_MAX_ACTIONS_PER_TURN,
                players: [
                  toProfile('p1', 'carthage', carthageTemplate),
                  toProfile('p2', 'rome', romeTemplate),
                ],
                captureTrace: false,
                detectRepeatedStates: true,
                equilibriumWindow: definition.equilibriumWindow ?? DEFAULT_EQUILIBRIUM_WINDOW,
              });
            }
          }
        }
      }
    }
  }
  return configs;
}

function matchId(config: SimulationConfig): string {
  const [p1, p2] = config.players;
  return [
    config.mapId,
    config.scenarioId ?? 'no-scenario',
    profileKey(p1),
    profileKey(p2),
    `seed${config.seed}`,
  ].join('|');
}

export function runExperiment(definition: ExperimentDefinition): ExperimentRunResult {
  const errors = validateExperimentDefinition(definition);
  if (errors.length > 0) {
    throw new Error(
      `Invalid experiment "${definition.id}":\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }

  const configs = expandExperiment(definition);
  const matches: ExperimentMatchRecord[] = [];
  const start = Date.now();

  for (const config of configs) {
    const result = runSimulatedMatch(config);
    const isOutlier =
      result.telemetry.terminationClassification === 'illegal-action' ||
      result.telemetry.terminationClassification === 'simulation-error';

    let outlierTrace: SimulationTrace | undefined;
    if (isOutlier) {
      const traced = runSimulatedMatch({ ...config, captureTrace: true });
      outlierTrace = traced.trace;
    }

    matches.push({
      matchId: matchId(config),
      mapId: config.mapId,
      scenarioId: config.scenarioId,
      seed: config.seed,
      telemetry: result.telemetry,
      outlierTrace,
    });
  }

  return { definition, matches, matchCount: matches.length, wallClockMs: Date.now() - start };
}
