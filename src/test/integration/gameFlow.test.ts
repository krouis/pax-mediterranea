import { describe, expect, it } from 'vitest';
import { runAITurn } from '../../game/ai/ai';
import { activePlayer, applyAction, startActionPhase } from '../../game/engine/rules';
import { createGame } from '../../game/engine/state';
import { deserializeGame, serializeGame } from '../../game/serialization/save';

describe('complete offline turn flow', () => {
  it('moves, recruits, uses flavor systems, saves, and continues after AI', () => {
    let state = startActionPhase(createGame({ seed: 270 }));
    state = applyAction(state, {
      type: 'MOVE',
      playerId: 'p1',
      unitId: 'u1',
      to: 'sicily',
    }).state;
    state = applyAction(state, {
      type: 'RECRUIT',
      playerId: 'p1',
      unitType: 'infantry',
      territoryId: 'carthage',
    }).state;
    state = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardId: 'hannibal-barca',
      unitId: 'u1',
    }).state;
    state = applyAction(state, {
      type: 'INVOKE_FAVOR',
      playerId: 'p1',
      territoryId: 'carthage',
    }).state;
    state = deserializeGame(serializeGame(state)).state;
    state = applyAction(state, { type: 'END_TURN', playerId: 'p1' }).state;
    expect(activePlayer(state).isAI).toBe(true);
    state = runAITurn(state);
    expect(activePlayer(state).id).toBe('p1');
    expect(state.eventLog.length).toBeGreaterThan(4);
  });
});
