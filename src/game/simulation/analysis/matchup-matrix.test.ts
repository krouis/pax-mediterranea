import { describe, expect, it } from 'vitest';
import type { ExperimentMatchRecord } from '../experiment-runner';
import type { MatchTelemetry, PlayerSimulationProfile } from '../types';
import { buildMatchupMatrix } from './matchup-matrix';

function fakeMatch(
  winnerPersonaId: 'aggressor' | 'defender' | undefined,
  overrides: Partial<{
    p1Persona: 'aggressor' | 'defender';
    p2Persona: 'aggressor' | 'defender';
  }> = {},
): ExperimentMatchRecord {
  const p1: PlayerSimulationProfile = {
    playerId: 'p1',
    factionId: 'carthage',
    personaId: overrides.p1Persona ?? 'aggressor',
    skillLevel: 'competent',
  };
  const p2: PlayerSimulationProfile = {
    playerId: 'p2',
    factionId: 'rome',
    personaId: overrides.p2Persona ?? 'defender',
    skillLevel: 'competent',
  };
  const winnerId = winnerPersonaId
    ? [p1, p2].find((player) => player.personaId === winnerPersonaId)?.playerId
    : undefined;
  const telemetry = {
    players: [p1, p2],
    winnerId,
  } as MatchTelemetry;
  return { matchId: 'fake', mapId: 'mediterranean-small', seed: 1, telemetry };
}

describe('buildMatchupMatrix', () => {
  it('combines a persona pair into one cell regardless of which seat each played', () => {
    const matches = [
      fakeMatch('aggressor', { p1Persona: 'aggressor', p2Persona: 'defender' }),
      fakeMatch('aggressor', { p1Persona: 'defender', p2Persona: 'aggressor' }),
    ];
    const matrix = buildMatchupMatrix(matches);
    expect(matrix).toHaveLength(1);
    const [cell] = matrix;
    expect(cell.matches).toBe(2);
    expect(cell.winsA + cell.winsB).toBe(2);
    // Both wins belong to "aggressor", whichever alphabetical slot (A or B) it landed in.
    const aggressorWins = cell.personaA === 'aggressor' ? cell.winsA : cell.winsB;
    expect(aggressorWins).toBe(2);
  });

  it('counts a match with no winner as a draw', () => {
    const matrix = buildMatchupMatrix([fakeMatch(undefined)]);
    expect(matrix[0].draws).toBe(1);
    expect(matrix[0].winsA + matrix[0].winsB).toBe(0);
  });

  it('marks a same-persona pairing as a mirror', () => {
    const matrix = buildMatchupMatrix([
      fakeMatch('aggressor', { p1Persona: 'aggressor', p2Persona: 'aggressor' }),
    ]);
    expect(matrix[0].isMirror).toBe(true);
  });

  it('every cell is internally consistent (wins + draws == matches)', () => {
    const matches = [
      fakeMatch('aggressor'),
      fakeMatch('defender'),
      fakeMatch(undefined),
      fakeMatch('aggressor', { p1Persona: 'aggressor', p2Persona: 'aggressor' }),
    ];
    for (const cell of buildMatchupMatrix(matches)) {
      expect(cell.winsA + cell.winsB + cell.draws).toBe(cell.matches);
      expect(cell.winRateA).toBeCloseTo(cell.matches > 0 ? cell.winsA / cell.matches : 0);
    }
  });
});
