import type { GameState } from '../engine/types';

/**
 * Canonical, gameplay-only projection of a GameState, used for hashing and equivalence
 * checks. Deliberately excludes:
 *  - `id` (a synthetic `game-${seed}` label, redundant with `seed`);
 *  - `eventLog` (a display/log concern that grows every turn regardless of whether anything
 *    strategically meaningful happened — e.g. income/turn-begin events — so including it would
 *    make repeated-state and equilibrium detection impossible: no two turns would ever hash
 *    equal even in a genuinely frozen position).
 * Everything that can affect legality, scoring, or outcome is included.
 */
export interface CanonicalState {
  turn: number;
  activePlayerIndex: number;
  phase: string;
  mode: string;
  rules: string;
  scenarioId?: string;
  winnerId?: string;
  nextUnitId: number;
  rngState: number;
  players: Array<{
    id: string;
    faction: string;
    patron: string;
    coins: number;
    favor: number;
    pax: number;
    hand: string[];
    deck: string[];
    usedFavor: boolean;
  }>;
  territories: Array<{ id: string; ownerId: string | null }>;
  units: Array<{
    id: string;
    ownerId: string;
    type: string;
    territoryId: string;
    acted: boolean;
  }>;
}

export function canonicalizeState(state: GameState): CanonicalState {
  return {
    turn: state.turn,
    activePlayerIndex: state.activePlayerIndex,
    phase: state.phase,
    mode: state.mode,
    rules: state.rules,
    scenarioId: state.scenarioId,
    winnerId: state.winnerId,
    nextUnitId: state.nextUnitId,
    rngState: state.rngState,
    players: [...state.players]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((player) => ({
        id: player.id,
        faction: player.faction,
        patron: player.patron,
        coins: player.coins,
        favor: player.favor,
        pax: player.pax,
        hand: [...player.hand],
        deck: [...player.deck],
        usedFavor: player.usedFavor,
      })),
    territories: [...state.territories]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((territory) => ({ id: territory.id, ownerId: territory.ownerId ?? null })),
    units: [...state.units]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((unit) => ({
        id: unit.id,
        ownerId: unit.ownerId,
        type: unit.type,
        territoryId: unit.territoryId,
        acted: unit.acted,
      })),
  };
}

/**
 * Deterministic, dependency-free FNV-1a hash (32-bit, hex-encoded) over the canonical JSON
 * projection of a state. Not cryptographic — only used for cheap equivalence/repetition
 * detection within and across simulation runs.
 */
export function hashState(state: GameState): string {
  const json = JSON.stringify(canonicalizeState(state));
  let hash = 0x811c9dc5;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
