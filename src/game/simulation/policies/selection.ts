import type { GameState, Player } from '../../engine/types';
import type { Persona } from '../personas/persona';
import type { CandidateEvaluation, SkillLevel } from '../types';
import { actionForCandidate, collectAllCandidates, type ScorableCandidate } from './candidates';
import { nextNoiseValue, sampleSubset, weightedRandomPick, type NoiseState } from './errors';
import { counterThreatPenalty } from './planning';
import { recordCandidateUsage, scoreCandidate, totalScore, type ScoringContext } from './scoring';

const NOVICE_HORIZON = 8;
const EXPERT_LOOKAHEAD_TOP_K = 3;

export interface SelectionResult {
  candidate: ScorableCandidate;
  evaluation: CandidateEvaluation;
  allEvaluations: CandidateEvaluation[];
}

function evaluate(
  state: GameState,
  player: Player,
  candidate: ScorableCandidate,
  persona: Persona,
  context: ScoringContext,
): CandidateEvaluation {
  const scoreComponents = scoreCandidate(state, player, candidate, context);
  return {
    action: actionForCandidate(player.id, candidate),
    legal: true,
    totalScore: totalScore(scoreComponents, persona.weights),
    scoreComponents,
  };
}

/**
 * Chooses one candidate action for `player` this decision, per `persona` identity and
 * `skillLevel` execution quality. Always returns END_TURN if nothing else scores positively (or
 * if only END_TURN was sampled at novice skill), so a turn always terminates.
 */
export function selectAction(
  state: GameState,
  player: Player,
  persona: Persona,
  skillLevel: SkillLevel,
  context: ScoringContext,
  noise: NoiseState,
): SelectionResult {
  const candidates = collectAllCandidates(state, player);
  const nonEnd = candidates.filter((candidate) => candidate.kind !== 'end');

  if (skillLevel === 'novice') {
    const sampled = sampleSubset(nonEnd, NOVICE_HORIZON, noise);
    const scored = sampled.map((candidate) => ({
      candidate,
      evaluation: evaluate(state, player, candidate, persona, context),
    }));
    const chosen = weightedRandomPick(
      scored.map((entry) => ({ item: entry, score: entry.evaluation.totalScore })),
      noise,
    );
    const endEvaluation = evaluate(state, player, { kind: 'end' }, persona, context);
    if (!chosen) {
      return {
        candidate: { kind: 'end' },
        evaluation: endEvaluation,
        allEvaluations: [...scored.map((entry) => entry.evaluation), endEvaluation],
      };
    }
    recordCandidateUsage(context.novelty, chosen.candidate);
    return {
      candidate: chosen.candidate,
      evaluation: chosen.evaluation,
      allEvaluations: [...scored.map((entry) => entry.evaluation), endEvaluation],
    };
  }

  const scored = nonEnd.map((candidate) => ({
    candidate,
    evaluation: evaluate(state, player, candidate, persona, context),
  }));
  scored.sort((a, b) => b.evaluation.totalScore - a.evaluation.totalScore);

  if (skillLevel === 'expert' && scored.length > 0) {
    const topK = scored.slice(0, EXPERT_LOOKAHEAD_TOP_K);
    for (const entry of topK) {
      const penalty = counterThreatPenalty(state, player, entry.evaluation.action);
      if (penalty !== 0) {
        entry.evaluation.scoreComponents.counterThreat = penalty;
        entry.evaluation.totalScore += penalty * (persona.weights.counterThreat ?? 1);
      }
    }
    scored.sort((a, b) => b.evaluation.totalScore - a.evaluation.totalScore);
  }

  const endEvaluation = evaluate(state, player, { kind: 'end' }, persona, context);
  const best = scored[0];
  if (!best || best.evaluation.totalScore <= 0) {
    return {
      candidate: { kind: 'end' },
      evaluation: endEvaluation,
      allEvaluations: [...scored.map((entry) => entry.evaluation), endEvaluation],
    };
  }
  recordCandidateUsage(context.novelty, best.candidate);
  return {
    candidate: best.candidate,
    evaluation: best.evaluation,
    allEvaluations: [...scored.map((entry) => entry.evaluation), endEvaluation],
  };
}

export { nextNoiseValue };
export type { NoiseState };
