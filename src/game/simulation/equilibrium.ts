import type { TerminationClassification } from './types';

/**
 * Repeated-state detection over a rolling hash history: looks for the most recent hash
 * reappearing earlier in the trajectory (an exact cycle), scanning back up to half the
 * history length. This flags true no-progress loops and deterministic regressions; it does not
 * by itself say whether repetition is good or bad — see docs/SIMULATION-METRICS.md.
 */
export function detectRepeatedState(hashHistory: string[]): { detected: boolean; period?: number } {
  if (hashHistory.length < 2) return { detected: false };
  const last = hashHistory[hashHistory.length - 1];
  const maxPeriod = Math.floor(hashHistory.length / 2);
  for (let period = 1; period <= maxPeriod; period += 1) {
    const prevIndex = hashHistory.length - 1 - period;
    if (prevIndex < 0) break;
    if (hashHistory[prevIndex] === last) return { detected: true, period };
  }
  return { detected: false };
}

/**
 * A "stable frontier" / equilibrium is declared when the trailing `window` half-turns produced
 * no meaningful change (see TelemetryRecorder.recordHalfTurn for what counts as meaningful:
 * territory ownership, unit presence/readiness, coins, Pax, cards, or favor). This is a
 * descriptive classification, not a verdict — a long stable frontier can equally mean a healthy
 * defensive equilibrium, excessive defensive advantage, or a broken/underpowered AI, and
 * distinguishing those requires reading the surrounding telemetry (combat counts, recruitment,
 * card/favor usage), not this flag alone.
 */
export function detectEquilibrium(
  consecutiveIdleHalfTurns: number,
  window: number,
): { detected: boolean } {
  return { detected: consecutiveIdleHalfTurns >= window };
}

export interface TerminationInputs {
  winnerId?: string;
  scenarioWinner: boolean;
  maxTurnsReached: boolean;
  repeatedStateDetected: boolean;
  equilibriumDetected: boolean;
  illegalActionOccurred: boolean;
  simulationError: boolean;
}

export function classifyTermination(inputs: TerminationInputs): TerminationClassification {
  if (inputs.simulationError) return 'simulation-error';
  if (inputs.illegalActionOccurred) return 'illegal-action';
  if (inputs.winnerId && inputs.scenarioWinner) return 'scenario-victory';
  if (inputs.winnerId) return 'natural-victory';
  if (inputs.repeatedStateDetected) return 'repeated-state-cycle';
  if (inputs.equilibriumDetected) return 'stable-frontier';
  if (inputs.maxTurnsReached) return 'no-progress';
  return 'max-turns';
}
