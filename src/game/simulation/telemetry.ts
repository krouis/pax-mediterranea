import { unitRules } from '../../content/gameContent';
import type { GameAction, GameState, UnitType } from '../engine/types';
import type {
  MatchTelemetry,
  OwnershipSnapshot,
  PaxSnapshot,
  PlayerSimulationProfile,
  TerminationClassification,
  UnitValueSnapshot,
  VictoryReason,
} from './types';

function emptyUnitTypeRecord(): Record<UnitType, number> {
  return { infantry: 0, cavalry: 0, fleet: 0 };
}

/** Accumulates telemetry incrementally as a match executes. Reads only public GameState fields
 * already produced by the real rules engine; it never infers or fabricates values the engine
 * does not expose. */
export class TelemetryRecorder {
  actionsByType: Record<string, number> = {};
  actionsByPlayer: Record<string, Record<string, number>> = {};
  rejectedActionsByReason: Record<string, number> = {};

  idleHalfTurns = 0;
  currentIdleStreak = 0;
  maxConsecutiveIdleHalfTurns = 0;
  halfTurns = 0;
  actionsEvaluated = 0;

  combatCount = 0;
  attacksAttempted = 0;
  attacksWon = 0;
  attacksLost = 0;
  attacksDeclinedAsUnfavorable = 0;
  firstCombatTurn?: number;
  lastCombatTurn?: number;

  territoriesCapturedByPlayer: Record<string, number> = {};
  territoriesLostByPlayer: Record<string, number> = {};
  neutralTerritoriesCaptured = 0;
  enemyTerritoriesCaptured = 0;
  ownershipByTurn: OwnershipSnapshot[] = [];

  unitsRecruitedByPlayerAndType: Record<string, Record<UnitType, number>> = {};
  unitsLostByPlayerAndType: Record<string, Record<UnitType, number>> = {};
  unitValueByTurn: UnitValueSnapshot[] = [];

  coinsEarnedByPlayer: Record<string, number> = {};
  coinsSpentByPlayer: Record<string, number> = {};

  cardsPlayedByPlayerAndCard: Record<string, Record<string, number>> = {};
  favorsInvokedByPlayerAndFavor: Record<string, Record<string, number>> = {};

  paxByTurn: PaxSnapshot[] = [];
  leadChanges = 0;
  private lastLeader: string | undefined;
  private everBehindByPlayer: Record<string, boolean> = {};
  comebackOccurred = false;

  private readonly startTime = Date.now();

  recordDeclinedAttack(): void {
    this.attacksDeclinedAsUnfavorable += 1;
  }

