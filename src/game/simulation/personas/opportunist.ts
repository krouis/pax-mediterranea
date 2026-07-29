import type { Persona } from './persona';

/** The general-purpose rational baseline: every raw score component keeps its default weight
 * (1), so this persona's choices reflect the shared scoring model with no identity-specific
 * bias. Useful as the control arm in persona matchups. */
export const opportunist: Persona = {
  id: 'opportunist',
  description:
    'Chooses the strongest immediate-value legal action using the shared scoring model with no persona-specific bias.',
  weights: {},
};
