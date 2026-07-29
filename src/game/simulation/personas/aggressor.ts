import type { Persona } from './persona';

export const aggressor: Persona = {
  id: 'aggressor',
  description:
    'Seeks favorable attacks and pressures exposed cities/capitals, preferring initiative over passive accumulation.',
  weights: {
    enemyUnitRemoval: 3,
    capitalThreat: 2.5,
    cityThreat: 2,
    unitLossRisk: 0.6,
    counterThreat: 0.5,
    incomeGain: 0.5,
    movementEfficiency: 0.7,
  },
};
