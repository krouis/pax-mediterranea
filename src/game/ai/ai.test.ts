import { describe, expect, it } from 'vitest';
import { applyAction, startActionPhase } from '../engine/rules';
import { createGame } from '../engine/state';
import { runAITurn } from './ai';

describe('AI', () => {
  it('completes its turn without illegal state or loops', () => {
    let state = startActionPhase(createGame({ seed: 8 }));
    state = applyAction(state, { type: 'END_TURN', playerId: 'p1' }).state;
    const result = runAITurn(state, 'strategist');
    expect(result.activePlayerIndex).toBe(0);
    expect(
      result.units.every((unit) => result.territories.some(({ id }) => id === unit.territoryId)),
    ).toBe(true);
  });

  it('is deterministic for the same state and difficulty', () => {
    const state = applyAction(startActionPhase(createGame({ seed: 9 })), {
      type: 'END_TURN',
      playerId: 'p1',
    }).state;
    expect(runAITurn(state, 'citizen')).toEqual(runAITurn(state, 'citizen'));
  });
});
