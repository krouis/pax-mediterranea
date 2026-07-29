import { scenarios, unitRules } from '../../../content/gameContent';
import { previewCombat, type ScorableCandidate } from './candidates';
import type { GameState, Player, Territory } from '../../engine/types';
import type { CandidateEvaluation, ScoreComponent } from '../types';

export interface NoveltyTracker {
  actionTypeCounts: Record<string, number>;
  territoryVisitCounts: Record<string, number>;
  cardUseCounts: Record<string, number>;
}

export function createNoveltyTracker(): NoveltyTracker {
  return { actionTypeCounts: {}, territoryVisitCounts: {}, cardUseCounts: {} };
}

export function recordCandidateUsage(tracker: NoveltyTracker, candidate: ScorableCandidate): void {
  tracker.actionTypeCounts[candidate.kind] = (tracker.actionTypeCounts[candidate.kind] ?? 0) + 1;
  if (candidate.kind === 'move') {
    tracker.territoryVisitCounts[candidate.data.to] =
      (tracker.territoryVisitCounts[candidate.data.to] ?? 0) + 1;
  }
  if (candidate.kind === 'card') {
    tracker.cardUseCounts[candidate.data.cardId] =
      (tracker.cardUseCounts[candidate.data.cardId] ?? 0) + 1;
  }
}

export interface ScoringContext {
  objectiveTerritoryId?: string;
  objectiveFactionId?: string;
  novelty: NoveltyTracker;
}

export function buildScoringContext(state: GameState): ScoringContext {
  const scenario = scenarios.find((candidate) => candidate.id === state.scenarioId);
  const objective = scenario?.objective;
  return {
    objectiveTerritoryId: objective?.type === 'controlAtTurn' ? objective.territoryId : undefined,
    objectiveFactionId: objective?.type === 'controlAtTurn' ? objective.factionId : undefined,
    novelty: createNoveltyTracker(),
  };
}

function territoryBaseValue(territory: Territory): number {
  if (territory.capital) return 10;
  if (territory.major) return 5;
  if (territory.terrain === 'city' || territory.terrain === 'port') return 3;
  if (territory.terrain === 'sacred') return 3;
  return 1;
}

function territoryIncomeValue(territory: Territory): number {
  if (territory.capital || territory.major) return 2;
  if (territory.terrain === 'city' || territory.terrain === 'port') return 1;
  return 0;
}

function isObjectiveTerritory(context: ScoringContext, territoryId: string): boolean {
  return context.objectiveTerritoryId === territoryId;
}

function threatCount(state: GameState, territoryId: string, defenderId: string): number {
  const territory = state.territories.find((candidate) => candidate.id === territoryId);
  if (!territory) return 0;
  return territory.connections.filter((neighborId) => {
    const neighbor = state.territories.find((candidate) => candidate.id === neighborId);
    if (!neighbor) return false;
    return state.units.some(
      (unit) => unit.territoryId === neighborId && unit.ownerId !== defenderId,
    );
  }).length;
}

/** Raw (unweighted) score components for one candidate. Personas combine these with their own
 * weight vector; skill levels decide how many candidates and how much lookahead to apply. */
