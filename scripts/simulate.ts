import { parseArgs } from 'node:util';
import {
  DEFAULT_EQUILIBRIUM_WINDOW,
  DEFAULT_MAX_ACTIONS_PER_TURN,
  DEFAULT_MAX_TURNS,
} from '../src/game/simulation/config';
import { runSimulatedMatch } from '../src/game/simulation/simulator';
import type {
  FactionId,
  PersonaId,
  PlayerSimulationProfile,
  SkillLevel,
} from '../src/game/simulation/types';
import { buildAllReports, writeAllReports } from './simulation-lib';

const usage = `Run one deterministic simulated match against the production game engine.

Usage:
  npm run simulate -- --p1 <faction:persona:skill[:patron]> --p2 <faction:persona:skill[:patron]> [options]

Options:
  --map <id>          Map id (default: mediterranean-small)
  --scenario <id>      Campaign scenario id (default: none, generic Pax victory)
  --seed <n>            Seed (default: 1)
  --max-turns <n>       Turn cap (default: ${DEFAULT_MAX_TURNS})
  --p1 <spec>           Required. e.g. carthage:aggressor:competent
  --p2 <spec>           Required. e.g. rome:defender:expert
  --trace               Capture a full per-action trace
  --output <prefix>     Write .json/.md/.csv reports to this path prefix
  --help                Show this message

Persona ids: objective-rusher, expansionist, aggressor, defender, merchant, naval-strategist, opportunist, explorer
Skill levels: novice, competent, expert
`;

function parsePlayerSpec(spec: string, playerId: 'p1' | 'p2'): PlayerSimulationProfile {
  const [factionId, personaId, skillLevel, patronId] = spec.split(':');
  if (!factionId || !personaId || !skillLevel) {
    throw new Error(`Invalid player spec "${spec}" — expected faction:persona:skill[:patron]`);
  }
  return {
    playerId,
    factionId: factionId as FactionId,
    personaId: personaId as PersonaId,
    skillLevel: skillLevel as SkillLevel,
    patronId,
  };
}

const { values } = parseArgs({
  options: {
    map: { type: 'string', default: 'mediterranean-small' },
    scenario: { type: 'string' },
    seed: { type: 'string', default: '1' },
    'max-turns': { type: 'string', default: String(DEFAULT_MAX_TURNS) },
    p1: { type: 'string' },
    p2: { type: 'string' },
    trace: { type: 'boolean', default: false },
    output: { type: 'string' },
    help: { type: 'boolean', default: false },
  },
});

if (values.help || !values.p1 || !values.p2) {
  console.log(usage);
  process.exit(values.help ? 0 : 1);
}

const players: [PlayerSimulationProfile, PlayerSimulationProfile] = [
  parsePlayerSpec(values.p1, 'p1'),
  parsePlayerSpec(values.p2, 'p2'),
];

const config = {
  seed: Number(values.seed),
  mapId: values.map!,
  scenarioId: values.scenario,
  maxTurns: Number(values['max-turns']),
  maxActionsPerTurn: DEFAULT_MAX_ACTIONS_PER_TURN,
  players,
  captureTrace: values.trace ?? false,
  detectRepeatedStates: true,
  equilibriumWindow: DEFAULT_EQUILIBRIUM_WINDOW,
};

const start = Date.now();
const result = runSimulatedMatch(config);
const wallClockMs = Date.now() - start;

console.log(JSON.stringify(result.telemetry, null, 2));
if (result.trace) console.log(`\nTrace entries captured: ${result.trace.entries.length}`);

if (values.output) {
  const definition = {
    id: 'ad-hoc-single-match',
    description: `Ad hoc single match: ${values.p1} vs ${values.p2}`,
    maps: [config.mapId],
    scenarios: [config.scenarioId ?? null],
    seeds: { start: config.seed, count: 1 },
    maxTurns: config.maxTurns,
    seatSwaps: false,
    profiles: [],
  };
  const matches = [
    {
      matchId: `${config.mapId}|${config.scenarioId ?? 'no-scenario'}|seed${config.seed}`,
      mapId: config.mapId,
      scenarioId: config.scenarioId,
      seed: config.seed,
      telemetry: result.telemetry,
    },
  ];
  const reports = buildAllReports({ definition, matches, wallClockMs });
  writeAllReports(values.output, reports);
  console.log(`\nReports written to ${values.output}.{json,md,*.csv}`);
}
