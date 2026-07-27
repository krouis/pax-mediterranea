import { z } from 'zod';
import type { GameAction, GameState } from '../engine/types';

const saveSchema = z.object({
  format: z.literal('pax-mediterranea-save'),
  version: z.union([z.literal(1), z.literal(2)]),
  savedAt: z.string(),
  state: z.object({ schemaVersion: z.union([z.literal(1), z.literal(2)]) }).passthrough(),
  actions: z.array(z.unknown()).default([]),
});

export interface SaveFile {
  format: 'pax-mediterranea-save';
  version: 2;
  savedAt: string;
  state: GameState;
  actions: GameAction[];
}

export function serializeGame(state: GameState, actions: GameAction[] = []): string {
  return JSON.stringify({
    format: 'pax-mediterranea-save',
    version: 2,
    savedAt: new Date().toISOString(),
    state,
    actions,
  });
}

export function deserializeGame(json: string): SaveFile {
  const parsed = saveSchema.parse(JSON.parse(json));
  if (parsed.state.schemaVersion === 1) {
    const legacy = parsed.state as Record<string, unknown> & {
      players?: Array<Record<string, unknown>>;
      territories?: Array<Record<string, unknown>>;
      eventLog?: Array<Record<string, unknown>>;
    };
    legacy.schemaVersion = 2;
    legacy.players?.forEach((player) => {
      if (
        (player.name === 'Carthage' && player.faction === 'carthage') ||
        (player.name === 'Roman Republic' && player.faction === 'rome')
      )
        player.name = player.faction;
    });
    legacy.territories?.forEach((territory) => {
      territory.nameKey = `content:territories.${String(territory.id)}`;
      delete territory.name;
    });
    legacy.eventLog = [
      { turn: Number(legacy.eventLog?.at(-1)?.turn ?? 1), key: 'game:events.begins' },
    ];
    parsed.version = 2;
  }
  return parsed as unknown as SaveFile;
}
