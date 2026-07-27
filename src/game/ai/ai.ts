import { unitRules } from '../../content/gameContent';
import { activePlayer, applyAction, legalDestinations, startActionPhase } from '../engine/rules';
import type { Difficulty, GameAction, GameState } from '../engine/types';

export function chooseAIAction(state: GameState, difficulty: Difficulty): GameAction {
  const player = activePlayer(state);
  if (!player.isAI) return { type: 'END_TURN', playerId: player.id };
  const ready = startActionPhase(state);
  const ai = activePlayer(ready);
  const unit = ready.units.find(
    (candidate) => candidate.ownerId === ai.id && legalDestinations(ready, candidate.id).length > 0,
  );
  if (unit) {
    const options = legalDestinations(ready, unit.id);
    const scored = options
      .map((id) => {
        const territory = ready.territories.find((candidate) => candidate.id === id);
        const enemies = ready.units.filter(
          (candidate) => candidate.territoryId === id && candidate.ownerId !== ai.id,
        );
        const score =
          (territory?.major ? 5 : 0) +
          (territory?.capital ? 8 : 0) +
          (territory?.ownerId !== ai.id ? 2 : 0) -
          enemies.reduce((sum, enemy) => sum + unitRules[enemy.type].defense, 0);
        return { id, score };
      })
      .sort((a, b) => b.score - a.score);
    const target =
      difficulty === 'citizen' ? options[ready.rngState % options.length] : scored[0].id;
    const territory = ready.territories.find((candidate) => candidate.id === target);
    const hostile =
      (territory?.ownerId !== undefined && territory.ownerId !== ai.id) ||
      ready.units.some(
        (candidate) => candidate.territoryId === target && candidate.ownerId !== ai.id,
      );
    return { type: hostile ? 'ATTACK' : 'MOVE', playerId: ai.id, unitId: unit.id, to: target };
  }
  return { type: 'END_TURN', playerId: ai.id };
}

export function runAITurn(
  original: GameState,
  difficulty: Difficulty = 'strategist',
  maxActions = 20,
): GameState {
  let state = startActionPhase(original);
  const playerId = activePlayer(state).id;
  for (let count = 0; count < maxActions && activePlayer(state).id === playerId; count += 1) {
    const action = chooseAIAction(state, difficulty);
    const result = applyAction(state, action);
    if (!result.ok) return applyAction(state, { type: 'END_TURN', playerId }).state;
    state = result.state;
    if (action.type === 'END_TURN') break;
  }
  if (activePlayer(state).id === playerId)
    state = applyAction(state, { type: 'END_TURN', playerId }).state;
  return state;
}
