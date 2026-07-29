import { describe, expect, it } from 'vitest';
import { applyAction, startActionPhase } from '../engine/rules';
import { createGame } from '../engine/state';
import { TelemetryRecorder } from './telemetry';
import type { PlayerSimulationProfile } from './types';

const players: PlayerSimulationProfile[] = [
  { playerId: 'p1', factionId: 'carthage', personaId: 'opportunist', skillLevel: 'competent' },
  { playerId: 'p2', factionId: 'rome', personaId: 'opportunist', skillLevel: 'competent' },
];

describe('TelemetryRecorder', () => {
  it('records a successful action by type and player, and tracks coin deltas', () => {
    const recorder = new TelemetryRecorder();
    const before = startActionPhase(createGame({ seed: 1 }));
    const action = { type: 'MOVE' as const, playerId: 'p1', unitId: 'u1', to: 'sardinia' };
    const result = applyAction(before, action);
    recorder.recordAction('p1', action, result.ok, result.error, before, result.state);
    expect(recorder.actionsByType.MOVE).toBe(1);
    expect(recorder.actionsByPlayer.p1.MOVE).toBe(1);
    expect(recorder.rejectedActionsByReason).toEqual({});
  });

  it('records a rejected action under rejectedActionsByReason and not actionsByType', () => {
    const recorder = new TelemetryRecorder();
    const state = startActionPhase(createGame({ seed: 1 }));
    const action = { type: 'MOVE' as const, playerId: 'p1', unitId: 'u1', to: 'latium' };
    const result = applyAction(state, action);
    expect(result.ok).toBe(false);
    recorder.recordAction('p1', action, result.ok, result.error, state, result.state);
    expect(recorder.actionsByType.MOVE).toBeUndefined();
    expect(recorder.rejectedActionsByReason[result.error!]).toBe(1);
  });

  it('recordHalfTurn tracks idle streaks and their maximum', () => {
    const recorder = new TelemetryRecorder();
    recorder.recordHalfTurn(true);
    recorder.recordHalfTurn(false);
    recorder.recordHalfTurn(false);
    recorder.recordHalfTurn(true);
    recorder.recordHalfTurn(false);
    expect(recorder.halfTurns).toBe(5);
    expect(recorder.idleHalfTurns).toBe(3);
    expect(recorder.maxConsecutiveIdleHalfTurns).toBe(2);
    expect(recorder.currentIdleStreak).toBe(1);
  });

  it('recordUnitLosses attributes a lost unit to its owner and type', () => {
    const recorder = new TelemetryRecorder();
    const before = startActionPhase(createGame({ seed: 1 }));
    const defeat = { ...before, units: before.units.filter((unit) => unit.id !== 'u1') };
    recorder.recordUnitLosses('p1', before, defeat);
    expect(recorder.unitsLostByPlayerAndType.p1.infantry).toBe(1);
  });

  it('finalize produces a coherent MatchTelemetry with the recorded counters and no NaN rates', () => {
    const recorder = new TelemetryRecorder();
    recorder.recordHalfTurn(true);
    recorder.recordHalfTurn(false);
    const state = startActionPhase(createGame({ seed: 1 }));
    const telemetry = recorder.finalize(
      { seed: 1, mapId: 'mediterranean-small', players, maxTurns: 30 },
      state,
      'deadbeef',
      {
        classification: 'no-progress',
        repeatedStateDetected: false,
        equilibriumDetected: false,
      },
    );
    expect(telemetry.halfTurns).toBe(2);
    expect(telemetry.idleHalfTurnRate).toBe(0.5);
    expect(Number.isFinite(telemetry.idleHalfTurnRate)).toBe(true);
    expect(telemetry.stateHashAtEnd).toBe('deadbeef');
    expect(telemetry.completedNaturally).toBe(false);
  });

  it('finalize reports a zero idle rate without dividing by zero when no half-turns were recorded', () => {
    const recorder = new TelemetryRecorder();
    const state = startActionPhase(createGame({ seed: 1 }));
    const telemetry = recorder.finalize(
      { seed: 1, mapId: 'mediterranean-small', players, maxTurns: 30 },
      state,
      'deadbeef',
      { classification: 'no-progress', repeatedStateDetected: false, equilibriumDetected: false },
    );
    expect(telemetry.idleHalfTurnRate).toBe(0);
  });
});
