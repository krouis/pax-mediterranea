import { cards, terrainRules, unitRules } from '../../content/gameContent';
import { nextRandom } from './random';
import type { ActionResult, GameAction, GameState, Player, Unit } from './types';

export function activePlayer(state: GameState): Player {
  return state.players[state.activePlayerIndex];
}

export function territoryIncome(state: GameState, playerId: string): number {
  const player = state.players.find((candidate) => candidate.id === playerId);
  let income = state.territories.reduce((sum, territory) => {
    if (territory.ownerId !== playerId) return sum;
    if (territory.major || territory.capital) return sum + 2;
    if (territory.terrain === 'city' || territory.terrain === 'port') return sum + 1;
    return sum;
  }, 0);
  if (
    player?.faction === 'carthage' &&
    state.territories.some(
      (territory) => territory.ownerId === playerId && territory.terrain === 'port',
    )
  )
    income += 1;
  return income;
}

export function legalDestinations(state: GameState, unitId: string): string[] {
  const unit = state.units.find((candidate) => candidate.id === unitId);
  if (!unit || unit.acted) return [];
  const from = state.territories.find((territory) => territory.id === unit.territoryId);
  if (!from) return [];
  return from.connections.filter((id) => {
    const destination = state.territories.find((territory) => territory.id === id);
    if (!destination) return false;
    if (unit.type === 'fleet')
      return destination.terrain === 'sea' || destination.terrain === 'port';
    return destination.terrain !== 'sea';
  });
}

export function combatPreview(
  state: GameState,
  attacker: Unit,
  territoryId: string,
): { attack: number; defense: number; outcome: 'victory' | 'defeat' | 'stalemate' } {
  const territory = state.territories.find((candidate) => candidate.id === territoryId);
  if (!territory) throw new Error('Unknown territory');
  let attack = unitRules[attacker.type].attack;
  const defenders = state.units.filter(
    (unit) => unit.territoryId === territoryId && unit.ownerId !== attacker.ownerId,
  );
  let defense = terrainRules[territory.terrain].defense;
  defense += defenders.reduce((sum, defender) => sum + unitRules[defender.type].defense, 0);
  if (attacker.type === 'cavalry' && territory.terrain === 'plains') attack += 1;
  if (attacker.type === 'cavalry' && ['hills', 'mountains', 'city'].includes(territory.terrain))
    attack -= 1;
  const outcome = attack > defense ? 'victory' : attack < defense ? 'defeat' : 'stalemate';
  return { attack, defense, outcome };
}

function fail(state: GameState, error: string): ActionResult {
  return { ok: false, state, error };
}

function addEvent(state: GameState, key: string, values?: Record<string, string | number>): void {
  state.eventLog.push({ turn: state.turn, key, values });
  state.eventLog = state.eventLog.slice(-30);
}

function advancePhase(state: GameState): void {
  const player = activePlayer(state);
  const sequence: GameState['phase'][] = ['income', 'draw', 'recruit', 'act', 'favor'];
  const index = sequence.indexOf(state.phase);
  if (state.phase === 'income') {
    const income = territoryIncome(state, player.id);
    player.coins += income;
    addEvent(state, 'game:events.income', { player: player.name, count: income });
  }
  if (state.phase === 'draw' && player.deck.length > 0 && player.hand.length < 3) {
    const card = player.deck.shift();
    if (card) player.hand.push(card);
  }
  state.phase = sequence[index + 1] ?? 'favor';
}

