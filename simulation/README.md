# Simulation

Data and experiment definitions for the deterministic simulation engine in
`src/game/simulation`. See [`docs/SIMULATION.md`](../docs/SIMULATION.md) for the architecture,
[`docs/SIMULATION-METRICS.md`](../docs/SIMULATION-METRICS.md) for what every number means,
[`docs/PLAYER-PERSONAS.md`](../docs/PLAYER-PERSONAS.md) for what each persona represents and does
not represent, and [`docs/MDA-EVALUATION.md`](../docs/MDA-EVALUATION.md) for how to read a report's
design hypotheses.

## Layout

```text
simulation/
  experiments/   Committed, data-driven experiment definitions (JSON).
  baselines/      Committed baseline metrics (JSON) for regression comparison.
  reports/        Generated JSON/CSV/Markdown reports. Not committed by default — see below.
```

## Running an experiment

```bash
# Fast smoke check (also run in CI on every PR):
npm run simulate:smoke

# Any committed or ad hoc experiment file, with an optional baseline comparison:
npm run simulate:matrix -- \
  --experiment simulation/experiments/persona-matrix.json \
  --output simulation/reports/persona-matrix \
  --baseline simulation/baselines/current-main.json

# One ad hoc match, no experiment file needed:
npm run simulate -- --p1 carthage:aggressor:competent --p2 rome:defender:expert --seed 7
```

Every run writes (or, for `simulate` without `--output`, prints) a `.json`, `.md`, and a set of
`.csv` files at the given prefix. Read the `.md` file first — it is the human-readable report,
structured per `docs/SIMULATION.md`.

## Regenerating the baseline

```bash
npm run simulate:baseline
```

This runs `simulation/experiments/baseline.json` and overwrites
`simulation/baselines/current-main.json`. Only do this deliberately, after a mechanics change you
intend to make the new normal — the baseline is what every future PR's `simulate:compare` check is
measured against. Commit the updated baseline in the same PR as the mechanics change that justifies
it, with the comparison report attached to the PR description.

## Comparing against the baseline

```bash
npm run simulate:compare -- \
  --baseline simulation/baselines/current-main.json \
  --experiment simulation/experiments/smoke.json
```

Exits non-zero only for a `structural-regression` finding. A `warning` (e.g. a large but plausible
shift in `meanTurns`, or one seat winning every match in a small sample) is printed but does not
fail the process — read [`docs/MDA-EVALUATION.md`](../docs/MDA-EVALUATION.md) for how to interpret
it before deciding whether it is a real problem.

## What gets committed

- `experiments/*.json` — always (they are the reproducible definition of what gets measured).
- `baselines/current-main.json` — always kept current on `main`.
- `reports/*` — **not** committed by default (regenerate them locally or read the CI/weekly-workflow
  artifacts instead); the exception is the initial baseline report set
  (`INITIAL-SIMULATION-REPORT.md`, `INITIAL-SIMULATION-SUMMARY.json`,
  `INITIAL-PERSONA-MATRIX.csv`), kept as a permanent first-measurement reference.
