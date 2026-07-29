import { cards, patrons } from '../../../content/gameContent';
import type { UnitType } from '../../engine/types';
import type { MatchTelemetry, PersonaId, TerminationClassification } from '../types';
import type { ExperimentMatchRecord } from '../experiment-runner';
import {
  mean,
  median,
  percentileSet,
  type PercentileSet,
  MIN_RELIABLE_SAMPLE,
} from './distributions';

export interface AggregateMetrics {
  matchCount: number;
  sampleWarning?: string;

  completionRate: number;
  naturalCompletionRate: number;

  victoryRateByFaction: Record<string, number>;
  victoryRateBySeat: { p1: number; p2: number };
  victoryRateByPersona: Partial<Record<PersonaId, number>>;
  matchesByPersona: Partial<Record<PersonaId, number>>;
  victoryRateByPatron: Record<string, number>;

  meanTurns: number;
  medianTurns: number;
  turnPercentiles: PercentileSet;

  meanIdleHalfTurnRate: number;
  medianIdleHalfTurnRate: number;

  meanTimeToFirstCombat: number | null;
  combatRatePerMatch: number;

  meanTerritoryChurn: number;
  meanLeadChanges: number;
  comebackRate: number;

  terminationRate: Partial<Record<TerminationClassification, number>>;
  stalemateRate: number;
  repeatedStateRate: number;

  recruitmentMixByType: Record<UnitType, number>;
  fleetUsageRate: number;

  cardUsageRate: Record<string, number>;
  favorUsageRate: number;
  favorUsageRateByFavor: Record<string, number>;
  unusedCardIds: string[];
  unusedFavorIds: string[];

  averageCoinsEarned: number;
  averageCoinsSpent: number;
  averageCoinsRetained: number;
  averageFinalPax: number;
}

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function sumRecord(records: Array<Record<string, number>>): Record<string, number> {
  const total: Record<string, number> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) total[key] = (total[key] ?? 0) + value;
  }
  return total;
}

