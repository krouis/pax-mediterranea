import { factions, quickMap } from '../../content/gameContent';
import type { FactionId, GameState, Player, Unit } from './types';

export interface GameOptions {
  mode?: GameState['mode'];
  faction?: FactionId;
  patron?: string;
  playerName?: string;
  secondPlayerName?: string;
  secondPlayerAI?: boolean;
  seed?: number;
  scenarioId?: string;
}

export function createGame(options: GameOptions = {}): GameState {
  const faction = options.faction ?? 'carthage';
  const opponent: FactionId = faction === 'carthage' ? 'rome' : 'carthage';
  const p1: Player = {
    id: 'p1',
    name: options.playerName?.slice(0, 24) || faction,
    faction,
    patron: options.patron ?? factions[faction].patrons[0],
    coins: 5,
    favor: 3,
    pax: 0,
    hand: [factions[faction].cards[0], factions[faction].cards[1]],
    deck: factions[faction].cards.slice(2),
    usedFavor: false,
    isAI: false,
  };
  const p2: Player = {
    id: 'p2',
    name: options.secondPlayerName?.slice(0, 24) || opponent,
    faction: opponent,
    patron: factions[opponent].patrons[0],
    coins: 5,
    favor: 3,
    pax: 0,
    hand: [factions[opponent].cards[0], factions[opponent].cards[1]],
    deck: factions[opponent].cards.slice(2),
    usedFavor: false,
    isAI: options.secondPlayerAI ?? options.mode !== 'hotseat',
  };
  const units: Unit[] = [
    { id: 'u1', ownerId: 'p1', type: 'infantry', territoryId: 'carthage', acted: false },
    { id: 'u2', ownerId: 'p1', type: 'fleet', territoryId: 'balearics', acted: false },
    { id: 'u3', ownerId: 'p2', type: 'infantry', territoryId: 'latium', acted: false },
    { id: 'u4', ownerId: 'p2', type: 'cavalry', territoryId: 'campania', acted: false },
  ];
  return {
    schemaVersion: 2,
    id: `game-${options.seed ?? 270}`,
    seed: options.seed ?? 270,
    rngState: options.seed ?? 270,
    turn: 1,
    activePlayerIndex: 0,
    phase: 'income',
    mode: options.mode ?? 'solo',
    rules: 'competitive',
    players: [p1, p2],
    territories: structuredClone(quickMap),
    units,
    eventLog: [{ turn: 1, key: 'game:events.begins' }],
    nextUnitId: 5,
    scenarioId: options.scenarioId,
  };
}
