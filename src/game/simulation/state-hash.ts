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
function fnv1a(json: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function hashState(state: GameState): string {
  return fnv1a(JSON.stringify(canonicalizeState(state)));
}

/**
 * Hash of only the "material" (board/economy) fields — territories, units, and player
 * resources — excluding whose turn it is, the phase, and rngState. Two snapshots taken at the
 * same point in consecutive turns (e.g. "start of this player's turn" vs "start of their next
 * turn") hash equal here iff nothing about the board or economy actually changed, which is
 * exactly what half-turn idle/meaningful-change detection needs; `hashState` above is too
 * strict for that purpose since turn/activePlayerIndex always differ.
 */
export function hashMaterialState(state: GameState): string {
  const canonical = canonicalizeState(state);
  const { turn, activePlayerIndex, phase, rngState, ...material } = canonical;
  void turn;
  void activePlayerIndex;
  void phase;
  void rngState;
  return fnv1a(JSON.stringify(material));
}

/**
 * Narrower than `hashMaterialState`: territory ownership, units, Pax, and winner only —
 * deliberately excludes coins, hand, deck, and favor. Coins in particular accrue every turn from
 * income regardless of whether anything strategically meaningful is happening, so including them
 * would mean "meaningful change" (and therefore equilibrium/repeated-state detection) could
 * never fire even in a genuinely frozen position. This is the hash idle-half-turn and
 * repeated-state-cycle detection use; `hashMaterialState`/`hashState` remain available for
 * determinism tests and anything that needs the full board+economy picture.
 */
export function hashStrategicState(state: GameState): string {
  const canonical = canonicalizeState(state);
  const strategic = {
    winnerId: canonical.winnerId,
    territories: canonical.territories,
    units: canonical.units,
    pax: canonical.players.map((player) => ({ id: player.id, pax: player.pax })),
  };
  return fnv1a(JSON.stringify(strategic));
}
