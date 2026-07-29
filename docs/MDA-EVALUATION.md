# MDA evaluation

MDA — Mechanics, Dynamics, Aesthetics — is a standard game-design lens: **mechanics** are the rules
as written; **dynamics** are the behavior those rules produce when actually played; **aesthetics**
are the emotional/experiential response a player has to those dynamics. The simulation framework can
measure mechanics (they are the game's own source of truth) and observed dynamics (via telemetry
across many simulated matches). It cannot directly measure aesthetics — no simulated persona
experiences boredom, tension, or satisfaction — so it stops one step short and produces
**hypotheses**, never conclusions, about the aesthetic layer.

## The chain: measured fact → dynamic → hypothesis

`src/game/simulation/analysis/mda.ts`'s `generateMdaHypotheses` implements this chain mechanically.
Every row it can produce is gated by a real threshold on a real `AggregateMetrics` field — the
function contains no hand-written verdicts about whether the game is good or bad. For example:

```text
Measured fact (mechanics + telemetry):
  stalemateRate >= 0.3 across a batch of N matches.

Derived dynamic:
  "N% of matches in this batch ended in a stable frontier, repeated-state cycle, or no-progress
  classification rather than a natural or scenario victory."

Aesthetic hypothesis:
  "Players may experience a clear opening followed by declining tension and a muted climax once a
  defensive frontier stabilizes."
```

Compare the two ways this could be written:

- ❌ "The game is boring after turn 5." — an unsupported verdict.
- ✅ "The measured decline in combat and ownership changes after turn 4 suggests a risk of reduced
  tension; human playtesting is required to confirm whether players experience this as boredom." —
  a labeled hypothesis with its evidence attached.

Every row's `humanValidationNeeded` field is hard-coded `true`. There is no code path that lets an
MDA row claim certainty about player experience.

## Confidence

Each row's `confidence` (`low`/`medium`/`high`, `mda.ts`'s `confidenceFor`) reflects confidence in
**the measured dynamic** — is the sample large enough and the effect size clear enough that the
statistic itself is trustworthy? It says nothing about how a human would feel. A `high`-confidence
row is not a strong claim about fun; it is a strong claim that the underlying number is real and not
noise. Rows below `MIN_RELIABLE_SAMPLE` (20 matches) are always `low` confidence regardless of
effect size.

## Why simulation cannot replace human playtesting

The simulator plays through eight deterministic personas built from a shared scoring model (see
[PLAYER-PERSONAS.md](PLAYER-PERSONAS.md)) — none of them are human, none of them can report being
frustrated, delighted, or confused, and none of them experience the UI at all (no art, no audio, no
click targets, no onboarding). It can tell you _that_ a stable frontier forms in turn 4 on average;
it cannot tell you whether a player finds that satisfying, boring, or strategically deep. Structured
human playtesting — with real people, real UI, and a debrief — is the only source of evidence for
the aesthetic layer, and every MDA hypothesis in a generated report exists to give that playtesting
a specific, falsifiable thing to check, not to substitute for it.

## Evaluating a design experiment

1. Generate a baseline report (`npm run simulate:baseline`) before changing any mechanic.
2. Make the change on a branch; generate a new report against the same experiment
   (`npm run simulate:matrix -- --experiment <same file> --output <new prefix> --baseline
simulation/baselines/current-main.json`).
3. Read the **Baseline Comparison** section first — a `structural-regression` finding means
   something is actually broken (crash, illegal action, non-determinism, dropped-to-zero
   completion, pathological duration) and should block the change regardless of design intent.
4. Read **MDA Interpretation** in both reports side by side. A hypothesis that newly appears, or
   whose measured dynamic moved substantially, is the thing to bring into human playtesting — not a
   reason to accept or reject the change on its own.
5. Never merge a mechanics change on simulation data alone if it changes a `warning`- or
   `structural`-level metric; get a human read on the resulting dynamic first.

## Comparing before/after

`analysis/regression.ts`'s `compareToBaseline` is the mechanical half of step 3 above — see
[SIMULATION-METRICS.md](SIMULATION-METRICS.md) for exactly which metrics are structural (CI-failing)
versus advisory. The MDA section of a report is generated independently for the current run only; a
future improvement could diff MDA rows between two reports directly; today it must be done by eye.
