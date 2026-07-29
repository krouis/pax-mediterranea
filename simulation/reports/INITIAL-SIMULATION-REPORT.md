# Initial Simulation Report

This is the first design-analysis measurement of Pax Mediterranea produced by the deterministic
simulation engine (`src/game/simulation`, see [`docs/SIMULATION.md`](../../docs/SIMULATION.md)).
It synthesizes four experiment runs (smoke, baseline, persona-matrix, explorer-coverage) taken
against the same commit, before any mechanics change. Per-run detail lives in the individual
`.json`/`.md`/`.csv` files this run produced locally (not committed — see
[`simulation/README.md`](../README.md) for what is and is not kept); the numbers quoted below are
reproduced directly from those runs so this document stands on its own.

**Do not read this report as a verdict that the game is fun, balanced, or ready for release.** It
identifies measurable dynamics and one clear regression-worthy signal; player enjoyment still
requires structured human playtesting — see
[`docs/MDA-EVALUATION.md`](../../docs/MDA-EVALUATION.md).

## 1. Implementation summary

A production-quality, deterministic, headless simulation and design-analysis engine now exists as
a permanent part of the repository:

- Runs real matches through the production rules engine (`applyAction`, `startActionPhase`,
  `legalDestinations`, `combatPreview`) — no duplicated or bypassed rules.
- Configurable player identities (8 personas) crossed with configurable execution quality
  (3 skill levels), seeded and fully deterministic.
- Full telemetry (actions, combat, territory, economy, recruitment, cards/favors, Pax-by-turn,
  lead changes, comebacks), state hashing, and repeated-state/equilibrium detection.
- A data-driven experiment runner, aggregate-statistics and persona-matchup-matrix analysis,
  MDA-hypothesis generation, JSON/CSV/Markdown reporting, and baseline-comparison tooling with a
  documented CI-failure policy (structural regressions only).
- Four stable CLI entry points (`simulate`, `simulate:baseline`, `simulate:matrix`,
  `simulate:compare`) plus `validate:experiments` and `test:simulation`.
- CI integration: a fast smoke+baseline-compare check on every PR (`validate.yml`), and a larger
  scheduled persona-matrix + explorer-coverage batch (`weekly.yml`), both report-artifact-only —
  neither blocks or is required by GitHub Pages deployment.
- 132 unit tests across 24 files under `src/game/simulation`, covering determinism, invariants,
  persona/skill behavioral differentiation, state hashing, equilibrium/repeated-state detection,
  aggregation, matchup-matrix construction, baseline-comparison severity classification, and the
  full report pipeline (asserting no `NaN`/`Infinity`/`undefined` in any output, including
  degenerate single-match and empty-sample edge cases).

See [`docs/SIMULATION.md`](../../docs/SIMULATION.md) for the module-by-module architecture.

## 2. Persona definitions

Eight personas, each a weight vector over a shared set of raw score components (not eight separate
algorithms — see [`docs/PLAYER-PERSONAS.md`](../../docs/PLAYER-PERSONAS.md) for the full rationale
and, for each persona, what must _not_ be concluded from its results): `objective-rusher`,
`expansionist`, `aggressor`, `defender`, `merchant`, `naval-strategist`, `opportunist` (the
no-bias baseline), `explorer` (content-reachability probe, not a competitive persona).

## 3. Skill-level behavior

`novice` samples a bounded, seeded subset of legal candidates and picks via weighted-random
selection among positive-scoring options — never a negative-scoring one. `competent` evaluates
every legal candidate and picks the best deterministically. `expert` adds a bounded one-ply
lookahead on its top few candidates, checking whether the chosen action would let the opponent
immediately win an attack on a newly-exposed territory. A dedicated test
(`src/game/simulation/policies/skill-levels.test.ts`) proves this with a crafted position: moving a
capital's sole defender to capture an enticing but unrelated territory scores well on immediate
components alone, and only `expert` attaches a nonzero `counterThreat` penalty for the resulting
exposure — `competent`'s identical evaluation of the same candidate does not.

## 4. Experiment definitions

| Experiment               | Matches | Seeds                 | Purpose                                                                        |
| ------------------------ | ------- | --------------------- | ------------------------------------------------------------------------------ |
| `smoke.json`             | 10      | 5 (seat-swapped)      | Fast CI structural-regression gate                                             |
| `baseline.json`          | 100     | 50                    | First measurement of the unchanged game (`opportunist` mirror, both scenarios) |
| `persona-matrix.json`    | 280     | 5/pair (seat-swapped) | Full 8-persona cross matchup matrix at `competent` skill                       |
| `explorer-coverage.json` | 30      | 15 (seat-swapped)     | Content reachability (explorer vs opportunist)                                 |

