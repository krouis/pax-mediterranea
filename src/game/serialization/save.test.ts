import { describe, expect, it } from 'vitest';
import { createGame } from '../engine/state';
import { deserializeGame, serializeGame } from './save';

describe('save format', () => {
  it('round trips game state', () => {
    const state = createGame({ seed: 12 });
    expect(deserializeGame(serializeGame(state)).state).toEqual(state);
  });

  it('rejects an unrecognized schema', () => {
    expect(() => deserializeGame('{"version":99}')).toThrow();
  });

  it('migrates language-bearing version 1 fields to stable version 2 keys', () => {
    const legacy = JSON.parse(serializeGame(createGame())) as {
      version: number;
      state: {
        schemaVersion: number;
        players: Array<{ name: string; faction: string }>;
        territories: Array<{ id: string; nameKey?: string; name?: string }>;
        eventLog: Array<{ turn: number; key?: string; message?: string }>;
      };
    };
    legacy.version = 1;
    legacy.state.schemaVersion = 1;
    legacy.state.players[0].name = 'Carthage';
    legacy.state.territories[0].name = 'Iberia';
    delete legacy.state.territories[0].nameKey;
    legacy.state.eventLog = [{ turn: 3, message: 'Legacy translated text' }];
    const migrated = deserializeGame(JSON.stringify(legacy));
    expect(migrated.version).toBe(2);
    expect(migrated.state.schemaVersion).toBe(2);
    expect(migrated.state.players[0].name).toBe('carthage');
    expect(migrated.state.territories[0].nameKey).toBe('content:territories.iberia');
    expect(migrated.state.eventLog[0].key).toBe('game:events.begins');
  });
});
