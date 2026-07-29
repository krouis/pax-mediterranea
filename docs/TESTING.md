# Testing

`npm run test:coverage` runs deterministic rules, serialization, AI, and transport unit tests with
85/80/85/85 statement/branch/function/line thresholds. `npm run test:integration` targets combined
flows. `npm run test:e2e` runs Chromium desktop and mobile flows; axe checks serious accessibility
issues. Content and localization validators run independently.

`npm run test:ai` executes bounded seeded matches and reports completion, natural completions (a
scenario/Pax victory reached before the turn cap, as opposed to the tie-break fallback), average
turns, stalemate rate, idle-half-turn rate, net unit delta, and illegal states. CI uploads coverage
and browser reports. Before release, also manually verify installability, offline reload after one
online visit, update prompting, save continuity, keyboard-only play, reduced motion, and all
required languages.

`src/game/ai/ai.test.ts` covers the default AI's decision pipeline with fixed seeds: it always
proposes a legal action, prefers a non-end-turn action when one is useful, recruits when it has
coins and needs units, moves toward and contests the campaign objective territory, is never
completely idle across several turns while it has resources, always ends its turn cleanly (even
starting with no legal moves), never proposes a losing attack, and never produces illegal actions
or loops across a long simulated run. `e2e/campaign.spec.ts` plays a full campaign match through
Turn 6, confirms the scenario victory triggers at the turn boundary (not Turn 7), and confirms the
outcome and objective survive a reload. `e2e/tutorial.spec.ts` completes the guided tutorial end to
end from real game events, plus skip/restart and incorrect-action-does-not-break-progression cases.
`e2e/recruitment.spec.ts` and `e2e/unit-selection.spec.ts` cover destination placement and
territory-click selection/cycling on desktop, mobile, and keyboard. `src/ui/HistoryPanel.test.tsx`
and `src/ui/MapBoard.test.tsx` are component-level tests for the history panel and the stacked-unit
click-routing/display logic.

Visual-regression coverage (`toHaveScreenshot`, Chromium desktop only, curated not exhaustive) now
spans the menu (`e2e/i18n.spec.ts`'s "localized visual baselines" block: 3 locales, 2 mobile
orientations) and, since the pixel-art overhaul, the game board, faction select, recruitment
placement, the attack-confirmation dialog, the Codex screen, a mobile-portrait board, and an
Arabic RTL board (`e2e/visual.spec.ts`), following the same `<screen>-<locale>-<viewport>.png`
naming convention. Baselines use the same deterministic seeds (`createGame`'s default solo/
campaign seeds) the rest of the e2e suite already relies on, so a genuine visual change is the
only thing that should ever require `npm run test:e2e:update`; always review the diff before
accepting a regenerated baseline, never regenerate blindly. `e2e/visual.spec.ts` also covers
`PixelDialog`'s focus trap end to end (Tab/Shift+Tab stay inside the combat-confirmation dialog,
focus returns to the trigger on close) and a dedicated axe pass on the Codex screen.

`npm run validate:i18n` checks 100% namespace/key parity, non-empty values, placeholders, plural
forms, locale metadata, exposed-locale completeness, syntax, and common hard-coded attributes.
`npm run test:i18n` covers detection, fallback, persistence, interpolation, formatting, document
language/direction, and locale-independent game state. `npm run test:e2e:i18n` covers all required
languages, RTL, offline reload, mixed-direction room codes, Arabic tutorial entry, localized axe,
French expansion, and reviewed screenshots.

The Arabic validation stage also rejects a reviewed list of unambiguously dialectal interface terms
and pins formal critical-path wording plus Tunisian historical-name conventions. This lint is a
regression guard, not a replacement for native review. Quoted incorrect examples belong only in
linguistic documentation or rejection tests, outside production locale resources.

## Simulation

`npm run test:simulation` (also part of the default `npm run test`) covers the deterministic
batch-simulation harness in `src/game/simulation`: identical state hash/telemetry/action trace
across repeated runs of the same seed (including novice's seeded execution noise); config and
experiment-definition validation errors; invariants across every persona x skill-level combination
(always terminates, never an illegal action, non-negative coins, Pax victory stops the match
immediately, the campaign scenario objective resolves instead of the generic Pax threshold);
behavioral persona differentiation on crafted positions (e.g. `defender` never favors abandoning a
threatened territory, `explorer` avoids an already-visited destination); a crafted "trap" position
proving `expert`'s one-ply lookahead computes a real counter-threat penalty that `competent` does
not; state hashing and repeated-state/equilibrium detection; and the full experiment → aggregate →
matchup-matrix → MDA → baseline-comparison → JSON/CSV/Markdown report pipeline against a real
multi-persona, multi-scenario batch, asserting no `NaN`/`Infinity`/`undefined` in any output
including single-match and empty-sample edge cases. `npm run validate:experiments` checks every
committed experiment definition's schema, map id, and scenario id. `npm run simulate:smoke` runs
`simulation/experiments/smoke.json` end to end through the CLI and is the PR-level structural-
regression gate — see [Simulation](SIMULATION.md#ci-integration) and
[Simulation metrics](SIMULATION-METRICS.md) for what counts as a hard failure versus a warning.
