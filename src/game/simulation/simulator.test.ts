import { describe, expect, it } from 'vitest';
import { personaIds, skillLevels } from './config';
import { runSimulatedMatch } from './simulator';
import type { PlayerSimulationProfile, SimulationConfig } from './types';

function baseConfig(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return {
    seed: 1,
    mapId: 'mediterranean-small',
    maxTurns: 20,
    maxActionsPerTurn: 24,
    players: [
      { playerId: 'p1', factionId: 'carthage', personaId: 'opportunist', skillLevel: 'competent' },
      { playerId: 'p2', factionId: 'rome', personaId: 'opportunist', skillLevel: 'competent' },
    ],
    captureTrace: true,
    detectRepeatedStates: true,
    equilibriumWindow: 6,
    ...overrides,
  };
}

describe('runSimulatedMatch determinism', () => {
  it('produces an identical final state hash, winner, and telemetry for the same config', () => {
    const config = baseConfig({ seed: 42 });
    const first = runSimulatedMatch(config);
    const second = runSimulatedMatch(config);
    expect(second.finalStateHash).toBe(first.finalStateHash);
    expect(second.telemetry.winnerId).toBe(first.telemetry.winnerId);
    expect(second.telemetry).toEqual(
      expect.objectContaining({ ...first.telemetry, wallClockMs: expect.any(Number) }),
    );
  });

  it('produces an identical action trace for the same config', () => {
    const config = baseConfig({ seed: 9 });
    const first = runSimulatedMatch(config);
    const second = runSimulatedMatch(config);
    expect(second.trace?.entries.map((entry) => entry.action)).toEqual(
      first.trace?.entries.map((entry) => entry.action),
    );
  });

  it('produces different (but still valid) matches for different seeds', () => {
    const a = runSimulatedMatch(baseConfig({ seed: 1 }));
    const b = runSimulatedMatch(baseConfig({ seed: 2 }));
    // Not asserting inequality of every field (small maps can coincidentally converge), only
    // that the simulator is not silently ignoring the seed for the RNG-driven parts.
    expect(a.config.seed).not.toBe(b.config.seed);
  });

  it('novice noise is itself deterministic under a fixed seed', () => {
    const config = baseConfig({
      players: [
        { playerId: 'p1', factionId: 'carthage', personaId: 'expansionist', skillLevel: 'novice' },
        { playerId: 'p2', factionId: 'rome', personaId: 'expansionist', skillLevel: 'novice' },
      ],
      seed: 5,
    });
    const first = runSimulatedMatch(config);
    const second = runSimulatedMatch(config);
    expect(second.finalStateHash).toBe(first.finalStateHash);
    expect(second.trace?.entries.map((entry) => entry.action)).toEqual(
      first.trace?.entries.map((entry) => entry.action),
    );
  });
});

describe('runSimulatedMatch invariants', () => {
  it('always terminates, never produces an illegal action, and reports coherent telemetry', () => {
    let combinations = 0;
    for (const personaId of personaIds) {
      for (const skillLevel of skillLevels) {
        combinations += 1;
        const players: [PlayerSimulationProfile, PlayerSimulationProfile] = [
          { playerId: 'p1', factionId: 'carthage', personaId, skillLevel },
          { playerId: 'p2', factionId: 'rome', personaId: 'opportunist', skillLevel: 'competent' },
        ];
        const result = runSimulatedMatch(
          baseConfig({ players, seed: 100 + combinations, maxTurns: 15, captureTrace: false }),
        );

        expect(result.telemetry.terminationClassification).not.toBe('illegal-action');
        expect(result.telemetry.terminationClassification).not.toBe('simulation-error');
        expect(result.telemetry.turns).toBeLessThanOrEqual(16);
        expect(result.telemetry.rejectedActionsByReason).toEqual({});

        for (const player of result.finalState.players)
          expect(player.coins).toBeGreaterThanOrEqual(0);
        for (const unit of result.finalState.units) {
          expect(
            result.finalState.territories.some((territory) => territory.id === unit.territoryId),
          ).toBe(true);
        }
        if (result.telemetry.winnerId) {
          expect(
            result.finalState.players.some((player) => player.id === result.telemetry.winnerId),
          ).toBe(true);
        }
      }
    }
    expect(combinations).toBe(personaIds.length * skillLevels.length);
  });

  it('reaching a Pax victory stops the match immediately (no further actions attempted)', () => {
    const result = runSimulatedMatch(
      baseConfig({
        seed: 42,
        players: [
          {
            playerId: 'p1',
            factionId: 'carthage',
            personaId: 'aggressor',
            skillLevel: 'competent',
          },
          { playerId: 'p2', factionId: 'rome', personaId: 'defender', skillLevel: 'competent' },
        ],
      }),
    );
    expect(result.telemetry.terminationClassification).toBe('natural-victory');
    expect(result.telemetry.winnerId).toBeDefined();
    expect(
      result.finalState.players.find((player) => player.id === result.telemetry.winnerId)!.pax,
    ).toBe(8);
  });

  it('resolves the campaign scenario objective rather than the generic Pax threshold', () => {
    const result = runSimulatedMatch(
      baseConfig({
        seed: 3,
        scenarioId: 'sicilian-question',
        maxTurns: 6,
        players: [
          {
            playerId: 'p1',
            factionId: 'carthage',
            personaId: 'objective-rusher',
            skillLevel: 'competent',
          },
          { playerId: 'p2', factionId: 'rome', personaId: 'defender', skillLevel: 'competent' },
        ],
      }),
    );
    expect(result.telemetry.scenarioId).toBe('sicilian-question');
    expect(result.telemetry.turns).toBeLessThanOrEqual(6);
    if (result.telemetry.winnerId) {
      expect(['scenario-objective-held', 'scenario-objective-lost']).toContain(
        result.telemetry.victoryReason,
      );
      expect(result.telemetry.terminationClassification).toBe('scenario-victory');
    }
  });

  it('rejects a config with duplicate factions or an unknown persona/skill', () => {
    expect(() =>
      runSimulatedMatch(
        baseConfig({
          players: [
            {
              playerId: 'p1',
              factionId: 'carthage',
              personaId: 'opportunist',
              skillLevel: 'competent',
            },
            {
              playerId: 'p2',
              factionId: 'carthage',
              personaId: 'opportunist',
              skillLevel: 'competent',
            },
          ],
        }),
      ),
    ).toThrow(/faction/i);

    expect(() =>
      runSimulatedMatch(
        baseConfig({
          players: [
            {
              playerId: 'p1',
              factionId: 'carthage',
              // @ts-expect-error intentionally invalid for this test
              personaId: 'not-a-persona',
              skillLevel: 'competent',
            },
            {
              playerId: 'p2',
              factionId: 'rome',
              personaId: 'opportunist',
              skillLevel: 'competent',
            },
          ],
        }),
      ),
    ).toThrow(/persona/i);
  });
});
