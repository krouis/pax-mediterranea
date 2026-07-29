import { activePlayer, startActionPhase } from '../engine/rules';
import { createGame } from '../engine/state';
import type { GameState } from '../engine/types';
import { DEFAULT_MAX_ACTIONS_PER_TURN, resolveScenarioId } from './config';
import { scenarios } from '../../content/gameContent';
import { classifyTermination, detectEquilibrium, detectRepeatedState } from './equilibrium';
import { getPersona } from './personas/registry';
import { createNoiseState, type NoiseState } from './policies/errors';
import { buildScoringContext } from './policies/scoring';
import { hashState, hashStrategicState } from './state-hash';
import { TelemetryRecorder } from './telemetry';
import { TraceRecorder } from './traces';
import { runPlayerTurn } from './turn-runner';
import type {
  MatchTelemetry,
  PlayerSimulationProfile,
  SimulationConfig,
  SimulationResult,
  SimulationTrace,
  TerminationClassification,
  VictoryReason,
} from './types';

function seedNoise(seed: number, salt: number): NoiseState {
  // Simple deterministic mixing so both players get independent, reproducible noise streams
  // from a single simulation seed without ever touching GameState.rngState.
  return createNoiseState((seed ^ (salt * 0x9e3779b9)) | 0 || salt);
}

function victoryReasonFor(
  state: GameState,
  scenarioId: string | undefined,
): VictoryReason | undefined {
  if (!state.winnerId) return undefined;
  if (!scenarioId) return 'pax-threshold';
  const scenario = scenarios.find((candidate) => candidate.id === scenarioId);
  const objective = scenario?.objective;
  if (objective?.type === 'controlAtTurn') {
    const objectivePlayer = state.players.find((player) => player.faction === objective.factionId);
    const territory = state.territories.find((candidate) => candidate.id === objective.territoryId);
    const held = objectivePlayer && territory?.ownerId === objectivePlayer.id;
    return held ? 'scenario-objective-held' : 'scenario-objective-lost';
  }
  return 'pax-threshold';
}

/** Internal executor. Use `runSimulatedMatch` from `./simulator` (which validates the config
 * first) as the public entry point. */
export function executeMatch(config: SimulationConfig): SimulationResult {
  const scenarioId = resolveScenarioId(config.scenarioId);
  const [p1Profile, p2Profile] = config.players;
  if (p1Profile.playerId !== 'p1' || p2Profile.playerId !== 'p2') {
    throw new Error(
      'PlayerSimulationProfile.playerId must be "p1" for players[0] and "p2" for players[1] — these are the production engine\'s own player ids, reused rather than re-invented.',
    );
  }

  let state = createGame({
    faction: p1Profile.factionId,
    patron: p1Profile.patronId,
    playerName: p1Profile.playerId,
    secondPlayerName: p2Profile.playerId,
    secondPlayerAI: true,
    seed: config.seed,
    scenarioId,
  });
  if (p2Profile.patronId) state.players[1].patron = p2Profile.patronId;
  state = startActionPhase(state);

  const telemetry = new TelemetryRecorder();
  const trace = new TraceRecorder(config.captureTrace);
  const scoringContext = buildScoringContext(state);
  const maxActions = config.maxActionsPerTurn ?? DEFAULT_MAX_ACTIONS_PER_TURN;

  const profileByPlayer: Record<string, PlayerSimulationProfile> = {
    p1: p1Profile,
    p2: p2Profile,
  };
  const noiseByPlayer: Record<string, NoiseState> = {
    p1: seedNoise(config.seed, 1),
    p2: seedNoise(config.seed, 2),
  };

  telemetry.recordTurnSnapshot(state);
  const materialHashHistory = [hashStrategicState(state)];

  let illegalActionOccurred = false;
  let simulationError = false;
  let repeatedInfo: { detected: boolean; period?: number } = { detected: false };
  let equilibriumDetected = false;
  let equilibriumTurn: number | undefined;

  try {
    for (let guard = 0; guard < config.maxTurns * 2 + 4; guard += 1) {
      if (state.winnerId) break;
      if (state.turn > config.maxTurns) break;

      const playerId = activePlayer(state).id;
      const profile = profileByPlayer[playerId];
      const persona = getPersona(profile.personaId);
      const noise = noiseByPlayer[playerId];
      const before = hashStrategicState(state);

      const result = runPlayerTurn(
        state,
        profile,
        persona,
        scoringContext,
        telemetry,
        trace,
        noise,
        maxActions,
      );
      if (result.illegalActionOccurred) illegalActionOccurred = true;
      state = result.state;

      const after = hashStrategicState(state);
      telemetry.recordHalfTurn(before !== after);
      materialHashHistory.push(after);

      if (config.detectRepeatedStates) repeatedInfo = detectRepeatedState(materialHashHistory);
      const equilibrium = detectEquilibrium(telemetry.currentIdleStreak, config.equilibriumWindow);
      if (equilibrium.detected && !equilibriumDetected) {
        equilibriumDetected = true;
        equilibriumTurn = state.turn;
      }

      if (activePlayer(state).id === 'p1' || state.winnerId) telemetry.recordTurnSnapshot(state);

      if (illegalActionOccurred) break;
      if (repeatedInfo.detected) break;
      if (equilibriumDetected) break;
    }
  } catch {
    simulationError = true;
  }

  const finalStateHash = hashState(state);
  const classification: TerminationClassification = classifyTermination({
    winnerId: state.winnerId,
    scenarioWinner: Boolean(scenarioId),
    maxTurnsReached: state.turn >= config.maxTurns,
    repeatedStateDetected: repeatedInfo.detected,
    equilibriumDetected,
    illegalActionOccurred,
    simulationError,
  });

  const telemetryResult: MatchTelemetry = telemetry.finalize(
    {
      seed: config.seed,
      mapId: config.mapId,
      scenarioId,
      players: config.players,
      maxTurns: config.maxTurns,
    },
    state,
    finalStateHash,
    {
      classification,
      winnerId: state.winnerId,
      victoryReason: victoryReasonFor(state, scenarioId),
      repeatedStateDetected: repeatedInfo.detected,
      repeatedStatePeriod: repeatedInfo.period,
      equilibriumDetected,
      equilibriumTurn,
    },
  );

  const finalTrace: SimulationTrace | undefined = trace.finalize();

  return {
    config,
    telemetry: telemetryResult,
    trace: finalTrace,
    finalStateHash,
    finalState: state,
  };
}