export function aggregateTelemetry(matches: ExperimentMatchRecord[]): AggregateMetrics {
  const telemetries = matches.map((match) => match.telemetry);
  const matchCount = telemetries.length;
  const sampleWarning =
    matchCount < MIN_RELIABLE_SAMPLE
      ? `Sample size (${matchCount}) is below the ${MIN_RELIABLE_SAMPLE}-match threshold this project treats as reliable; treat rates and percentiles below as directional only.`
      : undefined;

  const naturalCompletions = telemetries.filter((telemetry) => telemetry.completedNaturally);

  const victoryRateByFaction: Record<string, number> = {};
  const victoryRateBySeatCounts = { p1: 0, p2: 0 };
  const victoryRateByPersonaCounts: Partial<Record<PersonaId, number>> = {};
  const matchesByPersonaCounts: Partial<Record<PersonaId, number>> = {};
  const victoryRateByPatronCounts: Record<string, number> = {};
  const patronAppearances: Record<string, number> = {};

  for (const telemetry of telemetries) {
    for (const player of telemetry.players) {
      matchesByPersonaCounts[player.personaId] =
        (matchesByPersonaCounts[player.personaId] ?? 0) + 1;
      // Patron win-rate only reflects explicitly-configured patrons; a profile that omits
      // patronId uses the engine's default and is not attributed to any single patron here.
      if (player.patronId)
        patronAppearances[player.patronId] = (patronAppearances[player.patronId] ?? 0) + 1;
    }
    if (!telemetry.winnerId) continue;
    if (telemetry.winningFactionId)
      victoryRateByFaction[telemetry.winningFactionId] =
        (victoryRateByFaction[telemetry.winningFactionId] ?? 0) + 1;
    const winner = telemetry.players.find((player) => player.playerId === telemetry.winnerId);
    if (winner) {
      if (winner.playerId === 'p1') victoryRateBySeatCounts.p1 += 1;
      else victoryRateBySeatCounts.p2 += 1;
      victoryRateByPersonaCounts[winner.personaId] =
        (victoryRateByPersonaCounts[winner.personaId] ?? 0) + 1;
      if (winner.patronId)
        victoryRateByPatronCounts[winner.patronId] =
          (victoryRateByPatronCounts[winner.patronId] ?? 0) + 1;
    }
  }

  const turns = telemetries.map((telemetry) => telemetry.turns);
  const idleRates = telemetries.map((telemetry) => telemetry.idleHalfTurnRate);
  const combatTurns = telemetries
    .map((telemetry) => telemetry.firstCombatTurn)
    .filter((turn): turn is number => turn !== undefined);

  const territoryChurn = telemetries.map((telemetry) => {
    const captured = Object.values(telemetry.territoriesCapturedByPlayer).reduce(
      (sum, value) => sum + value,
      0,
    );
    const lost = Object.values(telemetry.territoriesLostByPlayer).reduce(
      (sum, value) => sum + value,
      0,
    );
    return captured + lost;
  });

  const terminationCounts: Partial<Record<TerminationClassification, number>> = {};
  for (const telemetry of telemetries) {
    terminationCounts[telemetry.terminationClassification] =
      (terminationCounts[telemetry.terminationClassification] ?? 0) + 1;
  }
  const terminationRate: Partial<Record<TerminationClassification, number>> = {};
  for (const [key, value] of Object.entries(terminationCounts)) {
    terminationRate[key as TerminationClassification] = safeDivide(value, matchCount);
  }
  const stalemateCount =
    (terminationCounts['stable-frontier'] ?? 0) +
    (terminationCounts['repeated-state-cycle'] ?? 0) +
    (terminationCounts['no-progress'] ?? 0);

  const recruitedTotals = sumRecord(
    telemetries.flatMap((telemetry) => Object.values(telemetry.unitsRecruitedByPlayerAndType)),
  ) as Record<UnitType, number>;
  const totalRecruits = Object.values(recruitedTotals).reduce((sum, value) => sum + value, 0);
  const recruitmentMixByType: Record<UnitType, number> = {
    infantry: safeDivide(recruitedTotals.infantry ?? 0, totalRecruits),
    cavalry: safeDivide(recruitedTotals.cavalry ?? 0, totalRecruits),
    fleet: safeDivide(recruitedTotals.fleet ?? 0, totalRecruits),
  };
  const fleetUsageRate = safeDivide(
    telemetries.filter((telemetry) =>
      Object.values(telemetry.unitsRecruitedByPlayerAndType).some(
        (byType) => (byType.fleet ?? 0) > 0,
      ),
    ).length,
    matchCount,
  );

  const allCardIds = Object.keys(cards);
  const cardUsageRate: Record<string, number> = {};
  for (const cardId of allCardIds) {
    const usedInMatches = telemetries.filter((telemetry) =>
      Object.values(telemetry.cardsPlayedByPlayerAndCard).some(
        (byCard) => (byCard[cardId] ?? 0) > 0,
      ),
    ).length;
    cardUsageRate[cardId] = safeDivide(usedInMatches, matchCount);
  }
  const unusedCardIds = allCardIds.filter((cardId) => cardUsageRate[cardId] === 0);

  const allFavorIds = Object.keys(patrons);
  const favorUsageRateByFavor: Record<string, number> = {};
  for (const favorId of allFavorIds) {
    const usedInMatches = telemetries.filter((telemetry) =>
      Object.values(telemetry.favorsInvokedByPlayerAndFavor).some(
        (byFavor) => (byFavor[favorId] ?? 0) > 0,
      ),
    ).length;
    favorUsageRateByFavor[favorId] = safeDivide(usedInMatches, matchCount);
  }
  const unusedFavorIds = allFavorIds.filter((favorId) => favorUsageRateByFavor[favorId] === 0);
  const favorUsageRate = safeDivide(
    telemetries.filter(
      (telemetry) => Object.keys(telemetry.favorsInvokedByPlayerAndFavor).length > 0,
    ).length,
    matchCount,
  );

  const coinsEarned = telemetries.flatMap((telemetry) =>
    Object.values(telemetry.coinsEarnedByPlayer),
  );
  const coinsSpent = telemetries.flatMap((telemetry) =>
    Object.values(telemetry.coinsSpentByPlayer),
  );
  const coinsRetained = telemetries.flatMap((telemetry) =>
    Object.values(telemetry.coinsUnspentAtEnd),
  );
  const finalPaxValues = telemetries.flatMap((telemetry) =>
    Object.values(telemetry.paxByTurn.at(-1)?.paxByPlayer ?? {}),
  );

  const personaVictoryRate: Partial<Record<PersonaId, number>> = {};
  for (const [personaId, wins] of Object.entries(victoryRateByPersonaCounts)) {
    const played = matchesByPersonaCounts[personaId as PersonaId] ?? 0;
    personaVictoryRate[personaId as PersonaId] = safeDivide(wins, played);
  }

  const patronVictoryRate: Record<string, number> = {};
  for (const [patronId, wins] of Object.entries(victoryRateByPatronCounts)) {
    patronVictoryRate[patronId] = safeDivide(wins, patronAppearances[patronId] ?? 0);
  }

  const facetVictoryRate: Record<string, number> = {};
  for (const [faction, wins] of Object.entries(victoryRateByFaction)) {
    facetVictoryRate[faction] = safeDivide(wins, matchCount);
  }

  return {
    matchCount,
    sampleWarning,
    completionRate: safeDivide(
      telemetries.filter((telemetry) => Boolean(telemetry.winnerId)).length,
      matchCount,
    ),
    naturalCompletionRate: safeDivide(naturalCompletions.length, matchCount),
    victoryRateByFaction: facetVictoryRate,
    victoryRateBySeat: {
      p1: safeDivide(victoryRateBySeatCounts.p1, matchCount),
      p2: safeDivide(victoryRateBySeatCounts.p2, matchCount),
    },
    victoryRateByPersona: personaVictoryRate,
    matchesByPersona: matchesByPersonaCounts,
    victoryRateByPatron: patronVictoryRate,
    meanTurns: mean(turns),
    medianTurns: median(turns),
    turnPercentiles: percentileSet(turns),
    meanIdleHalfTurnRate: mean(idleRates),
    medianIdleHalfTurnRate: median(idleRates),
    meanTimeToFirstCombat: combatTurns.length > 0 ? mean(combatTurns) : null,
    combatRatePerMatch: mean(telemetries.map((telemetry) => telemetry.combatCount)),
    meanTerritoryChurn: mean(territoryChurn),
    meanLeadChanges: mean(telemetries.map((telemetry) => telemetry.leadChanges)),
    comebackRate: safeDivide(
      telemetries.filter((telemetry) => telemetry.comebackOccurred).length,
      matchCount,
    ),
    terminationRate,
    stalemateRate: safeDivide(stalemateCount, matchCount),
    repeatedStateRate: safeDivide(
      telemetries.filter((telemetry) => telemetry.repeatedStateDetected).length,
      matchCount,
    ),
    recruitmentMixByType,
    fleetUsageRate,
    cardUsageRate,
    favorUsageRate,
    favorUsageRateByFavor,
    unusedCardIds,
    unusedFavorIds,
    averageCoinsEarned: mean(coinsEarned),
    averageCoinsSpent: mean(coinsSpent),
    averageCoinsRetained: mean(coinsRetained),
    averageFinalPax: mean(finalPaxValues),
  };
}

export type { MatchTelemetry };
