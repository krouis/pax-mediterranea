import type { Persona } from './persona';

export const navalStrategist: Persona = {
  id: 'naval-strategist',
  description:
    'Recruits and uses fleets, controls ports/islands/sea routes, and supports land expansion through maritime positioning.',
  weights: {
    portValue: 4,
    territoryValue: 1.3,
    movementEfficiency: 1.2,
    incomeGain: 1.2,
    objectiveProgress: 1.2,
  },
};
