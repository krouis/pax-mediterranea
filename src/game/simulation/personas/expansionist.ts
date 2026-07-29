import type { Persona } from './persona';

export const expansionist: Persona = {
  id: 'expansionist',
  description:
    'Prioritizes capturing neutral territory and growing controlled-territory count over combat or economy.',
  weights: {
    territoryValue: 3,
    paxGain: 2,
    movementEfficiency: 2.5,
    incomeGain: 1.2,
    enemyUnitRemoval: 0.5,
    unitLossRisk: 1.2,
  },
};
