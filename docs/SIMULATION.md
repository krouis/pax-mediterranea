# Simulation

`src/game/simulation` is a DOM-independent, Node-runnable harness that plays real matches through
the production rules engine (`src/game/engine/rules.ts`) — the same `applyAction`,
`startActionPhase`, `legalDestinations`, and `combatPreview` the browser app and the default AI
use. It never re-derives combat, income, or victory logic, and every action it submits is executed
through `applyAction`, which remains the sole authority on legality. It has no dependency on React,
the DOM, browser storage, Playwright, or canvas, so it runs under plain `tsx`/Node.

## Architecture

- `policies/candidates.ts` proposes structurally plausible MOVE/ATTACK/RECRUIT/PLAY_CARD/
  INVOKE_FAVOR/END_TURN candidates from public state, using the same eligibility data the
  production AI and UI already read (`legalDestinations`, `unitCost`, terrain rules). It includes a
  garrison-sized recruitment cap so a persona does not spend its entire per-turn action budget
  recruiting forever — the same cap `src/game/ai/ai.ts` uses.
- `policies/scoring.ts` computes a shared set of raw, unweighted score components per candidate
  (objective progress, Pax gain, territory value, income, unit-loss risk, enemy-unit removal,
  capital/city/port threat, card/favor value, movement efficiency, defensive exposure, novelty).
- `personas/*.ts` are **weight vectors** over those same components, not eight separate algorithms
  — see [PLAYER-PERSONAS.md](PLAYER-PERSONAS.md) for the rationale and its limits.
- `policies/selection.ts` picks one candidate per decision, per skill level: `novice` samples a
  bounded, seeded subset and picks via weighted-random selection among positive-scoring options
  (`policies/errors.ts`); `competent` evaluates every legal candidate and picks the best
  deterministically; `expert` adds a bounded one-ply lookahead on only its top few candidates,
  checking whether the opponent could immediately win an attack on a newly-exposed territory
  (`policies/planning.ts`).
- `turn-runner.ts` drives one player's complete turn (income/draw/recruit via the real
  `startActionPhase`, then repeated select-and-apply until END_TURN, a forced action budget, or an
  actually-illegal action — which is always a reportable error, since every proposed candidate is
  expected to already be legal).
- `match-runner.ts` (public entry: `simulator.ts`'s `runSimulatedMatch`) loops turns until a
  winner, an illegal action, a repeated-state cycle, a stable-frontier equilibrium, or the turn cap.
- `state-hash.ts` provides three canonical projections: `hashState` (everything, for determinism
  tests), `hashMaterialState` (board + economy, excluding turn/phase bookkeeping), and
  `hashStrategicState` (territories + units + Pax only — deliberately excluding coins/hand/deck/
  favor, which is what idle-half-turn and repeated-state-cycle detection use; coins accrue every
  turn from income regardless of whether anything strategically meaningful is happening, so
  including them would mean "meaningful change" could never go false even in a genuinely frozen
  position).
- `telemetry.ts` accumulates the full metric set purely from public `GameState` fields the engine
  already produces.
- `experiment-runner.ts` expands a declarative `ExperimentDefinition` (maps, scenarios, seed range,
  persona/skill profiles, seat-swap flag) into the concrete `SimulationConfig`s it implies and runs
  them, keeping only telemetry per match — never a whole batch of full traces or final states —
  except that a match classified `illegal-action` or `simulation-error` is deterministically
  re-run once with tracing on so it stays debuggable without paying that cost for the whole batch.
- `analysis/*.ts` aggregates telemetry into `AggregateMetrics`, a persona x persona matchup matrix,
  a baseline-comparison classifier, MDA hypotheses, and JSON/CSV/Markdown reports.

## Determinism

Given identical map, scenario, player profiles, and `seed`, a match's action trace, final state
hash, and telemetry are identical across runs — see the determinism tests in
`src/game/simulation/simulator.test.ts`. Novice's execution noise and the analysis layer's own
randomness (none currently) are both seeded from `config.seed`, never from wall-clock time, and
never touch `GameState.rngState` (which is reserved for the engine's own seeded `classic`-rules
combat variance).

## Configuration

`PlayerSimulationProfile.playerId` must be `"p1"` for the first profile and `"p2"` for the second —
these are the production engine's own player ids, reused rather than re-invented; `p1` always plays
Carthage and starts at the Carthage map position, `p2` always plays Rome and starts at the Rome map
position (this matches `createGame`'s existing behavior, including a pre-existing quirk: choosing
`faction: 'rome'` for `p1` changes p1's faction _rules_ but not p1's starting _position_ — the
simulator does not paper over this, since fixing it would be a production engine change outside
this pass's scope). `mapId` is resolved through a small registry in `config.ts`
(`mediterranean-small` today; the production app has only one map). `scenarioId` is validated
against `src/content/gameContent.ts`'s `scenarios`.

## Commands

```bash
npm run simulate -- --p1 carthage:aggressor:competent --p2 rome:defender:competent --seed 42
npm run simulate:smoke                          # simulation/experiments/smoke.json
npm run simulate:baseline                       # writes simulation/baselines/current-main.json
npm run simulate:matrix -- --experiment <path> --output <prefix>
npm run simulate:compare -- --baseline <path> --experiment <path>
npm run validate:experiments                     # schema/id checks for simulation/experiments/*.json
npm run test:simulation                          # vitest run src/game/simulation
```

Run any script with `--help` for its full option list. See [simulation/README.md](../simulation/README.md)
for a quick operational walkthrough and [SIMULATION-METRICS.md](SIMULATION-METRICS.md) for every
metric's exact definition.

## CI integration

`validate.yml`'s PR job runs `validate:experiments`, `test:simulation`, `simulate:smoke`, and a
baseline comparison — all fast, deterministic, and structural-regression-only (crash, illegal
action, non-determinism, dropped-to-zero natural completion, pathological duration). It does not
fail on ordinary metric drift from a small sample. `weekly.yml` runs the larger `persona-matrix` and
`explorer-coverage` batches and uploads the generated reports as workflow artifacts; it does not
commit them automatically.

## Known limitations

- The simulator does not invoke the shipped default AI (`src/game/ai/ai.ts`) directly; personas are
  an independent, more exhaustive evaluation layer built for design research, not a mirror of the
  in-game opponent. The `baseline.json` experiment documents which persona/skill combination stands
  in for it and why.
- Difficulty here (`novice`/`competent`/`expert`) is unrelated to the production `Difficulty` type
  (`citizen`/`merchant`/`strategist`/`general`) used by `src/game/ai/ai.ts`.
- Only one map exists today, so map-level generalization claims are not yet possible — expanding the
  map (`docs/ROADMAP.md` item 2) is the natural next input to this framework, not a change to it.
- The framework measures mechanics and dynamics; it does not measure player enjoyment — see
  [MDA-EVALUATION.md](MDA-EVALUATION.md).
