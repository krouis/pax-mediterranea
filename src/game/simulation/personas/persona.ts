import type { PersonaId, ScoreComponent } from '../types';

/**
 * A persona is a weight vector over the shared raw score components computed in
 * `policies/scoring.ts`. Weights are multipliers (default `1` for any component a persona does
 * not mention), so a persona's identity is expressed by which components it amplifies or
 * dampens relative to the `opportunist` baseline (all weights `1`) — not by a separate,
 * hand-written algorithm per persona. See docs/PLAYER-PERSONAS.md for the design rationale and
 * the limits of this approach.
 */
export interface Persona {
  id: PersonaId;
  weights: Partial<Record<ScoreComponent, number>>;
  description: string;
}
