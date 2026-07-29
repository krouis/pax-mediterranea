import type { Persona } from './persona';

export const defender: Persona = {
  id: 'defender',
  description:
    'Protects the capital, cities, ports, sacred sites, and objectives; reinforces threatened territory and preserves unit value over expansion.',
  weights: {
    defensiveExposure: 3.5,
    unitLossRisk: 1.6,
    counterThreat: 2,
    territoryValue: 1.3,
    enemyUnitRemoval: 0.7,
    movementEfficiency: 0.6,
  },
};
