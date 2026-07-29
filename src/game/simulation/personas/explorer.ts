import type { Persona } from './persona';

/** Exercises underused actions/cards/territories to surface dead content and rule coverage
 * gaps. Its win rate is not a balance signal — see docs/PLAYER-PERSONAS.md. */
export const explorer: Persona = {
  id: 'explorer',
  description:
    'Prefers underused legal actions, cards, favors, and territories to exercise content reachability rather than to win.',
  weights: {
    novelty: 5,
    territoryValue: 0.5,
    paxGain: 0.6,
    cardValue: 1.8,
    incomeGain: 0.5,
    unitLossRisk: 1,
  },
};
