import { runAITurn } from '../src/game/ai/ai';
import { activePlayer, applyAction, startActionPhase } from '../src/game/engine/rules';
import { createGame } from '../src/game/engine/state';

const matches = Number(process.env.PAX_SIM_MATCHES ?? 50);
let completed = 0;
let naturalCompletions = 0;
let totalTurns = 0;
let illegalStates = 0;
let netUnitDelta = 0;
let idleHalfTurns = 0;
let totalHalfTurns = 0;

for (let index = 0; index < matches; index += 1) {
  let state = createGame({ seed: index + 1, secondPlayerAI: true });
  state.players[0].isAI = true;
  for (let step = 0; step < 100 && !state.winnerId; step += 1) {
    state = startActionPhase(state);
    const before = state;
    state = runAITurn(state, index % 2 ? 'merchant' : 'strategist');
    totalHalfTurns += 1;
    if (JSON.stringify(before.units) === JSON.stringify(state.units)) idleHalfTurns += 1;
    netUnitDelta += state.units.length - before.units.length;
    if (state.units.some((unit) => !state.territories.some(({ id }) => id === unit.territoryId)))
      illegalStates += 1;
    if (activePlayer(state).id === 'p1' && !state.players[0].isAI)
      state = applyAction(state, { type: 'END_TURN', playerId: 'p1' }).state;
    if (state.winnerId) naturalCompletions += 1;
    if (state.turn >= 20 && !state.winnerId) {
      state.winnerId = [...state.players].sort(
        (first, second) => second.pax - first.pax || second.coins - first.coins,
      )[0].id;
    }
  }
  if (state.winnerId) completed += 1;
  totalTurns += state.turn;
}

const report = {
  matches,
  completed,
  naturalCompletions,
  averageTurns: Number((totalTurns / matches).toFixed(1)),
  stalemateRate: Number(((matches - completed) / matches).toFixed(2)),
  idleHalfTurnRate: Number((idleHalfTurns / totalHalfTurns).toFixed(2)),
  netUnitDelta,
  illegalStates,
};
console.log(JSON.stringify(report, null, 2));
if (illegalStates > 0 || report.stalemateRate > 0.2) process.exitCode = 1;
