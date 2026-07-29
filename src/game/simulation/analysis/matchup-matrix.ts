import type { PersonaId } from '../types';
import type { ExperimentMatchRecord } from '../experiment-runner';

export interface MatchupCell {
  personaA: PersonaId;
  personaB: PersonaId;
  isMirror: boolean;
  matches: number;
  winsA: number;
  winsB: number;
  draws: number;
  winRateA: number;
}

/**
 * Persona x persona win-rate matrix, keyed by unordered persona pair so seat-swapped runs of
 * the same matchup combine into one cell. Mirror cells (a persona against itself) report a
 * single win-rate that conflates "won as p1" and "won as p2" — see docs/SIMULATION-METRICS.md
 * for why that number alone should not be read as more than "someone won".
 */
export function buildMatchupMatrix(matches: ExperimentMatchRecord[]): MatchupCell[] {
  const cells = new Map<string, MatchupCell>();

  for (const match of matches) {
    const [first, second] = match.telemetry.players;
    if (!first || !second) continue;
    const [a, b] = [first, second].sort((x, y) => x.personaId.localeCompare(y.personaId));
    const key = `${a.personaId}|${b.personaId}`;
    let cell = cells.get(key);
    if (!cell) {
      cell = {
        personaA: a.personaId,
        personaB: b.personaId,
        isMirror: a.personaId === b.personaId,
        matches: 0,
        winsA: 0,
        winsB: 0,
        draws: 0,
        winRateA: 0,
      };
      cells.set(key, cell);
    }
    cell.matches += 1;
    if (!match.telemetry.winnerId) {
      cell.draws += 1;
    } else {
      const winnerPersona = match.telemetry.players.find(
        (player) => player.playerId === match.telemetry.winnerId,
      )?.personaId;
      if (winnerPersona === a.personaId && !cell.isMirror) cell.winsA += 1;
      else if (winnerPersona === b.personaId && !cell.isMirror) cell.winsB += 1;
      else if (cell.isMirror) cell.winsA += 1;
    }
  }

  for (const cell of cells.values())
    cell.winRateA = cell.matches > 0 ? cell.winsA / cell.matches : 0;
  return [...cells.values()].sort(
    (a, b) => a.personaA.localeCompare(b.personaA) || a.personaB.localeCompare(b.personaB),
  );
}
