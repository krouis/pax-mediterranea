import { z } from 'zod';
import type { GameAction, GameState } from '../engine/types';

const saveSchema = z.object({
  format: z.literal('pax-mediterranea-save'),
  version: z.literal(1),
  savedAt: z.string(),
  state: z.object({ schemaVersion: z.literal(1) }).passthrough(),
  actions: z.array(z.unknown()).default([]),
});

export interface SaveFile {
  format: 'pax-mediterranea-save';
  version: 1;
  savedAt: string;
  state: GameState;
  actions: GameAction[];
}

export function serializeGame(state: GameState, actions: GameAction[] = []): string {
  return JSON.stringify({
    format: 'pax-mediterranea-save',
    version: 1,
    savedAt: new Date().toISOString(),
    state,
    actions,
  });
}

export function deserializeGame(json: string): SaveFile {
  const parsed = saveSchema.parse(JSON.parse(json));
  return parsed as unknown as SaveFile;
}
