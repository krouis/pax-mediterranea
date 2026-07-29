export type FactionId = 'carthage' | 'rome';
export type Terrain = 'plains' | 'hills' | 'mountains' | 'city' | 'port' | 'sea' | 'sacred';
export type UnitType = 'infantry' | 'cavalry' | 'fleet';
export type Phase = 'income' | 'draw' | 'recruit' | 'act' | 'favor' | 'ended';
export type Difficulty = 'citizen' | 'merchant' | 'strategist' | 'general';

export interface Position {
  x: number;
  y: number;
}

export interface Territory {
  id: string;
  nameKey: string;
  terrain: Terrain;
  position: Position;
  connections: string[];
  ownerId?: string;
  capital?: boolean;
  major?: boolean;
}

export interface Unit {
  id: string;
  ownerId: string;
  type: UnitType;
  territoryId: string;
  acted: boolean;
}

export interface Player {
  id: string;
  name: string;
  faction: FactionId;
  patron: string;
  coins: number;
  favor: number;
  pax: number;
  hand: string[];
  deck: string[];
  usedFavor: boolean;
  isAI: boolean;
}

export interface GameEvent {
  turn: number;
  key: string;
  values?: Record<string, string | number>;
}

export interface GameState {
  schemaVersion: 2;
  id: string;
  seed: number;
  rngState: number;
  turn: number;
  activePlayerIndex: number;
  phase: Phase;
  mode: 'solo' | 'hotseat' | 'tutorial' | 'campaign';
  rules: 'competitive' | 'classic';
  players: Player[];
  territories: Territory[];
  units: Unit[];
  eventLog: GameEvent[];
  winnerId?: string;
  nextUnitId: number;
  scenarioId?: string;
}

export interface ScenarioObjective {
  type: 'controlAtTurn';
  territoryId: string;
  turn: number;
  factionId: FactionId;
}

export type GameAction =
  | { type: 'ADVANCE_PHASE'; playerId: string }
  | { type: 'RECRUIT'; playerId: string; unitType: UnitType; territoryId: string }
  | { type: 'MOVE'; playerId: string; unitId: string; to: string }
  | { type: 'ATTACK'; playerId: string; unitId: string; to: string }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string; unitId?: string }
  | { type: 'INVOKE_FAVOR'; playerId: string; territoryId: string }
  | { type: 'END_TURN'; playerId: string };

export interface ActionResult {
  ok: boolean;
  state: GameState;
  error?: string;
}
