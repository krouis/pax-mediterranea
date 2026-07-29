import { generateMoveCandidates, previewCombat } from './candidates';
import type { GameAction, GameState, Player } from '../../engine/types';
import { applyAction } from '../../engine/rules';

/**
 * Bounded one-ply lookahead used only by the `expert` skill level, on only the top few
 * candidates (never the full tree — this stays cheap enough for batch simulation). It answers
 * one narrow question: "after this action, can the opponent immediately win an attack against
 * one of my valuable territories?" It does not search opponent replies beyond that single
 * check, and it never mutates the real state — `applyAction` already clones internally.
 */
export function counterThreatPenalty(
  state: GameState,
  actingPlayer: Player,
  action: GameAction,
): number {
  const result = applyAction(state, action);
  if (!result.ok) return 0;
  const opponent = result.state.players.find((candidate) => candidate.id !== actingPlayer.id);
  if (!opponent) return 0;

  let worst = 0;
  for (const move of generateMoveCandidates(result.state, opponent)) {
    if (!move.hostile) continue;
    const territory = result.state.territories.find(
      (candidateTerritory) => candidateTerritory.id === move.to,
    );
    if (!territory || territory.ownerId !== actingPlayer.id) continue;
    const preview = previewCombat(result.state, move.unit, move.to);
    if (preview.outcome !== 'victory') continue;
    const value = territory.capital
      ? 10
      : territory.major
        ? 5
        : territory.terrain === 'city'
          ? 3
          : 1;
    worst = Math.max(worst, value);
  }
  return -worst;
}