`baseline.json`'s description documents explicitly why it uses `opportunist` rather than the
shipped default AI: the simulator does not invoke `src/game/ai/ai.ts` directly (a separate, simpler
heuristic tuned for real-time play), so `opportunist` — every score component at its default
weight — stands in as the closest unbiased generalist.

## 5. Test results

- `npm run check` (format, lint, typecheck, coverage, content/i18n validation, build): **pass**.
  Coverage 92.75% statements / 84.17% branches / 97.64% functions / 94.71% lines — above the
  85/80/85/85 thresholds.
- `npm run test:integration`: **1/1 pass**. `npm run test:e2e -- --project=chromium`: **30/30
  pass** — the existing game test suite is unaffected by this work.
- `npm run test:simulation`: **132/132 pass** (part of the 24-file, 1366-statement
  `src/game/simulation` coverage above).
- `npm run validate:experiments`: **4/4 experiment definitions valid**.
- Bundle check: the production `dist/assets/*.js` bundle is byte-identical in size before and after
  this work (`grep` for simulation-only identifiers like `objective-rusher` and
  `runSimulatedMatch` against `dist/assets/*.js` finds nothing) — confirming the simulation layer
  never ships to the browser, since nothing under `src/app`/`src/ui` imports it.

## 6. Performance

- Smoke (10 matches): 70ms, ~143 matches/sec.
- Baseline (100 matches): 551ms, ~182 matches/sec.
- Persona matrix (280 matches): 1.31s, ~214 matches/sec.
- Explorer coverage (30 matches): 158ms, ~190 matches/sec.

All comfortably within normal CI limits; no browser startup cost, no unbounded trace retention
(traces are off by default for batches and only captured for illegal-action/simulation-error
outliers, of which there were zero across all 420 matches run for this report).

## 7. Structural health

Across all 420 matches simulated for this report (smoke + baseline + persona-matrix +
explorer-coverage): **zero illegal actions, zero simulation errors, zero rejected-action
reasons**. Every simulated candidate was legal every time it was submitted to the real engine.

## 8. Current baseline statistics

`baseline.json` (100 matches, `opportunist` vs `opportunist`, both the generic-Pax and _Sicilian
Question_ scenarios, seeds 1–50):

- Natural/scenario completion: 50.0%; the remaining 50.0% classified `repeated-state-cycle`.
- Mean match length 4.5 turns (median 4, p90 5) — very short relative to the 30-turn cap.
- Mean idle-half-turn rate 6.3%; mean combats per match 7.0; mean territory churn 19.5.
- All six cards played in every match that reached a point where they were usable; `baal-hammon`
  and `jupiter` favors used in 100% of matches, `tanit`/`juno` in 0% — fully explained by every
  profile in this experiment omitting `patronId` (which defaults to the first patron per faction,
  `baal-hammon`/`jupiter`) rather than evidence that `tanit`/`juno` are unreachable; see Limitations.
- **Seat/faction win rate: Carthage (p1) 50.0%, Rome (p2) 0.0%** (the remaining matches were
  draws/stalemates). See §10.

## 9. Persona matchup matrix

`persona-matrix.json` (280 matches, every distinct-persona pair once, seat-swapped, 5 seeds/pair,
`competent` skill). Structural health: 0 illegal actions, 0 errors. Full matrix (persona A/B sorted
alphabetically, win counts summed across both seat orderings):

