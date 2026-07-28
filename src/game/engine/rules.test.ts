import { describe, expect, it } from 'vitest';
import { createGame } from './state';
import {
  activePlayer,
  applyAction,
  combatPreview,
  legalDestinations,
  startActionPhase,
  territoryIncome,
} from './rules';

describe('deterministic game rules', () => {
  it('creates a serializable game with Carthage first', () => {
    const state = createGame({ seed: 42 });
    expect(activePlayer(state).faction).toBe('carthage');
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it('calculates Carthaginian port income with Merchant Republic', () => {
    expect(territoryIncome(createGame(), 'p1')).toBe(3);
  });

  it('advances phases and applies income and a draw', () => {
    const original = createGame();
    const state = startActionPhase(original);
    expect(state.phase).toBe('act');
    expect(state.players[0].coins).toBe(8);
    expect(state.players[0].hand).toHaveLength(3);
    expect(original.players[0].coins).toBe(5);
  });

  it('rejects actions from the inactive player without mutation', () => {
    const state = createGame();
    const result = applyAction(state, { type: 'END_TURN', playerId: 'p2' });
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
  });

  it('restricts land units from crossing sea connections', () => {
    const state = createGame();
    expect(legalDestinations(state, 'u1')).toEqual(['sardinia', 'sicily', 'numidia']);
    expect(legalDestinations(state, 'u2')).toEqual(['carthage']);
  });

  it('moves infantry and captures neutral land', () => {
    const state = startActionPhase(createGame());
    const result = applyAction(state, {
      type: 'MOVE',
      playerId: 'p1',
      unitId: 'u1',
      to: 'sardinia',
    });
    expect(result.ok).toBe(true);
    expect(result.state.territories.find(({ id }) => id === 'sardinia')?.ownerId).toBe('p1');
    expect(result.state.players[0].pax).toBe(1);
  });

  it('provides a transparent deterministic combat preview', () => {
    const state = createGame();
    const attacker = state.units.find(({ id }) => id === 'u1');
    expect(attacker).toBeDefined();
    expect(combatPreview(state, attacker!, 'sicily')).toEqual({
      attack: 2,
      defense: 1,
      outcome: 'victory',
    });
  });

  it('recruits only affordable compatible units', () => {
    const state = startActionPhase(createGame());
    const success = applyAction(state, {
      type: 'RECRUIT',
      playerId: 'p1',
      unitType: 'infantry',
      territoryId: 'carthage',
    });
    expect(success.ok).toBe(true);
    expect(success.state.players[0].coins).toBe(6);
    const failure = applyAction(state, {
      type: 'RECRUIT',
      playerId: 'p1',
      unitType: 'fleet',
      territoryId: 'sicily',
    });
    expect(failure.ok).toBe(false);
  });

  it('plays a card, invokes favor, and rotates turns', () => {
    let state = startActionPhase(createGame());
    state = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardId: 'hannibal-barca',
      unitId: 'u1',
    }).state;
    expect(state.players[0].hand).not.toContain('hannibal-barca');
    state = applyAction(state, {
      type: 'INVOKE_FAVOR',
      playerId: 'p1',
      territoryId: 'carthage',
    }).state;
    expect(state.players[0].favor).toBe(0);
    state = applyAction(state, { type: 'END_TURN', playerId: 'p1' }).state;
    expect(activePlayer(state).id).toBe('p2');
    expect(state.phase).toBe('income');
  });

  it('resolves victory, defeat, and classic seeded battles', () => {
    let victory = startActionPhase(createGame());
    victory.territories.find(({ id }) => id === 'sicily')!.ownerId = 'p2';
    victory = applyAction(victory, {
      type: 'ATTACK',
      playerId: 'p1',
      unitId: 'u1',
      to: 'sicily',
    }).state;
    expect(victory.units.find(({ id }) => id === 'u1')?.territoryId).toBe('sicily');

    const defeat = startActionPhase(createGame());
    defeat.units.find(({ id }) => id === 'u1')!.type = 'cavalry';
    defeat.units.push({
      id: 'defender',
      ownerId: 'p2',
      type: 'infantry',
      territoryId: 'sicily',
      acted: false,
    });
    expect(
      applyAction(defeat, {
        type: 'ATTACK',
        playerId: 'p1',
        unitId: 'u1',
        to: 'sicily',
      }).state.units.some(({ id }) => id === 'u1'),
    ).toBe(false);

    const classic = startActionPhase(createGame({ seed: 42 }));
    classic.rules = 'classic';
    classic.territories.find(({ id }) => id === 'sicily')!.ownerId = 'p2';
    expect(
      applyAction(classic, {
        type: 'ATTACK',
        playerId: 'p1',
        unitId: 'u1',
        to: 'sicily',
      }).state.rngState,
    ).not.toBe(42);
  });

  it('validates common illegal actions and handles economic cards', () => {
    let state = createGame();
    expect(
      applyAction(state, {
        type: 'MOVE',
        playerId: 'p1',
        unitId: 'u1',
        to: 'sardinia',
      }).error,
    ).toBe('game:errors.actionPhase');
    state = startActionPhase(state);
    expect(
      applyAction(state, {
        type: 'MOVE',
        playerId: 'p1',
        unitId: 'missing',
        to: 'sicily',
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        type: 'MOVE',
        playerId: 'p1',
        unitId: 'u1',
        to: 'latium',
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        type: 'ATTACK',
        playerId: 'p1',
        unitId: 'u1',
        to: 'numidia',
      }).ok,
    ).toBe(false);
    state.players[0].hand.push('merchant-fleet');
    const coins = state.players[0].coins;
    state = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardId: 'merchant-fleet',
    }).state;
    expect(state.players[0].coins).toBe(coins + 2);
    expect(
      applyAction(state, {
        type: 'PLAY_CARD',
        playerId: 'p1',
        cardId: 'not-a-card',
      }).ok,
    ).toBe(false);
  });

  it('concludes the campaign scenario in victory when the objective is held at the turn boundary', () => {
    const state = createGame({ scenarioId: 'sicilian-question' });
    state.turn = 6;
    state.activePlayerIndex = 1;
    state.territories.find(({ id }) => id === 'sicily')!.ownerId = 'p1';
    const result = applyAction(state, { type: 'END_TURN', playerId: 'p2' });
    expect(result.ok).toBe(true);
    expect(result.state.winnerId).toBe('p1');
    expect(result.state.phase).toBe('ended');
    expect(result.state.turn).toBe(6);
    const blocked = applyAction(result.state, { type: 'END_TURN', playerId: 'p1' });
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toBe('game:errors.matchEnded');
  });

  it('concludes the campaign scenario in defeat when the objective is not held at the turn boundary', () => {
    const state = createGame({ scenarioId: 'sicilian-question' });
    state.turn = 6;
    state.activePlayerIndex = 1;
    const result = applyAction(state, { type: 'END_TURN', playerId: 'p2' });
    expect(result.ok).toBe(true);
    expect(result.state.winnerId).toBe('p2');
    expect(result.state.phase).toBe('ended');
    expect(result.state.turn).toBe(6);
  });

  it('does not evaluate the scenario objective before its turn or outside campaign mode', () => {
    const midGame = createGame({ scenarioId: 'sicilian-question' });
    midGame.turn = 5;
    midGame.activePlayerIndex = 1;
    midGame.territories.find(({ id }) => id === 'sicily')!.ownerId = 'p1';
    const stillPlaying = applyAction(midGame, { type: 'END_TURN', playerId: 'p2' });
    expect(stillPlaying.state.winnerId).toBeUndefined();
    expect(stillPlaying.state.turn).toBe(6);

    const skirmish = createGame();
    skirmish.turn = 6;
    skirmish.activePlayerIndex = 1;
    const noObjective = applyAction(skirmish, { type: 'END_TURN', playerId: 'p2' });
    expect(noObjective.state.winnerId).toBeUndefined();
    expect(noObjective.state.turn).toBe(7);
  });

  it('checks favor, recruitment, and ended game constraints', () => {
    const state = startActionPhase(createGame());
    state.players[0].coins = 0;
    expect(
      applyAction(state, {
        type: 'RECRUIT',
        playerId: 'p1',
        unitType: 'cavalry',
        territoryId: 'carthage',
      }).error,
    ).toBe('game:errors.coins');
    expect(
      applyAction(state, {
        type: 'RECRUIT',
        playerId: 'p1',
        unitType: 'fleet',
        territoryId: 'numidia',
      }).ok,
    ).toBe(false);
    state.players[0].favor = 0;
    expect(
      applyAction(state, {
        type: 'INVOKE_FAVOR',
        playerId: 'p1',
        territoryId: 'carthage',
      }).ok,
    ).toBe(false);
    state.winnerId = 'p1';
    expect(applyAction(state, { type: 'END_TURN', playerId: 'p1' }).ok).toBe(false);
  });
});
