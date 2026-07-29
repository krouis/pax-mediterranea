import { activePlayer, applyAction, startActionPhase } from '../engine/rules';
import type { GameState } from '../engine/types';
import type { Persona } from './personas/persona';
import type { NoiseState } from './policies/errors';
import { selectAction } from './policies/selection';
import type { ScoringContext } from './policies/scoring';
import { hashState } from './state-hash';
import type { TelemetryRecorder } from './telemetry';
import type { TraceRecorder } from './traces';
import type { PlayerSimulationProfile } from './types';

export interface TurnRunnerResult {
  state: GameState;
  illegalActionOccurred: boolean;
}

/**
 * Runs one player's complete turn: advances through income/draw/recruit via the real
 * `startActionPhase`, then repeatedly asks the persona/skill policy to select and apply one
 * action at a time (through the real `applyAction`) until it selects END_TURN, a forced action
 * budget is hit, or an actually-illegal action is returned (which is always treated as a
 * reportable simulation error — every candidate this layer proposes is expected to be legal).
 */
export function runPlayerTurn(
  state: GameState,
  profile: PlayerSimulationProfile,
  persona: Persona,
  context: ScoringContext,
  telemetry: TelemetryRecorder,
  trace: TraceRecorder,
  noise: NoiseState,
  maxActions: number,
): TurnRunnerResult {
  let current = startActionPhase(state);
  const playerId = profile.playerId;
  let illegalActionOccurred = false;
  const declinedThisTurn = new Set<string>();

  for (let count = 0; count < maxActions; count += 1) {
    if (current.winnerId) break;
    const player = activePlayer(current);
    const selection = selectAction(current, player, persona, profile.skillLevel, context, noise);

    for (const evaluation of selection.allEvaluations) {
      if (evaluation.action.type !== 'ATTACK' || evaluation.totalScore > 0) continue;
      const key = `${evaluation.action.unitId}->${evaluation.action.to}`;
      if (!declinedThisTurn.has(key)) {
        declinedThisTurn.add(key);
        telemetry.recordDeclinedAttack();
      }
    }

    const stateHashBefore = hashState(current);
    const eventLogLengthBefore = current.eventLog.length;
    const result = applyAction(current, selection.evaluation.action);
    telemetry.recordAction(
      playerId,
      selection.evaluation.action,
      result.ok,
      result.error,
      current,
      result.state,
    );

    trace.record({
      turn: current.turn,
      activePlayerId: playerId,
      phase: current.phase,
      action: selection.evaluation.action,
      candidateCount: selection.allEvaluations.length,
      selectedScore: selection.evaluation.totalScore,
      scoreComponents: selection.evaluation.scoreComponents,
      stateHashBefore,
      ok: result.ok,
      error: result.error,
      stateHashAfter: hashState(result.state),
      eventKeys: result.ok
        ? result.state.eventLog.slice(eventLogLengthBefore).map((event) => event.key)
        : [],
    });

    if (!result.ok) {
      illegalActionOccurred = true;
      trace.recordTurnEndReason(`${current.turn}-${playerId}`, `illegal-action:${result.error}`);
      const forced = applyAction(current, { type: 'END_TURN', playerId });
      current = forced.ok ? forced.state : current;
      break;
    }

    telemetry.recordUnitLosses(playerId, current, result.state);
    current = result.state;

    if (selection.candidate.kind === 'end') {
      trace.recordTurnEndReason(`${current.turn}-${playerId}`, 'end-turn-selected');
      break;
    }

    if (count === maxActions - 1) {
      trace.recordTurnEndReason(`${current.turn}-${playerId}`, 'max-actions-forced');
      const forced = applyAction(current, { type: 'END_TURN', playerId });
      if (forced.ok) current = forced.state;
    }
  }

  return { state: current, illegalActionOccurred };
}
