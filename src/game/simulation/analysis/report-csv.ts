import type { ExperimentMatchRecord } from '../experiment-runner';
import type { AggregateMetrics } from './aggregate';
import type { MatchupCell } from './matchup-matrix';

function csvCell(value: string | number | boolean | undefined): string {
  const text = value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(cells: Array<string | number | boolean | undefined>): string {
  return cells.map(csvCell).join(',');
}

function csvTable(
  header: string[],
  rows: Array<Array<string | number | boolean | undefined>>,
): string {
  return [csvRow(header), ...rows.map((row) => csvRow(row))].join('\n') + '\n';
}

export function buildMatchSummaryCsv(matches: ExperimentMatchRecord[]): string {
  const header = [
    'matchId',
    'seed',
    'mapId',
    'scenarioId',
    'p1Persona',
    'p1Skill',
    'p2Persona',
    'p2Skill',
    'winnerId',
    'winningFactionId',
    'terminationClassification',
    'turns',
    'halfTurns',
    'idleHalfTurnRate',
    'combatCount',
    'territoriesCaptured',
    'leadChanges',
    'comebackOccurred',
  ];
  const rows = matches.map((match) => {
    const [p1, p2] = match.telemetry.players;
    const captured = Object.values(match.telemetry.territoriesCapturedByPlayer).reduce(
      (sum, value) => sum + value,
      0,
    );
    return [
      match.matchId,
      match.seed,
      match.mapId,
      match.scenarioId ?? '',
      p1?.personaId ?? '',
      p1?.skillLevel ?? '',
      p2?.personaId ?? '',
      p2?.skillLevel ?? '',
      match.telemetry.winnerId ?? '',
      match.telemetry.winningFactionId ?? '',
      match.telemetry.terminationClassification,
      match.telemetry.turns,
      match.telemetry.halfTurns,
      match.telemetry.idleHalfTurnRate,
      match.telemetry.combatCount,
      captured,
      match.telemetry.leadChanges,
      match.telemetry.comebackOccurred,
    ];
  });
  return csvTable(header, rows);
}

export function buildMatchupMatrixCsv(matrix: MatchupCell[]): string {
  const header = [
    'personaA',
    'personaB',
    'isMirror',
    'matches',
    'winsA',
    'winsB',
    'draws',
    'winRateA',
  ];
  const rows = matrix.map((cell) => [
    cell.personaA,
    cell.personaB,
    cell.isMirror,
    cell.matches,
    cell.winsA,
    cell.winsB,
    cell.draws,
    cell.winRateA.toFixed(3),
  ]);
  return csvTable(header, rows);
}

export function buildFactionWinRateCsv(metrics: AggregateMetrics): string {
  const header = ['faction', 'winRate'];
  const rows = Object.entries(metrics.victoryRateByFaction).map(([faction, rate]) => [
    faction,
    rate.toFixed(3),
  ]);
  return csvTable(header, rows);
}

export function buildActionUsageCsv(matches: ExperimentMatchRecord[]): string {
  const totals: Record<string, number> = {};
  for (const match of matches) {
    for (const [type, count] of Object.entries(match.telemetry.actionsByType)) {
      totals[type] = (totals[type] ?? 0) + count;
    }
  }
  const header = ['actionType', 'totalCount', 'averagePerMatch'];
  const rows = Object.entries(totals).map(([type, count]) => [
    type,
    count,
    (count / Math.max(1, matches.length)).toFixed(2),
  ]);
  return csvTable(header, rows);
}

export function buildContentUsageCsv(metrics: AggregateMetrics): string {
  const header = ['contentType', 'contentId', 'usageRate'];
  const rows: Array<Array<string | number>> = [
    ...Object.entries(metrics.cardUsageRate).map(([cardId, rate]) => [
      'card',
      cardId,
      rate.toFixed(3),
    ]),
    ...Object.entries(metrics.favorUsageRateByFavor).map(([favorId, rate]) => [
      'favor',
      favorId,
      rate.toFixed(3),
    ]),
  ];
  return csvTable(header, rows);
}

export interface CsvReportSet {
  matchSummary: string;
  matchupMatrix: string;
  factionWinRate: string;
  actionUsage: string;
  contentUsage: string;
}

export function buildCsvReports(
  matches: ExperimentMatchRecord[],
  metrics: AggregateMetrics,
  matrix: MatchupCell[],
): CsvReportSet {
  return {
    matchSummary: buildMatchSummaryCsv(matches),
    matchupMatrix: buildMatchupMatrixCsv(matrix),
    factionWinRate: buildFactionWinRateCsv(metrics),
    actionUsage: buildActionUsageCsv(matches),
    contentUsage: buildContentUsageCsv(metrics),
  };
}