| Persona A        | Persona B        | Matches | A wins | B wins | Draws |
| ---------------- | ---------------- | ------- | ------ | ------ | ----- |
| aggressor        | defender         | 10      | 5      | 5      | 0     |
| aggressor        | expansionist     | 10      | 5      | 0      | 5     |
| aggressor        | explorer         | 10      | 0      | 5      | 5     |
| aggressor        | merchant         | 10      | 0      | 5      | 5     |
| aggressor        | naval-strategist | 10      | 10     | 0      | 0     |
| aggressor        | objective-rusher | 10      | 5      | 5      | 0     |
| aggressor        | opportunist      | 10      | 5      | 5      | 0     |
| defender         | expansionist     | 10      | 5      | 0      | 5     |
| defender         | explorer         | 10      | 5      | 5      | 0     |
| defender         | merchant         | 10      | 0      | 5      | 5     |
| defender         | naval-strategist | 10      | 10     | 0      | 0     |
| defender         | objective-rusher | 10      | 5      | 5      | 0     |
| defender         | opportunist      | 10      | 5      | 5      | 0     |
| expansionist     | explorer         | 10      | 0      | 5      | 5     |
| expansionist     | merchant         | 10      | 0      | 5      | 5     |
| expansionist     | naval-strategist | 10      | 0      | 5      | 5     |
| expansionist     | objective-rusher | 10      | 0      | 5      | 5     |
| expansionist     | opportunist      | 10      | 0      | 5      | 5     |
| explorer         | merchant         | 10      | 0      | 5      | 5     |
| explorer         | naval-strategist | 10      | 5      | 5      | 0     |
| explorer         | objective-rusher | 10      | 5      | 0      | 5     |
| explorer         | opportunist      | 10      | 5      | 0      | 5     |
| merchant         | naval-strategist | 10      | 5      | 0      | 5     |
| merchant         | objective-rusher | 10      | 5      | 0      | 5     |
| merchant         | opportunist      | 10      | 5      | 0      | 5     |
| naval-strategist | objective-rusher | 10      | 5      | 5      | 0     |
| naval-strategist | opportunist      | 10      | 5      | 5      | 0     |
| objective-rusher | opportunist      | 10      | 5      | 5      | 0     |

(Also reproduced in [`INITIAL-PERSONA-MATRIX.csv`](INITIAL-PERSONA-MATRIX.csv).) Every cell with a
decisive outcome splits into clean 5/5 or 5/0 halves matching the two seat orderings, not
persona-specific dominance — see §10.

## 10. The headline finding: a structural first-mover/faction advantage

Every experiment in this report shows the same pattern, independent of which personas are playing:

| Source                                                                      | n   | Carthage/p1 win rate | Rome/p2 win rate |
| --------------------------------------------------------------------------- | --- | -------------------- | ---------------- |
| `baseline.json` (opportunist mirror)                                        | 100 | 50.0%                | **0.0%**         |
| `persona-matrix.json` (full cross matrix, all 8 personas, seat-swapped)     | 280 | **67.9%**            | **3.6%**         |
| `explorer-coverage.json` (explorer, not even trying to win, vs opportunist) | 30  | 50.0%                | **0.0%**         |

Reading the persona-matrix cell table (§9) confirms this is not "some personas are just stronger":
within every pairing, wins split cleanly along **seat**, not persona identity — e.g.
`aggressor` vs `defender` is exactly 5/5, with each persona winning precisely its 5 matches as
Carthage and losing (or drawing) its 5 as Rome. The `aggressor` vs `naval-strategist` 10/0 result
is the one clear case where a persona (`naval-strategist`) is simply weak regardless of seat — a
real, separate finding (see §11) — but it is the exception, not the pattern. Across 410 non-smoke
matches in this report, Rome won **9 times** in total; Carthage won or the match stalled the rest.

**This is measured, high-confidence (n≥280, effect size ~64 percentage points), and reproducible**
— it is exactly the kind of result this framework exists to surface, and it was not visible from
the earlier black-box human-playtest pass, which only ever had a human play Carthage.

**Known limitation of this measurement:** seat order and faction identity are coupled in this
simulation framework's current configuration convention — `p1` always plays Carthage and always
acts first each round (matching `createGame`'s existing behavior, itself a pre-existing engine
convention this pass did not change). This report cannot yet separate "acts first" from "is
Carthage" (e.g. Carthage's Merchant Republic port-coin bonus, or the map's starting-position
asymmetry) as the cause — only that the _combination_ is overwhelming. Disentangling the two would
require a production engine change (letting Rome act first while still being Rome) that is out of
scope for this measurement pass. This is the top recommended next design experiment (§14).

## 11. Observed equilibrium and stagnation data

- `baseline.json`: 50% of matches ended `repeated-state-cycle` (not `stable-frontier` — an _exact_
  strategic-state cycle was detected, not merely a long idle streak). Mean idle-half-turn rate
  6.3%.
- `persona-matrix.json`: 28.6% stalemate rate (all `repeated-state-cycle`), mean idle-half-turn
  rate 4.5% — lower than baseline, consistent with a wider variety of specialized personas being
  somewhat less likely to reach a mutual dead end than two identical generalists.
- `aggressor` vs `naval-strategist` (10/0): `naval-strategist`'s heavy `portValue` weighting
  without a correspondingly strong combat/expansion push appears to lose consistently regardless of
  seat — worth a closer, larger-sample look before concluding fleets are simply weak (n=10 here is
  below the reliability threshold for that specific cell).
