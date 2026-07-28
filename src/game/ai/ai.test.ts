import { describe, expect, it } from 'vitest';
import { activePlayer, applyAction, legalDestinations, startActionPhase } from '../engine/rules';
import { createGame } from '../engine/state';
import type { GameState } from '../engine/types';
import { chooseAIAction, runAITurn } from './ai';

function endHumanTurn(state: GameState): GameState {
  return applyAction(state, { type: 'END_TURN', playerId: 'p1' }).state;
}

describe('AI', () => {
  it('completes its turn without illegal state or loops', () => {
    let state = startActionPhase(createGame({ seed: 8 }));
    state = endHumanTurn(state);
    const result = runAITurn(state, 'strategist');
    expect(result.activePlayerIndex).toBe(0);
    expect(
      result.units.every((unit) => result.territories.some(({ id }) => id === unit.territoryId)),
    ).toBe(true);
  });

  it('is deterministic for the same state and difficulty', () => {
    const state = endHumanTurn(startActionPhase(createGame({ seed: 9 })));
    expect(runAITurn(state, 'citizen')).toEqual(runAITurn(state, 'citizen'));
  });

  it('generates a legal candidate action every time it is asked to decide', () => {
    let state = endHumanTurn(startActionPhase(createGame({ seed: 3 })));
    state = startActionPhase(state);
    for (let step = 0; step < 12; step += 1) {
      const action = chooseAIAction(state, 'strategist');
      const result = applyAction(state, action);
      expect(result.ok).toBe(true);
      state = result.state;
      if (action.type === 'END_TURN') break;
    }
  });

  it('chooses a non-end-turn action on its first decision when useful legal actions exist', () => {
    const state = startActionPhase(endHumanTurn(startActionPhase(createGame({ seed: 5 }))));
    const action = chooseAIAction(state, 'strategist');
    expect(action.type).not.toBe('END_TURN');
  });

  it('recruits when it has sufficient coins and needs more units', () => {
    let state = startActionPhase(endHumanTurn(startActionPhase(createGame({ seed: 11 }))));
    const ai = activePlayer(state);
    // Move every currently ready unit out of the way first so recruitment is exercised directly.
    while (
      state.units.some(
        (unit) =>
          unit.ownerId === ai.id && !unit.acted && legalDestinations(state, unit.id).length > 0,
      )
    ) {
      const action = chooseAIAction(state, 'strategist');
      if (action.type !== 'MOVE' && action.type !== 'ATTACK') break;
      state = applyAction(state, action).state;
    }
    const recruitedBefore = state.units.filter((unit) => unit.ownerId === ai.id).length;
    const action = chooseAIAction(state, 'strategist');
    expect(action.type).toBe('RECRUIT');
    const result = applyAction(state, action);
    expect(result.ok).toBe(true);
    expect(result.state.units.filter((unit) => unit.ownerId === ai.id).length).toBe(
      recruitedBefore + 1,
    );
  });

  it('moves toward and contests the campaign objective territory (Sicily)', () => {
    let state = startActionPhase(
      endHumanTurn(startActionPhase(createGame({ scenarioId: 'sicilian-question', seed: 13 }))),
    );
    state = runAITurn(state, 'strategist');
    // Rome starts two hops from Sicily; over a few AI turns it should approach or take it.
    let turns = 0;
    while (turns < 6 && state.territories.find(({ id }) => id === 'sicily')?.ownerId !== 'p2') {
      state = endHumanTurn(startActionPhase(state));
      state = runAITurn(state, 'strategist');
      turns += 1;
    }
    const sicily = state.territories.find(({ id }) => id === 'sicily');
    const romeNearSicily = state.units.some(
      (unit) =>
        unit.ownerId === 'p2' &&
        (unit.territoryId === 'sicily' ||
          state.territories
            .find(({ id }) => id === unit.territoryId)
            ?.connections.includes('sicily')),
    );
    expect(sicily?.ownerId === 'p2' || romeNearSicily).toBe(true);
  });

  it('does not remain completely idle across several consecutive turns while it has resources', () => {
    let state = startActionPhase(createGame({ seed: 21 }));
    state.players[0].isAI = true;
    let meaningfulTurns = 0;
    for (let turn = 0; turn < 6; turn += 1) {
      const before = JSON.stringify({ units: state.units, players: state.players });
      state = runAITurn(state, 'strategist');
      state = startActionPhase(state);
      const after = JSON.stringify({ units: state.units, players: state.players });
      if (before !== after) meaningfulTurns += 1;
      if (state.winnerId) break;
    }
    expect(meaningfulTurns).toBeGreaterThan(0);
  });

  it('always ends its turn cleanly even when it starts with no legal moves', () => {
    let state = startActionPhase(createGame({ seed: 17 }));
    state.units = state.units.filter((unit) => unit.ownerId !== 'p2');
    state.players[1].coins = 0;
    state = endHumanTurn(state);
    const result = runAITurn(state, 'strategist');
    expect(result.activePlayerIndex).toBe(0);
  });

  it('never produces illegal actions or infinite loops across many simulated turns', () => {
    let state = startActionPhase(createGame({ seed: 33 }));
    state.players[0].isAI = true;
    for (let turn = 0; turn < 20 && !state.winnerId; turn += 1) {
      state = runAITurn(state, turn % 2 ? 'citizen' : 'strategist');
      state = startActionPhase(state);
      expect(
        state.units.every((unit) => state.territories.some(({ id }) => id === unit.territoryId)),
      ).toBe(true);
      expect(state.players.every((player) => player.coins >= 0)).toBe(true);
    }
  });

  it('spends favor once it has accumulated enough and none is pending', () => {
    const state = startActionPhase(endHumanTurn(startActionPhase(createGame({ seed: 41 }))));
    const ai = activePlayer(state);
    ai.favor = 3;
    ai.usedFavor = false;
    ai.hand = [];
    // Exhaust movement and recruitment so favor becomes the best remaining action.
    state.units = state.units.map((unit) =>
      unit.ownerId === ai.id ? { ...unit, acted: true } : unit,
    );
    ai.coins = 0;
    const action = chooseAIAction(state, 'strategist');
    expect(action.type).toBe('INVOKE_FAVOR');
  });

  it('never selects a losing attack', () => {
    let state = startActionPhase(endHumanTurn(startActionPhase(createGame({ seed: 19 }))));
    const cavalry = state.units.find((unit) => unit.ownerId === 'p2' && unit.type === 'cavalry')!;
    // Cavalry loses its plains bonus and is weaker against defended terrain; ensure the AI
    // never proposes an attack scored as anything but a probable victory.
    for (let i = 0; i < 5; i += 1) {
      const action = chooseAIAction(state, 'strategist');
      if (action.type === 'ATTACK') {
        const attacker = state.units.find((unit) => unit.id === action.unitId)!;
        const result = applyAction(state, action);
        expect(result.ok).toBe(true);
        expect(result.state.units.some((unit) => unit.id === attacker.id)).toBe(true);
        state = result.state;
      } else {
        const result = applyAction(state, action);
        if (!result.ok) break;
        state = result.state;
      }
      if (activePlayer(state).id !== cavalry.ownerId) break;
    }
  });
});
