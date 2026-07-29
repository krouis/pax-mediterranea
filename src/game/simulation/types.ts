import type { FactionId, GameAction, GameState, UnitType } from '../engine/types';

export type { FactionId } from '../engine/types';

/**
 * Strategic identity. Determines *what a player wants*, not how well it executes.
 * See docs/PLAYER-PERSONAS.md for the design intent and limits of each.
 */
export type PersonaId =
  | 'objective-rusher'
  | 'expansionist'
  | 'aggressor'
  | 'defender'
  | 'merchant'
  | 'naval-strategist'
  | 'opportunist'
  | 'explorer';

/** Execution quality. Determines how well a persona pursues its identity. */
export type SkillLevel = 'novice' | 'competent' | 'expert';

export interface PlayerSimulationProfile {
  playerId: string;
  factionId: FactionId;
  personaId: PersonaId;
  skillLevel: SkillLevel;
  patronId?: string;
}

export interface SimulationConfig {
  seed: number;
  mapId: string;
  scenarioId?: string;
  maxTurns: number;
  /** Half-turn (single-player-turn) action budget before a forced END_TURN. */
  maxActionsPerTurn?: number;
  players: [PlayerSimulationProfile, PlayerSimulationProfile];
  captureTrace: boolean;
  detectRepeatedStates: boolean;
  /** Half-turns of no meaningful change before declaring a stable frontier. */
  equilibriumWindow: number;
}

export const scoreComponentNames = [
  'objectiveProgress',
  'paxGain',
  'territoryValue',
  'incomeGain',
  'unitLossRisk',
  'enemyUnitRemoval',
  'capitalThreat',
  'cityThreat',
  'portValue',
  'cardValue',
  'favorValue',
  'movementEfficiency',
  'defensiveExposure',
  'novelty',
  'repetitionPenalty',
  'counterThreat',
] as const;

export type ScoreComponent = (typeof scoreComponentNames)[number];

export interface CandidateEvaluation {
  action: GameAction;
  legal: boolean;
  totalScore: number;
  scoreComponents: Partial<Record<ScoreComponent, number>>;
  rejectedReason?: string;
}

export type VictoryReason =
  'pax-threshold' | 'scenario-objective-held' | 'scenario-objective-lost' | 'max-turns-tiebreak';

export type TerminationClassification =
  | 'natural-victory'
  | 'scenario-victory'
  | 'max-turns'
  | 'repeated-state-cycle'
  | 'stable-frontier'
  | 'no-progress'
  | 'illegal-action'
  | 'simulation-error';

export interface OwnershipSnapshot {
  turn: number;
  ownedByPlayer: Record<string, number>;
  neutral: number;
}

export interface UnitValueSnapshot {
  turn: number;
  unitValueByPlayer: Record<string, number>;
  unitCountByPlayer: Record<string, number>;
}

export interface PaxSnapshot {
  turn: number;
  paxByPlayer: Record<string, number>;
}

export interface MatchTelemetry {
  seed: number;
  mapId: string;
  scenarioId?: string;

  players: PlayerSimulationProfile[];

  winnerId?: string;
  winningFactionId?: FactionId;
  victoryReason?: VictoryReason;
  completedNaturally: boolean;
  terminationClassification: TerminationClassification;

  turns: number;
  halfTurns: number;
  maxTurnsReached: boolean;

  actionsByType: Record<string, number>;
  actionsByPlayer: Record<string, Record<string, number>>;
  rejectedActionsByReason: Record<string, number>;

  idleHalfTurns: number;
  idleHalfTurnRate: number;
  maxConsecutiveIdleHalfTurns: number;

  firstCombatTurn?: number;
  lastCombatTurn?: number;
  combatCount: number;
  attacksAttempted: number;
  attacksWon: number;
  attacksLost: number;
  attacksDeclinedAsUnfavorable: number;

  territoriesCapturedByPlayer: Record<string, number>;
  territoriesLostByPlayer: Record<string, number>;
  neutralTerritoriesCaptured: number;
  enemyTerritoriesCaptured: number;
  ownershipByTurn: OwnershipSnapshot[];

  unitsRecruitedByPlayerAndType: Record<string, Record<UnitType, number>>;
  unitsLostByPlayerAndType: Record<string, Record<UnitType, number>>;
  unitValueByTurn: UnitValueSnapshot[];

  coinsEarnedByPlayer: Record<string, number>;
  coinsSpentByPlayer: Record<string, number>;
  coinsUnspentAtEnd: Record<string, number>;

  cardsPlayedByPlayerAndCard: Record<string, Record<string, number>>;
  favorsInvokedByPlayerAndFavor: Record<string, Record<string, number>>;

  paxByTurn: PaxSnapshot[];
  leadChanges: number;
  comebackOccurred: boolean;

  repeatedStateDetected: boolean;
  repeatedStatePeriod?: number;
  equilibriumDetected: boolean;
  equilibriumTurn?: number;

  stateHashAtEnd: string;

  /** Wall-clock diagnostics; not part of gameplay determinism. */
  wallClockMs: number;
  actionsEvaluated: number;
}

export interface TraceEntry {
  turn: number;
  activePlayerId: string;
  phase: string;
  action: GameAction;
  candidateCount: number;
  selectedScore: number;
  scoreComponents: Partial<Record<ScoreComponent, number>>;
  stateHashBefore: string;
  ok: boolean;
  error?: string;
  stateHashAfter: string;
  eventKeys: string[];
}

export interface SimulationTrace {
  entries: TraceEntry[];
  turnEndReasons: Record<string, string>;
}

export interface SimulationResult {
  config: SimulationConfig;
  telemetry: MatchTelemetry;
  trace?: SimulationTrace;
  finalStateHash: string;
  finalState: GameState;
}

export interface SimulationError {
  kind: 'illegal-action' | 'no-legal-action-but-no-end-turn' | 'exception' | 'non-terminating';
  message: string;
  turn: number;
  playerId: string;
}