  recordAction(
    playerId: string,
    action: GameAction,
    ok: boolean,
    errorReason: string | undefined,
    before: GameState,
    after: GameState,
  ): void {
    this.actionsEvaluated += 1;
    if (!ok) {
      this.rejectedActionsByReason[errorReason ?? 'unknown'] =
        (this.rejectedActionsByReason[errorReason ?? 'unknown'] ?? 0) + 1;
      return;
    }
    this.actionsByType[action.type] = (this.actionsByType[action.type] ?? 0) + 1;
    this.actionsByPlayer[playerId] ??= {};
    this.actionsByPlayer[playerId][action.type] =
      (this.actionsByPlayer[playerId][action.type] ?? 0) + 1;

    const beforePlayer = before.players.find((candidate) => candidate.id === playerId);
    const afterPlayer = after.players.find((candidate) => candidate.id === playerId);
    if (beforePlayer && afterPlayer && afterPlayer.coins > beforePlayer.coins) {
      this.coinsEarnedByPlayer[playerId] =
        (this.coinsEarnedByPlayer[playerId] ?? 0) + (afterPlayer.coins - beforePlayer.coins);
    }
    if (beforePlayer && afterPlayer && afterPlayer.coins < beforePlayer.coins) {
      this.coinsSpentByPlayer[playerId] =
        (this.coinsSpentByPlayer[playerId] ?? 0) + (beforePlayer.coins - afterPlayer.coins);
    }

    if (action.type === 'RECRUIT') {
      this.unitsRecruitedByPlayerAndType[playerId] ??= emptyUnitTypeRecord();
      this.unitsRecruitedByPlayerAndType[playerId][action.unitType] += 1;
    }

    if (action.type === 'PLAY_CARD') {
      this.cardsPlayedByPlayerAndCard[playerId] ??= {};
      this.cardsPlayedByPlayerAndCard[playerId][action.cardId] =
        (this.cardsPlayedByPlayerAndCard[playerId][action.cardId] ?? 0) + 1;
    }

    if (action.type === 'INVOKE_FAVOR') {
      const patron = afterPlayer?.patron ?? 'unknown';
      this.favorsInvokedByPlayerAndFavor[playerId] ??= {};
      this.favorsInvokedByPlayerAndFavor[playerId][patron] =
        (this.favorsInvokedByPlayerAndFavor[playerId][patron] ?? 0) + 1;
    }

    if (action.type === 'MOVE' || action.type === 'ATTACK') {
      const destinationBefore = before.territories.find((candidate) => candidate.id === action.to);
      const destinationAfter = after.territories.find((candidate) => candidate.id === action.to);
      const capturedNow =
        destinationAfter?.ownerId === playerId && destinationBefore?.ownerId !== playerId;

      if (action.type === 'ATTACK') {
        this.attacksAttempted += 1;
        this.combatCount += 1;
        this.firstCombatTurn ??= before.turn;
        this.lastCombatTurn = before.turn;
        const unitSurvived = after.units.some((unit) => unit.id === action.unitId);
        if (capturedNow || unitSurvived) this.attacksWon += 1;
        else this.attacksLost += 1;
      }

      if (capturedNow) {
        this.territoriesCapturedByPlayer[playerId] =
          (this.territoriesCapturedByPlayer[playerId] ?? 0) + 1;
        if (destinationBefore?.ownerId) {
          this.enemyTerritoriesCaptured += 1;
          this.territoriesLostByPlayer[destinationBefore.ownerId] =
            (this.territoriesLostByPlayer[destinationBefore.ownerId] ?? 0) + 1;
        } else {
          this.neutralTerritoriesCaptured += 1;
        }
      }
    }
  }

  recordUnitLosses(playerId: string, before: GameState, after: GameState): void {
    const beforeIds = new Set(
      before.units.filter((unit) => unit.ownerId === playerId).map((unit) => unit.id),
    );
    const afterIds = new Set(
      after.units.filter((unit) => unit.ownerId === playerId).map((unit) => unit.id),
    );
    for (const unit of before.units) {
      if (unit.ownerId === playerId && beforeIds.has(unit.id) && !afterIds.has(unit.id)) {
        this.unitsLostByPlayerAndType[playerId] ??= emptyUnitTypeRecord();
        this.unitsLostByPlayerAndType[playerId][unit.type] += 1;
      }
    }
  }

  recordHalfTurn(meaningfulChangeOccurred: boolean): void {
    this.halfTurns += 1;
    if (meaningfulChangeOccurred) {
      this.currentIdleStreak = 0;
    } else {
      this.idleHalfTurns += 1;
      this.currentIdleStreak += 1;
      this.maxConsecutiveIdleHalfTurns = Math.max(
        this.maxConsecutiveIdleHalfTurns,
        this.currentIdleStreak,
      );
    }
  }

  recordTurnSnapshot(state: GameState): void {
    const ownedByPlayer: Record<string, number> = {};
    let neutral = 0;
    for (const territory of state.territories) {
      if (territory.ownerId)
        ownedByPlayer[territory.ownerId] = (ownedByPlayer[territory.ownerId] ?? 0) + 1;
      else neutral += 1;
    }
    this.ownershipByTurn.push({ turn: state.turn, ownedByPlayer, neutral });

    const unitValueByPlayer: Record<string, number> = {};
    const unitCountByPlayer: Record<string, number> = {};
    for (const unit of state.units) {
      unitValueByPlayer[unit.ownerId] =
        (unitValueByPlayer[unit.ownerId] ?? 0) + unitRules[unit.type].cost;
      unitCountByPlayer[unit.ownerId] = (unitCountByPlayer[unit.ownerId] ?? 0) + 1;
    }
    this.unitValueByTurn.push({ turn: state.turn, unitValueByPlayer, unitCountByPlayer });

    const paxByPlayer: Record<string, number> = {};
    for (const player of state.players) paxByPlayer[player.id] = player.pax;
    this.paxByTurn.push({ turn: state.turn, paxByPlayer });

    if (state.players.length === 2) {
      const [a, b] = state.players;
      const leader = a.pax === b.pax ? undefined : a.pax > b.pax ? a.id : b.id;
      if (leader && this.lastLeader && leader !== this.lastLeader) this.leadChanges += 1;
      if (leader) this.lastLeader = leader;

      for (const player of state.players) {
        const opponent = state.players.find((candidate) => candidate.id !== player.id);
        if (!opponent) continue;
        if (player.pax < opponent.pax) this.everBehindByPlayer[player.id] = true;
        if (this.everBehindByPlayer[player.id] && player.pax > opponent.pax)
          this.comebackOccurred = true;
      }
    }
  }

