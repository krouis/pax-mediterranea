import type { Persona } from './persona';

export const objectiveRusher: Persona = {
  id: 'objective-rusher',
  description:
    'Maximizes scenario objective and Pax progress above all else, accepting moderate unit risk to advance a victory condition.',
  weights: {
    objectiveProgress: 5,
    paxGain: 3,
    capitalThreat: 1.5,
    unitLossRisk: 0.8,
    counterThreat: 1.2,
  },
};
