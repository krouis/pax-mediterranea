import { scenarios } from '../../content/gameContent';
import {
  activePlayer,
  applyAction,
  combatPreview,
  legalDestinations,
  startActionPhase,
  unitCost,
} from '../engine/rules';
import type { Difficulty, GameAction, GameState, Player, Territory, Unit, UnitType } from '../engine/types';

function objectiveTerritoryId(state: GameState): string | undefined {
  const scenario = scenarios.find(({ id }) => id === state.scenarioId);
  const objective = scenario?.objective;
  return objective?.type === 'controlAtTurn' ? objective.territoryId : undefined;
}

interface MoveCandidate {
  unit: Unit;
  to: string;
  score: number;
}

function scoreDestination(
  state: GameState,
  unit: Unit,
  territory: Territory,
  ai: Player,
  objectiveId: string | undefined,
): number | null {
  const isObjective = territory.id === objectiveId;
  const objectiveBonus = isObjective ? 20 : 0;
  const valueBonus = (territory.capital ? 10 : 0) + (territory.major ? 4 : 0);
  if (territory.ownerId && territory.ownerId !== ai.id) {
    const preview = combatPreview(state, unit, territory.id);
    if (preview.outcome !== 'victory') return null;
    return 10 + (preview.attack - preview.defense) + valueBonus + objectiveBonus;
  }
  if (!territory.ownerId) return 5 + valueBonus + objectiveBonus;
  return null;
}

function collectMoveCandidates(state: GameState, ai: Player): MoveCandidate[] {
  const objectiveId = objectiveTerritoryId(state);
  const candidates: MoveCandidate[] = [];
  for (const unit of state.units.filter((candidate) => candidate.ownerId === ai.id && !candidate.acted)) {
    for (const to of legalDestinations(state, unit.id)) {
      const territory = state.territories.find((candidate) => candidate.id === to);
      if (!territory) continue;
      const score = scoreDestination(state, unit, territory, ai, objectiveId);
      if (score !== null) candidates.push({ unit, to, score });
    }
  }
  return candidates.sort((first, second) => second.score - first.score);
}

function chooseBestMove(state: GameState, ai: Player, difficulty: Difficulty): GameAction | null {
  const candidates = collectMoveCandidates(state, ai);
  if (candidates.length === 0) return null;
  const chosen =
    difficulty === 'citizen'
      ? candidates[Math.abs(state.rngState) % candidates.length]
      : candidates[0];
  const territory = state.territories.find((candidate) => candidate.id === chosen.to)!;
  const hostile = territory.ownerId !== undefined && territory.ownerId !== ai.id;
  return {
    type: hostile ? 'ATTACK' : 'MOVE',
    playerId: ai.id,
    unitId: chosen.unit.id,
    to: chosen.to,
  };
}

function chooseRecruit(
  state: GameState,
  ai: Player,
): { unitType: UnitType; territoryId: string } | null {
  const eligible = state.territories.filter(
    (territory) =>
      territory.ownerId === ai.id && (territory.terrain === 'city' || territory.terrain === 'port'),
  );
  if (eligible.length === 0) return null;
  const aiUnitCount = state.units.filter((unit) => unit.ownerId === ai.id).length;
  const controlledTerritories = state.territories.filter(
    (territory) => territory.ownerId === ai.id,
  ).length;
  const capacity = Math.max(eligible.length * 2, controlledTerritories);
  if (aiUnitCount >= capacity) return null;
  const affordable = (['infantry', 'cavalry', 'fleet'] as UnitType[])
    .map((unitType) => ({ unitType, cost: unitCost(ai, unitType) }))
    .filter(({ unitType, cost }) => {
      if (cost > ai.coins) return false;
      if (unitType === 'fleet') return eligible.some((territory) => territory.terrain === 'port');
      return true;
    })
    .sort((first, second) => first.cost - second.cost);
  if (affordable.length === 0) return null;
  const objectiveId = objectiveTerritoryId(state);
  const unitType = affordable[0].unitType;
  const candidateTerritories = eligible.filter(
    (territory) => unitType !== 'fleet' || territory.terrain === 'port',
  );
  if (candidateTerritories.length === 0) return null;
  const territory = [...candidateTerritories].sort((first, second) => {
    const firstStationed = state.units.filter((unit) => unit.territoryId === first.id).length;
    const secondStationed = state.units.filter((unit) => unit.territoryId === second.id).length;
    if (firstStationed !== secondStationed) return firstStationed - secondStationed;
    const firstObjective = first.id === objectiveId ? 1 : 0;
    const secondObjective = second.id === objectiveId ? 1 : 0;
    return secondObjective - firstObjective;
  })[0];
  return { unitType, territoryId: territory.id };
}

function chooseCard(state: GameState, ai: Player): { cardId: string; unitId?: string } | null {
  if (ai.hand.length === 0) return null;
  const economic = ai.hand.find((cardId) => ['merchant-fleet', 'roman-roads'].includes(cardId));
  if (economic) return { cardId: economic };
  const actedUnit = state.units.find((unit) => unit.ownerId === ai.id && unit.acted);
  if (actedUnit) return { cardId: ai.hand[0], unitId: actedUnit.id };
  return null;
}

export function chooseAIAction(state: GameState, difficulty: Difficulty): GameAction {
  const player = activePlayer(state);
  if (!player.isAI) return { type: 'END_TURN', playerId: player.id };
  const ready = startActionPhase(state);
  const ai = activePlayer(ready);

  const move = chooseBestMove(ready, ai, difficulty);
  if (move) return move;

  const recruit = chooseRecruit(ready, ai);
  if (recruit)
    return {
      type: 'RECRUIT',
      playerId: ai.id,
      unitType: recruit.unitType,
      territoryId: recruit.territoryId,
    };

  const card = chooseCard(ready, ai);
  if (card) return { type: 'PLAY_CARD', playerId: ai.id, cardId: card.cardId, unitId: card.unitId };

  if (ai.favor >= 3 && !ai.usedFavor) {
    const home = ready.territories.find((territory) => territory.ownerId === ai.id);
    if (home) return { type: 'INVOKE_FAVOR', playerId: ai.id, territoryId: home.id };
  }

  return { type: 'END_TURN', playerId: ai.id };
}

export function runAITurn(
  original: GameState,
  difficulty: Difficulty = 'strategist',
  maxActions = 24,
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
  if (activePlayer(state).id === playerId && !state.winnerId)
    state = applyAction(state, { type: 'END_TURN', playerId }).state;
  return state;
}