  finalize(
    config: {
      seed: number;
      mapId: string;
      scenarioId?: string;
      players: PlayerSimulationProfile[];
      maxTurns: number;
    },
    finalState: GameState,
    finalStateHash: string,
    termination: {
      classification: TerminationClassification;
      winnerId?: string;
      victoryReason?: VictoryReason;
      repeatedStateDetected: boolean;
      repeatedStatePeriod?: number;
      equilibriumDetected: boolean;
      equilibriumTurn?: number;
    },
  ): MatchTelemetry {
    const winner = termination.winnerId
      ? finalState.players.find((candidate) => candidate.id === termination.winnerId)
      : undefined;
    const coinsUnspentAtEnd: Record<string, number> = {};
    for (const player of finalState.players) coinsUnspentAtEnd[player.id] = player.coins;

    return {
      seed: config.seed,
      mapId: config.mapId,
      scenarioId: config.scenarioId,
      players: config.players,
      winnerId: termination.winnerId,
      winningFactionId: winner?.faction,
      victoryReason: termination.victoryReason,
      completedNaturally:
        termination.classification === 'natural-victory' ||
        termination.classification === 'scenario-victory',
      terminationClassification: termination.classification,
      turns: finalState.turn,
      halfTurns: this.halfTurns,
      maxTurnsReached: finalState.turn >= config.maxTurns,
      actionsByType: this.actionsByType,
      actionsByPlayer: this.actionsByPlayer,
      rejectedActionsByReason: this.rejectedActionsByReason,
      idleHalfTurns: this.idleHalfTurns,
      idleHalfTurnRate: this.halfTurns > 0 ? this.idleHalfTurns / this.halfTurns : 0,
      maxConsecutiveIdleHalfTurns: this.maxConsecutiveIdleHalfTurns,
      firstCombatTurn: this.firstCombatTurn,
      lastCombatTurn: this.lastCombatTurn,
      combatCount: this.combatCount,
      attacksAttempted: this.attacksAttempted,
      attacksWon: this.attacksWon,
      attacksLost: this.attacksLost,
      attacksDeclinedAsUnfavorable: this.attacksDeclinedAsUnfavorable,
      territoriesCapturedByPlayer: this.territoriesCapturedByPlayer,
      territoriesLostByPlayer: this.territoriesLostByPlayer,
      neutralTerritoriesCaptured: this.neutralTerritoriesCaptured,
      enemyTerritoriesCaptured: this.enemyTerritoriesCaptured,
      ownershipByTurn: this.ownershipByTurn,
      unitsRecruitedByPlayerAndType: this.unitsRecruitedByPlayerAndType,
      unitsLostByPlayerAndType: this.unitsLostByPlayerAndType,
      unitValueByTurn: this.unitValueByTurn,
      coinsEarnedByPlayer: this.coinsEarnedByPlayer,
      coinsSpentByPlayer: this.coinsSpentByPlayer,
      coinsUnspentAtEnd,
      cardsPlayedByPlayerAndCard: this.cardsPlayedByPlayerAndCard,
      favorsInvokedByPlayerAndFavor: this.favorsInvokedByPlayerAndFavor,
      paxByTurn: this.paxByTurn,
      leadChanges: this.leadChanges,
      comebackOccurred: this.comebackOccurred,
      repeatedStateDetected: termination.repeatedStateDetected,
      repeatedStatePeriod: termination.repeatedStatePeriod,
      equilibriumDetected: termination.equilibriumDetected,
      equilibriumTurn: termination.equilibriumTurn,
      stateHashAtEnd: finalStateHash,
      wallClockMs: Date.now() - this.startTime,
      actionsEvaluated: this.actionsEvaluated,
    };
  }
}
