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
});
