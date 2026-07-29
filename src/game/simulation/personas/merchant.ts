import type { Persona } from './persona';

export const merchant: Persona = {
  id: 'merchant',
  description:
    'Maximizes sustainable income and controls economic territory, using economic cards efficiently and delaying risky conflict.',
  weights: {
    incomeGain: 3,
    cardValue: 2,
    portValue: 1.5,
    unitLossRisk: 1.5,
    counterThreat: 1.5,
    movementEfficiency: 0.6,
    enemyUnitRemoval: 0.5,
  },
};
