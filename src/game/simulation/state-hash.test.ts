import { describe, expect, it } from 'vitest';
import { applyAction, startActionPhase } from '../engine/rules';
import { createGame } from '../engine/state';
import { hashState } from './state-hash';

describe('state hashing', () => {
  it('produces identical hashes for independently constructed but equivalent states', () => {
    const a = createGame({ seed: 7 });
    const b = createGame({ seed: 7 });
    expect(hashState(a)).toBe(hashState(b));
  });

  it('is insensitive to player array order and object identity', () => {
    const state = createGame({ seed: 7 });
    const reordered = { ...state, players: [...state.players].reverse() };
    expect(hashState(state)).toBe(hashState(reordered));
  });

  it('changes when gameplay-relevant state changes', () => {
    const before = startActionPhase(createGame({ seed: 7 }));
    const after = applyAction(before, {
      type: 'MOVE',
      playerId: 'p1',
      unitId: 'u1',
      to: 'sardinia',
    }).state;
    expect(hashState(before)).not.toBe(hashState(after));
  });

  it('ignores the eventLog so a frozen board hashes identically turn to turn', () => {
    const state = createGame({ seed: 7 });
    const withExtraEvents = {
      ...state,
      eventLog: [...state.eventLog, { turn: 99, key: 'game:events.income', values: { count: 3 } }],
    };
    expect(hashState(state)).toBe(hashState(withExtraEvents));
  });

  it('ignores the synthetic id field', () => {
    const state = createGame({ seed: 7 });
    expect(hashState({ ...state, id: 'something-else' })).toBe(hashState(state));
  });
});