- No match in any of the 420 simulated for this report hit the turn cap (`no-progress`) — every
  non-victory outcome was an early, detected `repeated-state-cycle`, consistent with the earlier
  black-box-fix pass's finding that this compact map reaches a stable frontier within a handful of
  turns.

## 12. Content usage

- All six faction cards were played in every batch that reached a usable state for them.
- `tanit` and `juno` favors show 0% usage in every experiment in this report — but every profile in
  every committed experiment omits `patronId`, which defaults to `baal-hammon`/`jupiter`. This is
  **not** evidence `tanit`/`juno` are unreachable or poorly designed; it is an artifact of these
  specific experiment definitions. A follow-up experiment with `patronId` explicitly set to
  `tanit`/`juno` is needed before drawing any content-reachability conclusion about them (§14).
- No card or non-default-patron favor showed as structurally unreachable (no engine bug prevents
  using any of them).

## 13. MDA interpretation

See [`docs/MDA-EVALUATION.md`](../../docs/MDA-EVALUATION.md) for the method. Rows generated across
this report's experiments (confidence reflects the measured dynamic's sample size/effect size, not
certainty about player feeling):

| Mechanics                                                      | Measured dynamic                                                                                                    | Aesthetic hypothesis                                                                                                                            | Confidence                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Turn order (p1 acts first each round) + Carthage ruleset       | Seat/faction win rates diverged by 50–64 percentage points across every experiment in this report (n=100 to n=280). | Whichever side plays Rome may feel the outcome was decided before they had a real chance to act, regardless of skill.                           | **High**                                                           |
| Deterministic combat, terrain defense, compact territory graph | 29–50% of matches across these experiments ended in a detected stalemate rather than a natural/scenario victory.    | Players may experience a clear opening followed by declining tension and a muted climax once a defensive frontier stabilizes.                   | High                                                               |
| Patron favors                                                  | `tanit`/`juno` never invoked in any experiment in this report.                                                      | Players choosing these patrons may feel their choice has no in-match expression — _pending_ a patron-controlled follow-up experiment (see §12). | Low (confounded by experiment design, not yet a clean measurement) |

Every row requires human playtesting to confirm or refute as an actual player experience — none of
the above is a conclusion about fun or balance by itself.

## 14. Limitations

- The simulator uses independent personas, not the shipped default AI (`src/game/ai/ai.ts`); see
  [`docs/PLAYER-PERSONAS.md`](../../docs/PLAYER-PERSONAS.md).
- Only one map exists; map-level generalization is not yet possible.
- Seat order and faction are coupled (§10) — the headline finding is real and large, but this
  report cannot yet attribute it precisely between "goes first" and "is Carthage".
- Patron win-rate and favor-usage figures only reflect explicitly-configured patrons; none of the
  four committed experiments set `patronId`, so `tanit`/`juno` figures are not yet meaningful.
- Mirror-persona matchup cells conflate "won as p1" and "won as p2" into one win-rate number.
- This report measures mechanics and dynamics, not player enjoyment (§ preamble).

## 15. Recommended next design experiments

1. **Isolate seat/faction (highest priority).** The current framework cannot separate "acts first"
   from "is Carthage" because `createGame` always starts `p1` as Carthage at the Carthage map
   position. A follow-up needs either an engine-level option to let Rome act first while remaining
   Rome, or a controlled comparison map/scenario where the asymmetry is removed, before this
   finding can inform a specific fix. This is a design/engine question, not something this
   measurement pass should resolve unilaterally.
2. **Patron-controlled experiment.** Re-run the persona matrix (or a smaller targeted batch) with
   `patronId` explicitly set to `tanit`/`juno` for at least half of each faction's matches, to get a
   real read on favor-usage and patron win-rate for the currently-unmeasured patrons.
3. **naval-strategist at larger sample / other skill levels.** Its 0/10 result against `aggressor`
   is below the reliability threshold for that specific cell; re-run with more seeds and at
   `expert` skill before concluding fleets are underpowered.
4. **Map expansion (already on the roadmap).** Once a larger map exists, re-run `baseline` and
   `persona-matrix` against it and compare via `simulate:compare` to see whether the compact map's
   fast stalemate/seat-dominance pattern is map-specific or persists.
5. **Scenario-focused batch.** `baseline.json` includes _The Sicilian Question_ but the
   persona-matrix does not; a dedicated scenario experiment with `objective-rusher` on both seats
   (swapped) would give a cleaner read on question #13 from the original task brief ("does the
   campaign objective cause more active play than generic Pax victory?").