export function scoreCandidate(
  state: GameState,
  player: Player,
  candidate: ScorableCandidate,
  context: ScoringContext,
): CandidateEvaluation['scoreComponents'] {
  const components: CandidateEvaluation['scoreComponents'] = {};

  if (candidate.kind === 'move') {
    const { unit, to, type } = candidate.data;
    const territory = state.territories.find((candidateTerritory) => candidateTerritory.id === to);
    if (!territory) return components;
    const objective = isObjectiveTerritory(context, to) ? 6 : 0;

    if (type === 'ATTACK') {
      const preview = previewCombat(state, unit, to);
      if (preview.outcome !== 'victory') {
        components.unitLossRisk = preview.outcome === 'defeat' ? -8 : -3;
        return components;
      }
      const defenders = state.units.filter(
        (candidateUnit) => candidateUnit.territoryId === to && candidateUnit.ownerId !== player.id,
      );
      components.enemyUnitRemoval = defenders.reduce(
        (sum, defender) => sum + unitRules[defender.type].cost,
        0,
      );
      components.paxGain = territory.major || territory.capital ? 2 : 1;
      components.territoryValue = territoryBaseValue(territory);
      components.incomeGain = territoryIncomeValue(territory);
      components.objectiveProgress = objective;
      if (territory.capital) components.capitalThreat = 8;
      else if (territory.terrain === 'city') components.cityThreat = 4;
      if (territory.terrain === 'port') components.portValue = 3;
      components.unitLossRisk = 0;
    } else {
      const wasUnowned = !territory.ownerId;
      components.paxGain = wasUnowned ? (territory.major ? 2 : 1) : 0;
      components.territoryValue = wasUnowned ? territoryBaseValue(territory) : 0;
      components.incomeGain = wasUnowned ? territoryIncomeValue(territory) : 0;
      components.objectiveProgress = wasUnowned ? objective : 0;
      if (territory.terrain === 'port') components.portValue = wasUnowned ? 2 : 0.5;
      components.movementEfficiency = wasUnowned ? 1 : -0.5;

      if (!wasUnowned && territory.ownerId === player.id) {
        // Repositioning within friendly territory is only worth it as reinforcement of an
        // actually-empty, valuable, threatened territory — not any threatened neighbor in
        // general, and not a territory that already has a garrison. Without both the
        // "empty" and "valuable" gates, this component stays positive indefinitely (income
        // keeps producing new threats nearby) and units shuffle forever instead of settling,
        // which defeats equilibrium detection.
        const destinationGarrisoned = state.units.some(
          (candidateUnit) =>
            candidateUnit.territoryId === to && candidateUnit.ownerId === player.id,
        );
        const destinationValuable = territoryBaseValue(territory) >= 3;
        const threats = threatCount(state, to, player.id);
        components.defensiveExposure =
          !destinationGarrisoned && destinationValuable && threats > 0
            ? threats * territoryBaseValue(territory) * 0.5
            : 0;
        const sourceThreats = threatCount(state, unit.territoryId, player.id);
        const sourceTerritory = state.territories.find(
          (candidateTerritory) => candidateTerritory.id === unit.territoryId,
        );
        const sourceDefendersAfterMove = state.units.filter(
          (candidateUnit) =>
            candidateUnit.territoryId === unit.territoryId &&
            candidateUnit.ownerId === player.id &&
            candidateUnit.id !== unit.id,
        ).length;
        if (sourceTerritory && sourceDefendersAfterMove === 0 && sourceThreats > 0) {
          components.defensiveExposure =
            (components.defensiveExposure ?? 0) - territoryBaseValue(sourceTerritory) * 0.75;
        }
      }
    }

    const visits = context.novelty.territoryVisitCounts[to] ?? 0;
    components.novelty = 1 / (1 + visits);
    return components;
  }

  if (candidate.kind === 'recruit') {
    const { unitType, territoryId, cost } = candidate.data;
    const territory = state.territories.find(
      (candidateTerritory) => candidateTerritory.id === territoryId,
    );
    components.incomeGain = -cost * 0.2;
    components.territoryValue = territory ? territoryBaseValue(territory) * 0.3 : 0;
    components.portValue = unitType === 'fleet' ? 4 : 0;
    components.defensiveExposure = territory ? threatCount(state, territoryId, player.id) * 1.5 : 0;
    components.novelty = 1 / (1 + (context.novelty.actionTypeCounts.recruit ?? 0));
    return components;
  }

  if (candidate.kind === 'card') {
    const { economic, cardId } = candidate.data;
    components.cardValue = economic ? 3 : 1.5;
    components.novelty = 1 / (1 + (context.novelty.cardUseCounts[cardId] ?? 0));
    return components;
  }

  if (candidate.kind === 'favor') {
    components.favorValue = ['baal-hammon', 'juno'].includes(player.patron) ? 2 : 1.5;
    return components;
  }

  // 'end'
  return components;
}

export function totalScore(
  components: CandidateEvaluation['scoreComponents'],
  weights: Partial<Record<ScoreComponent, number>>,
): number {
  let total = 0;
  for (const key of Object.keys(components) as ScoreComponent[]) {
    const value = components[key] ?? 0;
    const weight = weights[key] ?? 1;
    total += value * weight;
  }
  return total;
}
