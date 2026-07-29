# Player personas

A persona (`src/game/simulation/personas/*.ts`) is a **weight vector** over the shared raw score
components computed once in `src/game/simulation/policies/scoring.ts` (objective progress, Pax
gain, territory value, income, unit-loss risk, enemy-unit removal, capital/city/port threat, card/
favor value, movement efficiency, defensive exposure, novelty, and — for `expert` skill only —
counter-threat). Every persona's identity is expressed by which components it amplifies or dampens
relative to `opportunist` (every weight `1`, no bias), not by a separate hand-written algorithm.

This is a deliberate engineering tradeoff. It keeps eight personas consistent, testable, and cheap
to extend, at the cost of not modeling truly distinct decision _procedures_ (e.g. a real minimax
search per persona). The behavioral tests in `src/game/simulation/policies/selection.test.ts` prove
the personas produce genuinely different chosen actions on crafted positions, not just different
numbers attached to the same choice — but a persona's ceiling is still bounded by the shared
candidate/scoring model. See [SIMULATION.md](SIMULATION.md) for how skill level (execution quality)
is layered independently on top of persona (strategic identity).

## objective-rusher

**Identity:** maximize scenario objective and Pax progress above all else; accepts moderate unit
risk to advance a victory condition.
**Weights:** `objectiveProgress: 5`, `paxGain: 3`, `capitalThreat: 1.5`, `unitLossRisk: 0.8` (more
risk-tolerant than baseline), `counterThreat: 1.2`.
**Helps evaluate:** whether scenario objectives (e.g. _The Sicilian Question_'s "hold Sicily at
Turn 6") produce genuinely active, contested play rather than being ignorable.
**Do not conclude:** that its win rate against a specialist persona measures overall game balance —
it is deliberately single-minded.

## expansionist

**Identity:** prioritizes capturing neutral territory and growing controlled-territory count over
combat or economy.
**Weights:** `territoryValue: 3`, `paxGain: 2`, `movementEfficiency: 2.5`, `incomeGain: 1.2`,
`enemyUnitRemoval: 0.5` (deprioritizes combat).
**Helps evaluate:** dominant openings, expansion snowballs, and whether some territories are
effectively irrelevant to a growth-focused player.
**Do not conclude:** that it represents "optimal" play — it deliberately ignores combat value.

## aggressor

**Identity:** seeks favorable attacks and pressures exposed cities/capitals; prefers initiative over
passive accumulation.
**Weights:** `enemyUnitRemoval: 3`, `capitalThreat: 2.5`, `cityThreat: 2`, `unitLossRisk: 0.6`,
`counterThreat: 0.5` (more risk-tolerant — it still never proposes a losing attack, since the
scoring model excludes those outright, but it discounts the cost of exposing itself afterward).
**Helps evaluate:** whether the map and combat rules reward offense, and how punishing an exposed
capital/city is.
**Do not conclude:** that a high aggressor win rate means the game rewards aggression in general —
compare it against `defender` and `opportunist` specifically.

## defender

**Identity:** protects the capital, cities, ports, sacred sites, and objectives; reinforces
threatened territory and preserves unit value over expansion.
**Weights:** `defensiveExposure: 3.5`, `unitLossRisk: 1.6`, `counterThreat: 2`, `territoryValue:
1.3`, `enemyUnitRemoval: 0.7`.
**Helps evaluate:** turtling strength, defensive advantage, stalemate risk, and comeback difficulty
against a defensive opponent.
**Do not conclude:** that its behavior models an "optimal" defense — `defensiveExposure` only fires
for an empty, valuable, currently-threatened territory (see `scoring.ts`), not every threatened
neighbor, to avoid perpetual pointless reinforcement churn; a persona genuinely willing to trade
territory for tempo is not modeled.

## merchant

**Identity:** maximizes sustainable income and controls economic territory; uses economic cards
efficiently and delays risky conflict.
**Weights:** `incomeGain: 3`, `cardValue: 2`, `portValue: 1.5`, `unitLossRisk: 1.5`, `counterThreat:
1.5`, `enemyUnitRemoval: 0.5`.
**Helps evaluate:** whether economic play is viable rather than simply slow — does it fall behind
persona archetypes that convert territory into Pax faster?
**Do not conclude:** that a low merchant win rate means the economy mechanic is broken — compare its
final coin/Pax curves (Economy section of the report) against its win rate to distinguish "slow but
still winning" from "never converts economy into victory".

## naval-strategist

**Identity:** recruits and uses fleets; controls ports/islands/sea routes; supports land expansion
through maritime positioning.
**Weights:** `portValue: 4`, `territoryValue: 1.3`, `movementEfficiency: 1.2`, `incomeGain: 1.2`,
`objectiveProgress: 1.2`.
**Helps evaluate:** whether fleets and the map's sea routes matter strategically — see
`fleetUsageRate` and `victoryRateByPersona.naval-strategist` together. A persona whose recruitment
is _weighted toward_ fleets but whose win rate/territory control does not improve versus a
land-only persona is itself a measured finding, not a modeling failure.
**Do not conclude:** that low fleet usage elsewhere in a batch means fleets are useless in general —
only that _this persona, on this map, in this batch_ did not find them decisive.

## opportunist

**Identity:** the general-purpose rational baseline — every score component keeps its default
weight (`1`), so its choices reflect the shared scoring model with no persona-specific bias.
**Helps evaluate:** used as the control arm in persona matchups, and as the closest available stand-
in for "a solid, generalist AI" in `simulation/experiments/baseline.json` (the simulator does not
invoke the shipped default AI, `src/game/ai/ai.ts`, directly — see [SIMULATION.md](SIMULATION.md)).
**Do not conclude:** that opportunist plays identically to the production default AI; it shares no
code with it beyond the underlying rules engine.

## explorer

**Identity:** prefers underused legal actions, cards, favors, and territories, to exercise content
reachability and rule coverage rather than to win.
**Weights:** `novelty: 5`, `territoryValue: 0.5`, `paxGain: 0.6`, `cardValue: 1.8`, `incomeGain:
0.5` (still avoids clearly losing attacks — `unitLossRisk` stays at the default weight, since
"explore" is not "self-destruct").
**Helps evaluate:** which cards, favors, or territories are never touched by any other persona in a
batch — `simulation/experiments/explorer-coverage.json` exists specifically to populate the report's
Content Reachability section.
**Do not conclude anything about balance from its win rate.** It is explicitly not optimizing to
win, so a low or high win rate is not evidence about the game's balance one way or the other.