export function applyAction(original: GameState, action: GameAction): ActionResult {
  if (original.winnerId) return fail(original, 'game:errors.matchEnded');
  if (activePlayer(original).id !== action.playerId) return fail(original, 'game:errors.notTurn');
  const state = structuredClone(original);
  const player = activePlayer(state);

  if (action.type === 'ADVANCE_PHASE') {
    if (state.phase === 'favor') return fail(original, 'game:errors.endWhenReady');
    advancePhase(state);
    return { ok: true, state };
  }

  if (action.type === 'RECRUIT') {
    if (!['recruit', 'act'].includes(state.phase))
      return fail(original, 'game:errors.recruitUnavailable');
    const territory = state.territories.find((candidate) => candidate.id === action.territoryId);
    if (!territory || territory.ownerId !== player.id)
      return fail(original, 'game:errors.controlledTerritory');
    if (!['city', 'port'].includes(territory.terrain))
      return fail(original, 'game:errors.recruitLocation');
    if (action.unitType === 'fleet' && territory.terrain !== 'port')
      return fail(original, 'game:errors.fleetPort');
    let cost = unitRules[action.unitType].cost;
    if (player.faction === 'rome' && action.unitType === 'infantry') cost = Math.max(1, cost - 1);
    if (player.coins < cost) return fail(original, 'game:errors.coins');
    player.coins -= cost;
    state.units.push({
      id: `u${state.nextUnitId++}`,
      ownerId: player.id,
      type: action.unitType,
      territoryId: territory.id,
      acted: true,
    });
    addEvent(state, 'game:events.recruit', { player: player.name, unit: action.unitType });
    return { ok: true, state };
  }

  if (action.type === 'MOVE' || action.type === 'ATTACK') {
    if (!['act', 'favor'].includes(state.phase)) return fail(original, 'game:errors.actionPhase');
    const unit = state.units.find((candidate) => candidate.id === action.unitId);
    if (!unit || unit.ownerId !== player.id) return fail(original, 'game:errors.ownUnit');
    if (!legalDestinations(state, unit.id).includes(action.to))
      return fail(original, 'game:errors.illegalDestination');
    const destination = state.territories.find((territory) => territory.id === action.to);
    if (!destination) return fail(original, 'game:errors.unknownDestination');
    const enemyUnits = state.units.filter(
      (candidate) => candidate.territoryId === action.to && candidate.ownerId !== player.id,
    );
    const hostile =
      enemyUnits.length > 0 || (destination.ownerId && destination.ownerId !== player.id);
    if (action.type === 'MOVE' && enemyUnits.length > 0)
      return fail(original, 'game:errors.occupied');
    if (action.type === 'ATTACK' && !hostile) return fail(original, 'game:errors.noTarget');
    if (action.type === 'ATTACK') {
      const preview = combatPreview(state, unit, action.to);
      let outcome = preview.outcome;
      if (state.rules === 'classic') {
        const [roll, rngState] = nextRandom(state.rngState);
        state.rngState = rngState;
        if (Math.abs(preview.attack - preview.defense) <= 1)
          outcome = roll >= 0.5 ? 'victory' : 'defeat';
      }
      if (outcome === 'victory') {
        state.units = state.units.filter((candidate) => !enemyUnits.includes(candidate));
        unit.territoryId = action.to;
        destination.ownerId = player.id;
        player.pax += destination.major || destination.capital ? 2 : 1;
        addEvent(state, 'game:events.capture', {
          player: player.name,
          territory: destination.id,
        });
      } else if (outcome === 'defeat') {
        state.units = state.units.filter((candidate) => candidate.id !== unit.id);
        addEvent(state, 'game:events.repelled', {
          player: player.name,
          territory: destination.id,
        });
      } else {
        unit.acted = true;
        addEvent(state, 'game:events.stalemate', { territory: destination.id });
      }
    } else {
      unit.territoryId = action.to;
      if (!destination.ownerId) {
        destination.ownerId = player.id;
        player.pax += destination.major ? 2 : 1;
      }
      addEvent(state, 'game:events.move', { player: player.name, territory: destination.id });
    }
    unit.acted = true;
    if (player.pax >= 8) state.winnerId = player.id;
    return { ok: true, state };
  }

  if (action.type === 'PLAY_CARD') {
    if (!['act', 'favor'].includes(state.phase))
      return fail(original, 'game:errors.cardsUnavailable');
    if (!player.hand.includes(action.cardId)) return fail(original, 'game:errors.cardMissing');
    if (!cards[action.cardId]) return fail(original, 'game:errors.unknownCard');
    if (['merchant-fleet', 'roman-roads'].includes(action.cardId)) player.coins += 2;
    const target = state.units.find(
      (unit) => unit.id === action.unitId && unit.ownerId === player.id,
    );
    if (target) target.acted = false;
    player.hand = player.hand.filter((card) => card !== action.cardId);
    addEvent(state, 'game:events.card', { player: player.name, card: action.cardId });
    return { ok: true, state };
  }

  if (action.type === 'INVOKE_FAVOR') {
    if (!['act', 'favor'].includes(state.phase))
      return fail(original, 'game:errors.favorUnavailable');
    if (player.favor < 3 || player.usedFavor) return fail(original, 'game:errors.favorNotReady');
    const territory = state.territories.find((candidate) => candidate.id === action.territoryId);
    if (!territory || territory.ownerId !== player.id)
      return fail(original, 'game:errors.controlledTerritory');
    player.favor -= 3;
    player.usedFavor = true;
    if (['baal-hammon', 'juno'].includes(player.patron)) player.coins += 2;
    else player.pax += 1;
    addEvent(state, 'game:events.favor', { player: player.name, patron: player.patron });
    return { ok: true, state };
  }

  if (action.type === 'END_TURN') {
    state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
    if (state.activePlayerIndex === 0) state.turn += 1;
    state.phase = 'income';
    state.units.forEach((unit) => (unit.acted = false));
    activePlayer(state).usedFavor = false;
    activePlayer(state).favor = Math.min(
      3,
      activePlayer(state).favor +
        (state.territories.some(
          (territory) =>
            territory.ownerId === activePlayer(state).id && territory.terrain === 'sacred',
        )
          ? 1
          : 0),
    );
    addEvent(state, 'game:events.turnBegins', { player: activePlayer(state).name });
    return { ok: true, state };
  }

  return fail(original, 'game:errors.unsupported');
}

export function startActionPhase(state: GameState): GameState {
  let next = state;
  while (['income', 'draw', 'recruit'].includes(next.phase)) {
    next = applyAction(next, { type: 'ADVANCE_PHASE', playerId: activePlayer(next).id }).state;
  }
  return next;
}
