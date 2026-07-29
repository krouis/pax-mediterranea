# Simulation metrics

Every metric below is computed in `src/game/simulation/analysis/aggregate.ts` (`AggregateMetrics`)
from a batch of `MatchTelemetry` records (`src/game/simulation/telemetry.ts`), themselves recorded
purely from public `GameState` fields as a match executes. "Suitable for" indicates whether a
metric is used as a hard CI-failure signal, a warning, or design-review-only input — see
`analysis/regression.ts` and [SIMULATION.md](SIMULATION.md#ci-integration).

Rates below `MIN_RELIABLE_SAMPLE` (20 matches, `analysis/distributions.ts`) are annotated with
`sampleWarning` in the aggregate and should be read as directional only.

## Completion and termination

| Metric                  | Definition                                                                                                                                                                                                                                           | Suitable for                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `completionRate`        | Share of matches with any `winnerId` set (including a forced turn-cap tie-break, if the game ever added one — it currently does not).                                                                                                                | Warning                                                                     |
| `naturalCompletionRate` | Share of matches classified `natural-victory` or `scenario-victory` — i.e. a real Pax/objective win, not a stagnation classification.                                                                                                                | **Structural** (dropping from a meaningful baseline to zero)                |
| `terminationRate`       | Share of matches per `TerminationClassification` (`natural-victory`, `scenario-victory`, `max-turns`, `repeated-state-cycle`, `stable-frontier`, `no-progress`, `illegal-action`, `simulation-error`). See `equilibrium.ts` for how each is derived. | Structural for `illegal-action`/`simulation-error`; design review otherwise |
| `stalemateRate`         | Share classified `stable-frontier`, `repeated-state-cycle`, or `no-progress`.                                                                                                                                                                        | Design review                                                               |
| `repeatedStateRate`     | Share where an exact strategic-state cycle was detected (`equilibrium.ts`'s `detectRepeatedState` over the `hashStrategicState` history).                                                                                                            | Design review                                                               |

## Win rates

| Metric                 | Definition                                                                                                                                                                                                                                                                                  | Suitable for  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `victoryRateByFaction` | Win share per faction (`carthage`/`rome`) across the batch.                                                                                                                                                                                                                                 | Design review |
| `victoryRateBySeat`    | Win share for `p1` (acts first each round) vs `p2`. A 100%/0% split with an adequate sample is flagged as a **warning** (not a hard failure) — it can be a legitimate seat/faction advantage or the signature of a regression; `compareToBaseline` cannot tell the two apart automatically. | Warning       |
| `victoryRateByPersona` | Of the matches a given persona played (any seat), the share it won.                                                                                                                                                                                                                         | Design review |
| `victoryRateByPatron`  | Win share attributed to an explicitly-configured `patronId`. Profiles that omit `patronId` use the engine default and are **not** attributed to any patron here — this is a known undercount, not a bug.                                                                                    | Design review |

## Duration

| Metric                      | Definition                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `meanTurns` / `medianTurns` | Mean/median of `state.turn` at match end.                                                 |
| `turnPercentiles`           | p10/p25/p50/p75/p90 of match length in turns (`analysis/distributions.ts`, nearest-rank). |

## Activity and stagnation

| Metric                               | Definition                                                                                                                                                                                                                                                                                                                                                                                                  | Suitable for  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `idleHalfTurns` / `idleHalfTurnRate` | A half-turn (one player's complete turn) is idle if `hashStrategicState` (territories + units + Pax) is unchanged from before that turn to after it. **Coins, hand, deck, and favor are deliberately excluded** — income accrues every turn regardless of whether anything strategically meaningful happened, so including coins would mean "idle" could never be true even in a genuinely frozen position. | Design review |
| `maxConsecutiveIdleHalfTurns`        | Longest idle streak observed; `stable-frontier` termination fires once this reaches `config.equilibriumWindow`.                                                                                                                                                                                                                                                                                             | Design review |
| `meanLeadChanges`                    | Number of times the Pax leader (by `paxByTurn`) changed across the match.                                                                                                                                                                                                                                                                                                                                   | Design review |
| `comebackRate`                       | Share of matches where a player who was ever behind in Pax later took the lead.                                                                                                                                                                                                                                                                                                                             | Design review |

## Combat

| Metric                                            | Definition                                                                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `combatRatePerMatch`                              | Mean count of `ATTACK` actions per match.                                                                                                                                              |
| `meanTimeToFirstCombat`                           | Mean turn of the first `ATTACK` across matches that had at least one; `null` if none did.                                                                                              |
| `attacksAttempted` / `attacksWon` / `attacksLost` | Per-match counters (not currently surfaced as separate aggregate rates, but present on every `MatchTelemetry` for custom analysis).                                                    |
| `attacksDeclinedAsUnfavorable`                    | Count of distinct (unit, destination) pairs a persona evaluated as an `ATTACK` but did not choose because the deterministic combat preview was not a win — deduplicated per half-turn. |

## Territory

| Metric               | Definition                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `meanTerritoryChurn` | Mean of (territories captured + territories lost) per match, summed across both players. |

## Economy

| Metric                                                              | Definition                                                                                                                        |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `averageCoinsEarned` / `averageCoinsSpent` / `averageCoinsRetained` | Mean coin totals per player-match: earned (income + card bonuses), spent (recruits/other costs), retained (unspent at match end). |
| `averageFinalPax`                                                   | Mean of each player's Pax total at the last recorded turn snapshot.                                                               |

## Recruitment and content

| Metric                                    | Definition                                                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `recruitmentMixByType`                    | Share of all recruited units that were infantry/cavalry/fleet.                                                                               |
| `fleetUsageRate`                          | Share of matches that recruited at least one fleet.                                                                                          |
| `cardUsageRate` / `favorUsageRateByFavor` | Per card/patron: share of matches that played/invoked it at least once.                                                                      |
| `favorUsageRate`                          | Share of matches that invoked _any_ favor.                                                                                                   |
| `unusedCardIds` / `unusedFavorIds`        | Card/patron ids with a 0% usage rate across the whole batch — feeds the report's Content Reachability section and MDA hypothesis generation. |

## Structural invariants (not part of `AggregateMetrics`; computed alongside it)

| Field                    | Definition                                                                                                                                                                    | Suitable for   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `illegalActionRate`      | Share of matches classified `illegal-action` — every simulated candidate is expected to already be legal, so any nonzero value is a real bug in this framework, not the game. | **Structural** |
| `simulationErrorRate`    | Share of matches where `runSimulatedMatch` threw.                                                                                                                             | **Structural** |
| `nonDeterminismDetected` | Set by baseline/comparison tooling after re-running a sample twice and checking `finalStateHash` equality (not computed per-match by default — expensive).                    | **Structural** |
| `maxWallClockMsPerMatch` | Slowest single match in the batch, in ms; exceeding a generous ceiling (5s) suggests a non-terminating or pathological loop.                                                  | **Structural** |

## What these metrics cannot tell you

None of the above measures player enjoyment, tension, or fun. A high `stalemateRate` or a low
`combatRatePerMatch` is a measured fact about this batch's simulated matches; whether that
translates to a worse player experience is a hypothesis requiring human playtesting — see
[MDA-EVALUATION.md](MDA-EVALUATION.md).
