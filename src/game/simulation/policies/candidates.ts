import { unitRules } from '../../../content/gameContent';
import { combatPreview, legalDestinations, unitCost } from '../../engine/rules';
import type { GameAction, GameState, Player, Unit, UnitType } from '../../engine/types';

/**
 * Candidate generation reads the same structural data the production AI and UI read
 * (`legalDestinations`, `combatPreview`, `unitCost`, terrain/eligibility rules) to propose
 * plausible actions. It never re-derives combat resolution, income, or victory logic — those
 * stay exclusively in `src/game/engine/rules.ts`. Every candidate this module proposes is
 * still executed through the real `applyAction`, which is the sole authority on legality.
 */

export interface MoveCandidate {
  type: 'MOVE' | 'ATTACK';
  unit: Unit;
  to: string;
  hostile: boolean;
}

export function generateMoveCandidates(state: GameState, player: Player): MoveCandidate[] {
  const candidates: MoveCandidate[] = [];
  for (const unit of state.units.filter((u) => u.ownerId === player.id && !u.acted)) {
    for (const to of legalDestinations(state, unit.id)) {
      const territory = state.territories.find((candidate) => candidate.id === to);
      if (!territory) continue;
      const hostile = territory.ownerId !== undefined && territory.ownerId !== player.id;
      candidates.push({ type: hostile ? 'ATTACK' : 'MOVE', unit, to, hostile });
    }
  }
  return candidates;
}

export interface RecruitCandidate {
  unitType: UnitType;
  territoryId: string;
  cost: number;
}

export function generateRecruitCandidates(state: GameState, player: Player): RecruitCandidate[] {
  const eligible = state.territories.filter(
    (territory) =>
      territory.ownerId === player.id &&
      (territory.terrain === 'city' || territory.terrain === 'port'),
  );
  const candidates: RecruitCandidate[] = [];
  for (const territory of eligible) {
    for (const unitType of Object.keys(unitRules) as UnitType[]) {
      if (unitType === 'fleet' && territory.terrain !== 'port') continue;
      const cost = unitCost(player, unitType);
      if (cost > player.coins) continue;
      candidates.push({ unitType, territoryId: territory.id, cost });
    }
  }
  return candidates;
}

export interface CardCandidate {
  cardId: string;
  unitId?: string;
  economic: boolean;
}

const economicCards = new Set(['merchant-fleet', 'roman-roads']);

export function generateCardCandidates(state: GameState, player: Player): CardCandidate[] {
  const candidates: CardCandidate[] = [];
  const actedUnits = state.units.filter((unit) => unit.ownerId === player.id && unit.acted);
  for (const cardId of player.hand) {
    if (economicCards.has(cardId)) {
      candidates.push({ cardId, economic: true });
      continue;
    }
    if (actedUnits.length === 0) continue;
    for (const unit of actedUnits) candidates.push({ cardId, unitId: unit.id, economic: false });
  }
  return candidates;
}

export function generateFavorCandidate(state: GameState, player: Player): string | undefined {
  if (player.favor < 3 || player.usedFavor) return undefined;
  const home =
    state.territories.find((territory) => territory.ownerId === player.id && territory.capital) ??
    state.territories.find((territory) => territory.ownerId === player.id);
  return home?.id;
}

export function buildAction(playerId: string, candidate: ScorableCandidate): GameAction {
  switch (candidate.kind) {
    case 'move':
      return {
        type: candidate.data.type,
        playerId,
        unitId: candidate.data.unit.id,
        to: candidate.data.to,
      };
    case 'recruit':
      return {
        type: 'RECRUIT',
        playerId,
        unitType: candidate.data.unitType,
        territoryId: candidate.data.territoryId,
      };
    case 'card':
      return {
        type: 'PLAY_CARD',
        playerId,
        cardId: candidate.data.cardId,
        unitId: candidate.data.unitId,
      };
    case 'favor':
      return { type: 'INVOKE_FAVOR', playerId, territoryId: candidate.territoryId };
    case 'end':
      return { type: 'END_TURN', playerId };
  }
}

export function previewCombat(state: GameState, unit: Unit, territoryId: string) {
  return combatPreview(state, unit, territoryId);
}

export type ScorableCandidate =
  | { kind: 'move'; data: MoveCandidate }
  | { kind: 'recruit'; data: RecruitCandidate }
  | { kind: 'card'; data: CardCandidate }
  | { kind: 'favor'; territoryId: string }
  | { kind: 'end' };

/** Every structurally plausible candidate for the active player, including the always-legal
 * END_TURN fallback. Actual legality is still enforced by `applyAction` when one is chosen. */
export function collectAllCandidates(state: GameState, player: Player): ScorableCandidate[] {
  const candidates: ScorableCandidate[] = [];
  for (const data of generateMoveCandidates(state, player)) candidates.push({ kind: 'move', data });
  for (const data of generateRecruitCandidates(state, player))
    candidates.push({ kind: 'recruit', data });
  for (const data of generateCardCandidates(state, player)) candidates.push({ kind: 'card', data });
  const favorTerritoryId = generateFavorCandidate(state, player);
  if (favorTerritoryId) candidates.push({ kind: 'favor', territoryId: favorTerritoryId });
  candidates.push({ kind: 'end' });
  return candidates;
}

export function actionForCandidate(playerId: string, candidate: ScorableCandidate): GameAction {
  return buildAction(playerId, candidate);
}
