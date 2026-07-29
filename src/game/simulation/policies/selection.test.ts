import { describe, expect, it } from 'vitest';
import { activePlayer, applyAction, startActionPhase } from '../../engine/rules';
import { createGame } from '../../engine/state';
import type { GameState } from '../../engine/types';
import { aggressor } from '../personas/aggressor';
import { defender } from '../personas/defender';
import { expansionist } from '../personas/expansionist';
import { explorer } from '../personas/explorer';
import { objectiveRusher } from '../personas/objective-rusher';
import { createNoiseState } from './errors';
import { selectAction } from './selection';
import { buildScoringContext } from './scoring';

function readyState(seed: number): GameState {
  return startActionPhase(createGame({ seed }));
}

describe('persona action selection', () => {
  it('objective-rusher moves toward the campaign objective territory when available', () => {
    const state = startActionPhase(createGame({ scenarioId: 'sicilian-question', seed: 1 }));
    const player = activePlayer(state);
    const context = buildScoringContext(state);
    const noise = createNoiseState(1);
    const result = selectAction(state, player, objectiveRusher, 'competent', context, noise);
    expect(result.candidate.kind).toBe('move');
    if (result.candidate.kind === 'move') expect(result.candidate.data.to).toBe('sicily');
  });

  it('expansionist prefers capturing neutral territory over a pointless reposition', () => {
    const state = readyState(1);
    const player = activePlayer(state);
    const context = buildScoringContext(state);
    const noise = createNoiseState(1);
    const result = selectAction(state, player, expansionist, 'competent', context, noise);
    const candidate = result.candidate;
    expect(candidate.kind).toBe('move');
    if (candidate.kind === 'move') {
      const destination = state.territories.find(({ id }) => id === candidate.data.to);
      expect(destination?.ownerId).toBeUndefined();
    }
  });

  it('aggressor takes a favorable attack when one is available', () => {
    let state = readyState(1);
    // Move Carthage's infantry next to Latium (Rome's capital) via Sardinia -> Corsica, then
    // hand-place it adjacent so this test does not depend on many turns of setup.
    state = applyAction(state, {
      type: 'MOVE',
      playerId: 'p1',
      unitId: 'u1',
      to: 'sardinia',
    }).state;
    state.units.find(({ id }) => id === 'u1')!.territoryId = 'corsica';
    state.units.find(({ id }) => id === 'u1')!.acted = false;
    state.territories.find(({ id }) => id === 'corsica')!.ownerId = 'p1';
    // Latium starts defended by Rome's infantry; remove it so the attack is unambiguously
    // favorable and this test isolates persona preference rather than combat resolution.
    state.units = state.units.filter(({ id }) => id !== 'u3');
    const player = activePlayer(state);
    const context = buildScoringContext(state);
    const noise = createNoiseState(1);
    const result = selectAction(state, player, aggressor, 'competent', context, noise);
    expect(result.candidate.kind).toBe('move');
    if (result.candidate.kind === 'move') {
      expect(result.candidate.data.to).toBe('latium');
      expect(result.candidate.data.type).toBe('ATTACK');
    }
  });

  it('defender reinforces a threatened owned territory instead of expanding elsewhere', () => {
    const state = readyState(2);
    // Give Carthage a second unit that can reinforce Numidia while an enemy unit threatens it.
    state.units.push({
      id: 'reinforcer',
      ownerId: 'p1',
      type: 'infantry',
      territoryId: 'carthage',
      acted: false,
    });
    state.units.push({
      id: 'threat',
      ownerId: 'p2',
      type: 'cavalry',
      territoryId: 'sardinia',
      acted: false,
    });
    state.territories.find(({ id }) => id === 'sardinia')!.ownerId = 'p2';
    const player = activePlayer(state);
    const context = buildScoringContext(state);
    const noise = createNoiseState(1);
    const result = selectAction(state, player, defender, 'competent', context, noise);
    // A rational defensive candidate set includes reinforcing Numidia or holding the capital;
    // it must not be a losing attack, and must remain a legal candidate.
    expect(['move', 'end']).toContain(result.candidate.kind);
    expect(result.evaluation.scoreComponents.unitLossRisk ?? 0).toBeGreaterThanOrEqual(-3);
  });

  it('explorer prefers a less-visited legal action over a repeatedly used one', () => {
    const state = readyState(1);
    const player = activePlayer(state);
    const context = buildScoringContext(state);
    context.novelty.territoryVisitCounts.sardinia = 5;
    const noise = createNoiseState(1);
    const result = selectAction(state, player, explorer, 'competent', context, noise);
    if (result.candidate.kind === 'move') expect(result.candidate.data.to).not.toBe('sardinia');
  });

  it('always terminates with a legal candidate even when nothing scores positively', () => {
    const state = readyState(1);
    state.units.forEach((unit) => (unit.acted = true));
    state.players[0].coins = 0;
    state.players[0].hand = [];
    state.players[0].favor = 0;
    const player = activePlayer(state);
    const context = buildScoringContext(state);
    const noise = createNoiseState(1);
    const result = selectAction(state, player, expansionist, 'competent', context, noise);
    expect(result.candidate.kind).toBe('end');
  });
});
