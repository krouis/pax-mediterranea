import { describe, expect, it } from 'vitest';
import { activePlayer, startActionPhase } from '../../engine/rules';
import { createGame } from '../../engine/state';
import type { GameState } from '../../engine/types';
import { opportunist } from '../personas/opportunist';
import { createNoiseState } from './errors';
import { selectAction } from './selection';
import { buildScoringContext } from './scoring';

function trapState(): GameState {
  const state = startActionPhase(createGame({ seed: 1 }));
  // Strip down to exactly one Carthage unit (at the capital) and one Rome unit one hop away
  // (Sardinia), so moving the Carthage unit to capture the enticing neutral Sicily leaves the
  // capital open to an immediate, winning Rome attack.
  state.units = [
    { id: 'u1', ownerId: 'p1', type: 'infantry', territoryId: 'carthage', acted: false },
    { id: 'threat', ownerId: 'p2', type: 'infantry', territoryId: 'sardinia', acted: false },
  ];
  return state;
}

describe('skill-level execution differences', () => {
  it('expert computes a counterThreat penalty for a move that abandons the capital to an immediate counter-attack; competent does not', () => {
    const state = trapState();
    const player = activePlayer(state);
    const context = buildScoringContext(state);

    const competentResult = selectAction(
      state,
      player,
      opportunist,
      'competent',
      context,
      createNoiseState(1),
    );
    const sicilyEvalCompetent = competentResult.allEvaluations.find(
      (evaluation) =>
        evaluation.action.type === 'MOVE' &&
        'to' in evaluation.action &&
        evaluation.action.to === 'sicily',
    );
    expect(sicilyEvalCompetent).toBeDefined();
    expect(sicilyEvalCompetent!.scoreComponents.counterThreat).toBeUndefined();

    const expertResult = selectAction(
      state,
      player,
      opportunist,
      'expert',
      context,
      createNoiseState(1),
    );
    const sicilyEvalExpert = expertResult.allEvaluations.find(
      (evaluation) =>
        evaluation.action.type === 'MOVE' &&
        'to' in evaluation.action &&
        evaluation.action.to === 'sicily',
    );
    expect(sicilyEvalExpert).toBeDefined();
    expect(sicilyEvalExpert!.scoreComponents.counterThreat).toBeLessThan(0);
  });

  it('novice only searches a bounded, seeded subset of candidates and can settle for a merely-positive option', () => {
    const state = startActionPhase(createGame({ seed: 3 }));
    const player = activePlayer(state);
    const context = buildScoringContext(state);

    // Across many seeds, novice should not always land on the single best-scoring candidate the
    // way competent/expert deterministically do — otherwise novice would just be competent with
    // extra steps.
    const competentChoice = selectAction(
      state,
      player,
      opportunist,
      'competent',
      context,
      createNoiseState(1),
    ).evaluation.action;
    let sawDifferentChoice = false;
    for (let seed = 1; seed <= 25; seed += 1) {
      const noviceChoice = selectAction(
        state,
        player,
        opportunist,
        'novice',
        context,
        createNoiseState(seed),
      ).evaluation.action;
      if (JSON.stringify(noviceChoice) !== JSON.stringify(competentChoice)) {
        sawDifferentChoice = true;
        break;
      }
    }
    expect(sawDifferentChoice).toBe(true);
  });

  it('novice never proposes a negative-scoring (illegal-in-spirit) candidate despite the narrower search', () => {
    const state = trapState();
    const player = activePlayer(state);
    const context = buildScoringContext(state);
    for (let seed = 1; seed <= 15; seed += 1) {
      const result = selectAction(
        state,
        player,
        opportunist,
        'novice',
        context,
        createNoiseState(seed),
      );
      expect(result.evaluation.totalScore).toBeGreaterThanOrEqual(0);
    }
  });
});
