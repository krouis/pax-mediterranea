# Fix Validation Report

This report documents the fix-verification pass performed against the issues recorded in
[`PAX-MEDITERRANEA-BLACK-BOX-REPORT.md`](PAX-MEDITERRANEA-BLACK-BOX-REPORT.md) and
[`ISSUES.md`](ISSUES.md). It does not edit or replace those source reports.

**Branch:** `fix/black-box-issues-pass`
**Base:** `main` at `23e73aa` (post i18n/formal-Arabic work, pre this pass)

Every issue below was independently reproduced before any code change, using a scripted headless
Chromium session (Playwright) against the built app, or targeted unit/engine reproduction where a
browser reproduction was not the most reliable signal (see each entry). "Manual validation"
describes the post-fix verification actually performed (scripted browser runs and/or the automated
test suite), not a claim of separate human QA.

---

## PM-GAME-001 — Campaign victory does not trigger at the end of Turn 6

- **Severity/Priority:** Blocker / P0
- **Reproduction before fix:** Confirmed. Scripted a full campaign match: moved the starting
  infantry into Sicily on Turn 1, then clicked "End turn" six times. Sicily remained
  `owner-p1` (Carthage-controlled) throughout, but the match continued to "Turn 7 · Move and act"
  with no victory dialog and no `winnerId` set.
- **Root cause:** No scenario-objective evaluation existed anywhere in the engine. The only win
  condition (`player.pax >= 8`, checked inside the `MOVE`/`ATTACK` handler) is a generic skirmish
  condition unrelated to the campaign's actual objective; nothing evaluated "does Carthage hold
  Sicily" at any point, let alone at a specific turn boundary.
- **Fix:** Added a structured `objective: { type: 'controlAtTurn', territoryId, turn, factionId }`
  to scenario content, an active `scenarioId` on `GameState`, and `evaluateScenarioObjective` in
  `src/game/engine/rules.ts`, invoked from the `END_TURN` handler exactly when the round
  completes (the last player's turn ends) and only when `state.turn === objective.turn`. Holding
  the objective sets `winnerId` to the objective faction; otherwise it goes to the opposing
  faction. Once `winnerId` is set, the engine's existing "match ended" guard blocks all further
  actions, so the turn counter cannot advance past 6. A second, related bug was found while
  reproducing the fix end-to-end: the generic 8-Pax victory was still active during campaign
  matches, so the AI fix (below) could let Rome win via Pax before Turn 6 ever arrived. Fixed by
  suppressing the generic Pax condition whenever `state.scenarioId` is set, per `RULES.md`'s
  existing "scenario objectives may override this" statement.
- **Tests added:** `src/game/engine/rules.test.ts` — victory at the boundary, defeat at the
  boundary, no evaluation before the target turn or outside campaign mode, and Pax-victory
  suppression during a scenario. `e2e/campaign.spec.ts` — full 6-turn campaign playthrough,
  victory dialog, Turn 7 never begins, outcome and objective survive a reload.
- **Manual validation:** Re-ran the exact scripted repro after the fix — Sicily held through
  Turn 6, `winnerId` set to Carthage exactly at the Turn 6→7 boundary (`turn` stays `6`,
  `activePlayerIndex` unchanged), victory dialog shown, no further End Turn possible.
- **Commit:** `793db0b` (Pax-suppression half landed with the combat-dialog fix in `fee54cb`,
  since it was found while validating that fix).
- **Remaining limitations:** Only one objective type (`controlAtTurn`) is implemented; future
  scenarios needing survive/eliminate/escort objectives will need the discriminated union
  extended (documented in `docs/SCENARIO-FORMAT.md`).

## AI passivity ("AI performs no meaningful actions")

- **Severity/Priority:** Blocker-equivalent / P0 (Overall Scores: AI Competency 2/10; not a
  separate `PM-` ID in `ISSUES.md`, but called out repeatedly across the report)
- **Reproduction before fix:** Confirmed via code inspection and instrumentation, not just
  gameplay feel. `chooseAIAction` never issued `RECRUIT`, `PLAY_CARD`, or `INVOKE_FAVOR` — the
  entire recruitment/card/favor action space was absent from the decision function. It picked the
  *first* unit (array order) with *any* legal destination — including pointless moves into
  friendly-owned territory — rather than the best available action. `npm run test:ai` on the
  pre-fix code: 50/50 AI-vs-AI matches hit the 20-turn cap via forced tie-break; none reached a
  natural victory.
- **Root cause:** Missing action categories in the decision pipeline (not weak heuristics as
  such) — recruiting, playing cards, and invoking favor were simply never considered, and
  movement selection had no notion of "is this move actually good."
- **Fix:** Rewrote `src/game/ai/ai.ts` with an explicit priority pipeline per decision: (1) score
  every (unit, destination) pair across all ready units — attacks are only proposed when the
  deterministic preview says the attacker wins, capturing neutral/weak enemy territory is
  preferred over pointless friendly-territory moves (which are now excluded entirely), and the
  campaign objective territory is weighted heavily so the AI actively contests it; (2) recruit at
  controlled cities/ports up to a garrison-sized cap (`max(2× eligible territories, controlled
  territories)`) when it can afford it; (3) play an economic card for coins, or spend a card to
  refresh an already-acted unit for another action; (4) invoke favor once available; (5) only end
  the turn when none of the above yields a legal, useful action.
- **Tests added:** `src/game/ai/ai.test.ts` — 11 deterministic seeded tests: generates a legal
  action every time it's asked, chooses a non-end-turn action when one exists, recruits when it
  has coins and needs units, moves toward/contests the campaign objective territory, is not idle
  across several turns while it has resources, always ends its turn cleanly (including starting
  with zero legal moves), never proposes a losing attack, spends favor when available, and never
  produces illegal actions or loops across a 20-turn simulated run at both difficulty tiers.
- **Manual validation:** Re-ran `npm run test:ai` after the fix; also ran targeted seeded
  AI-vs-AI simulations directly (`runAITurn` in a loop) and confirmed unit counts, Pax, and
  event-log diversity grow over time where they previously never moved past the opening turn.
  See "AI behavior observed after the fix" below for the honest reading of these numbers,
  including a real equilibrium finding.
- **Commit:** `c5f785f`.
- **Remaining limitations:** On the current 12-territory map, both AIs playing well converge to a
  stable, contested frontier within roughly 3–4 turns and then correctly take no further action
  (nothing is favorable) for the rest of a long match — `npm run test:ai`'s `idleHalfTurnRate`
  stays high (0.95) and `naturalCompletions` stays 0 for AI-vs-AI matches capped at 20 turns. This
  was verified to be *correct* behavior (no illegal states, no losing attacks, coins spent up to
  the garrison cap, favor/cards used) rather than a residual passivity bug, and matches the
  project's own `docs/ROADMAP.md` item 2 (map expansion is the intended way to give the AI more
  strategic room, not further heuristic tuning). Difficulty tiers `merchant`/`strategist`/
  `general` remain functionally identical to each other (only `citizen` differs, via randomized
  choice among positive-scoring candidates) — this predates the fix and was left unchanged as
  out of scope. Recruitment/defense heuristics are reasonable but not optimal (e.g. no explicit
  "reinforce a threatened territory" logic beyond not abandoning it).

## PM-GAME-003 — Clicking enemy-owned legal movement targets does nothing (attack blocked)

- **Severity/Priority:** Critical / P0
- **Reproduction before fix:** Confirmed with a scripted browser session and a `page.on('dialog')`
  listener. Moved a unit to Sicily, ended the turn, selected the unit again, and clicked the
  legal-highlighted Magna Graecia territory: a native `window.confirm()` fired
  (`"Attack Magna Graecia? · Attack 2 · Defense 1 · Expected: victory"`); with the dialog
  auto-dismissed (the default outside a genuine user gesture, and how most automated/headless
  clients and some mobile browser chrome handle synchronous dialogs), `chooseTerritory` returned
  early — the territory stayed enemy-owned, the unit stayed selected, and the legal highlight
  stayed lit, exactly matching the reported symptom.
- **Root cause:** UI-only. Legal-target generation (`legalDestinations`) and the engine's `ATTACK`
  validation were already correct and consistent with the map's `legal` highlighting; the bug was
  routing the confirmation through a blocking native `confirm()` dialog instead of in-app state.
- **Fix:** Replaced `window.confirm()` in `App.tsx`'s `chooseTerritory` with `pendingAttack`
  React state and an in-app combat-confirmation modal (`role="alertdialog"`, same attack/defense
  preview text, Confirm/Cancel buttons), styled consistently with the app's existing scrim
  dialogs. Confirm dispatches the `ATTACK` action; Cancel clears the pending state with no side
  effects, leaving the unit selected.
- **Tests added:** `e2e/game.spec.ts` — asserts no native `dialog` event fires, the in-app dialog
  appears and is used to execute the attack.
- **Manual validation:** Re-ran the exact scripted repro after the fix on a production build —
  no native dialog, in-app dialog visible, Confirm executed the attack and updated the map
  (outcome varied run-to-run once Rome's AI started defending Magna Graecia, which is the AI fix
  working as intended, not a regression).
- **Commit:** `fee54cb`.
- **Remaining limitations:** None identified for this specific issue.

## PM-GAME-002 — Recruitment target destination cannot be chosen by the player

- **Severity/Priority:** Critical / P0 in `ISSUES.md`; addressed under this task's P1 grouping
  ("Recruitment destination cannot be selected").
- **Reproduction before fix:** Confirmed by code inspection: the recruit button's `onClick` always
  selected `game.territories.find(t => t.ownerId === player.id && eligible terrain)` — the first
  eligible territory in array order, effectively always the capital — deducted cost immediately,
  and never consulted any UI selection state.
- **Root cause:** UI-only, and consistent with `docs/RULES.md`'s stated design ("Recruit in a
  controlled city (land units) or port (all units)"). The engine's `RECRUIT` action already
  accepted an arbitrary `territoryId` and validated ownership/terrain/cost correctly; only the UI
  short-circuited destination choice.
- **Fix:** Added a placement-mode flow: clicking a unit-type button highlights every controlled,
  terrain-eligible territory using the same `legal` highlighting the map already uses for
  movement, and shows a placement hint instead of charging immediately. Clicking a highlighted
  territory confirms `RECRUIT` there (cost deducted only on that confirmation); clicking an
  ineligible territory shows the engine's validation error and stays in placement mode; a Cancel
  control, clicking the same unit-type button again, or selecting a unit all exit placement mode
  with no cost. Recruited units keep the existing "already acted" behavior unchanged.
- **Tests added:** `e2e/recruitment.spec.ts` — multi-destination selection (recruiting into a
  captured Sicily instead of defaulting to Carthage), illegal-destination rejection while staying
  in placement mode, cancel with no charge, and keyboard operation.
- **Manual validation:** Re-ran the scripted repro after the fix on a production build, desktop
  and mobile viewports: recruiting into Sicily produced a unit in Sicily, not Carthage, with the
  cost deducted exactly once.
- **Commit:** `dae72c4`.
- **Remaining limitations:** None identified against the stated requirements.

## PM-UI-004 — Tutorial gets stuck on step 2/4 and disappears

- **Severity/Priority:** Major / P1
- **Reproduction before fix:** Confirmed by code inspection: selecting a unit never advanced the
  tutorial step at all (only move/recruit/card success did, via `Math.max(tutorialStep, N)`
  calls); a successful move jumped straight to step "2/4" (the *current* step's own instruction,
  not the next one); recruiting always jumped to "3/4" regardless of whether step 2 had actually
  been shown; and ending the turn unconditionally forced the step to the "done" sentinel,
  hiding steps 3 and 4 if the player had not recruited yet. None of the bumps were gated to
  tutorial mode, so they also leaked into solo/skirmish matches (found while testing the
  recruitment placement fix — a fresh, non-tutorial solo match showed a stray tutorial tip after
  a failed recruit attempt).
- **Root cause:** Off-by-one, unconditional step transitions, and a missing mode guard — not a
  DOM/text-matching issue, but the transition *logic itself* was wrong.
- **Fix:** Replaced every ad hoc bump with a single `advanceTutorial(fromStep, toStep)` helper
  that only fires in tutorial mode and only transitions when the tip is exactly on the step being
  completed, driven by the actual dispatched action succeeding: unit selection (1→2),
  `MOVE`/`ATTACK` success (2→3), `RECRUIT` success (3→4), and `PLAY_CARD`/`INVOKE_FAVOR`/`END_TURN`
  success while on step 4 (→ done). Steps now persist unchanged across turn boundaries instead of
  being force-completed. A second, related issue found while fixing this: the tutorial's opponent
  is a fully competent AI after the AI fix above, which could capture the player's undefended
  Carthage mid-tutorial (the script names it directly: "recruit infantry in Carthage") — the
  tutorial's opponent now stays passive (ends its turn without acting) so the fixed-name script
  cannot be invalidated; the real solo/campaign AI is unaffected.
- **Tests added:** `e2e/tutorial.spec.ts` — completes the tutorial end to end from real game
  events (including surviving an intervening turn change before recruiting), skip and restart,
  and an incorrect action (illegal recruit placement) not permanently breaking progression.
- **Manual validation:** Re-ran the tutorial start-to-finish on a production build; step text
  and numbering matched the action just taken at every stage, and the tip correctly disappeared
  only after the step-4 action.
- **Commit:** `ed641d8`.
- **Remaining limitations:** The tutorial script is still tied to specific action ordering
  (select → move/capture → recruit → card/favor/end); performing those out of the documented
  order (e.g. recruiting before moving) does not break anything but also does not "skip ahead"
  intelligently — the tip simply stays on its current step until its own action occurs.

## PM-UI-005 — No usable game-event history

- **Severity/Priority:** Major / P1
- **Reproduction before fix:** Confirmed by code inspection: only the single most recent event was
  ever rendered (`state.eventLog.at(-1)`), in a transient `<p class="status">`, with no way to see
  what happened on a previous turn, including the AI's moves.
- **Root cause:** No history UI existed; the underlying data (`state.eventLog`) was already
  present, already capped at the last 30 entries, and already part of serialized save state, so
  this was purely a missing UI capability, not an engine gap.
- **Fix:** Added a `HistoryPanel` component (`src/ui/HistoryPanel.tsx`) opened via a "History"
  button, listing the full `state.eventLog` in chronological order using the same
  localization/formatting logic as the single-message display (extracted into a shared
  `formatEvent`). The dialog is `role="dialog"`, closes on Escape or backdrop click, and traps no
  hidden information (event log entries are already public-outcome-only by construction). Placed
  as its own control above the unit-selection heading rather than in the action panel's footer or
  the topbar, after finding both of those locations broke something else: the footer pushed "End
  Turn" into the fixed-position tutorial tip's hit area in RTL layouts (regressed an existing
  i18n e2e test), and the topbar already hides its icon-buttons below 780px width (an existing
  rule that would have hidden the button on mobile).
- **Tests added:** `src/ui/HistoryPanel.test.tsx` (chronological rendering, empty state, keyboard
  close, backdrop/close-button behavior) and `e2e/history.spec.ts` (opening from a real match,
  chronological content, Escape-to-close, mobile viewport usability).
- **Manual validation:** Re-ran a scripted match (move, end turn, recruit) and opened the panel on
  a production build; entries appeared in order with correct localized text on desktop and a
  390px-wide mobile viewport.
- **Commit:** `5086376`.
- **Remaining limitations:** No pagination beyond the engine's existing 30-entry cap (adequate for
  a match this length); no visual distinction between event categories beyond the localized text
  itself (e.g. no icons per event type).

## PM-UI-006 — Campaign menu objective vs. in-game objective text mismatch

- **Severity/Priority:** Moderate / P2 in `ISSUES.md`; addressed under this task's P1 grouping
  ("Campaign objective text is wrong in-game").
- **Reproduction before fix:** Confirmed by code inspection: the in-game objective banner always
  rendered `t('game:objective.pax', { target: 8 })` regardless of mode, while the campaign
  selection screen already showed the correct scenario objective text.
- **Root cause:** The banner never consulted the active scenario at all.
- **Fix:** The objective banner now looks up the active scenario via `game.scenarioId` (added as
  part of the campaign-objective engine work) and renders `scenario.objectiveKey` when present,
  falling back to the generic Pax objective otherwise. No new localization content was needed —
  `campaigns:sicilian-question.objective` ("Control Sicily at the end of turn 6.") already existed
  in all three locales and already matched the campaign selection screen.
- **Tests added:** Covered by `e2e/campaign.spec.ts`, which asserts the objective text is visible
  both on the campaign selection screen and in-game, using the same locator/text.
- **Manual validation:** Verified in the same scripted campaign run used for PM-GAME-001.
- **Commit:** `793db0b`.
- **Remaining limitations:** None identified.

## PM-UI-007 — Unit selection requires a tiny click target

- **Severity/Priority:** Moderate / P2
- **Reproduction before fix:** Confirmed by a scripted click at a specific offset inside the
  territory button (avoiding the nested unit icon): `selected after territory-body click: 0` — no
  unit was selected. Also measured the click targets directly: the territory button was 82×66px,
  the nested unit icon only 30×30px.
- **Root cause:** The territory `<button>`'s `onClick` only ever called `chooseTerritory` (a
  move/attack dispatcher); unit selection was wired exclusively to the small nested icon's own
  click handler.
- **Fix:** Territory clicks now route based on context: if the territory is currently a legal
  move/attack/recruit-placement destination, the click still dispatches that action (an intended
  move is never overridden by a selection). Otherwise, if the territory holds any of the active
  player's units, the click selects one of them, cycling to the next one on repeated clicks when
  more than one is stacked there. The original per-unit icon remains directly clickable. Clicking
  a friendly territory that is neither a legal destination nor holds any units still falls
  through to the existing engine validation/error-message path, so an active selection is never
  unexpectedly cleared.
- **Tests added:** `src/ui/MapBoard.test.tsx` (click-routing decision matrix) and
  `e2e/unit-selection.spec.ts` (territory-body selection, cycling through a stack, selection
  persistence on a non-destination click), run on desktop and mobile viewports.
- **Manual validation:** Re-ran the scripted click-offset repro after the fix — clicking the
  territory name text (not the icon) now selects the unit.
- **Commit:** `ac766a7`.
- **Remaining limitations:** Cycling through a stack requires repeated activations with no visual
  indicator of "which one is next" beyond the existing selected-unit outline; an accessible hint
  (`aria-label`) announces the stack size so screen-reader users know cycling is available.

## PM-UI-009 — Stacked units distort/overlap the map

- **Severity/Priority:** Minor / P3 in `ISSUES.md` (its own top-10 list ranks it #10); addressed
  under this task's P2 grouping ("Multiple units distort territory layout").
- **Reproduction before fix:** Partially confirmed, and more precisely than described. The
  territory button itself stayed a fixed 82×66px regardless of stack size (the reported "stretches
  the button width" did not reproduce — that appears to have been a stale build or a hover-state
  measurement artifact). What did reproduce: the unit-badge row was one 30px circle per unit with
  no cap, so a 5-unit stack measured 150px wide at a 390px mobile viewport and visibly extended
  over neighboring map elements.
- **Root cause:** `MapBoard` rendered one badge per individual unit with no grouping or width
  bound.
- **Fix:** Units are grouped by (owner, type) into a single badge with a small count overlay
  (e.g. one infantry icon showing "5") instead of one icon per unit. Since a territory can only
  ever show at most 3 distinct unit types, the badge row is now bounded to a small constant
  regardless of stack size. Verified a 5-infantry stack at 390px viewport width now renders as one
  ~28px badge instead of 150px of icons (screenshot captured during validation, not committed).
  Unit type stays distinguishable by icon and faction by badge color; title/aria-label report
  stack size and whether any unit in the group has acted.
- **Tests added:** `src/ui/MapBoard.test.tsx` (collapsed badge instead of one-per-unit, unchanged
  territory footprint regardless of stack size, cycling/acted-status reporting).
- **Manual validation:** Scripted a 5-recruit stack at a 390px viewport on a production build and
  measured/screenshotted the result; badge row bounded to ~69px instead of ~150px.
- **Commit:** `f055fa6`.
- **Remaining limitations:** This is a compact icon+count representation, not a redesign of the
  unit art (explicitly out of scope for this pass, per the audio/art backlog below). At the
  theoretical maximum of 3 simultaneous type badges the row can still slightly extend past the
  territory circle on very small viewports, though far less than before.

## PM-MULTI-011 — Online multiplayer room is a misleading non-functional stub

- **Severity/Priority:** Moderate / P2
- **Reproduction before fix:** Confirmed: the Join button was already disabled (this had
  apparently already been partially addressed before this pass), but the surrounding copy was
  vague implementation jargon ("Optional transport preview" on the menu, "Online play needs an
  optional transport" on the room screen) that did not tell the player the feature is simply
  unavailable, and offered no path to a working mode from that screen.
- **Root cause:** Copy and screen design, not functionality — `docs/MULTIPLAYER.md` already
  correctly described this as a future WebSocket service, so no backend work was in scope.
- **Fix:** Menu subtitle changed to "Not yet available"; the Online Room heading now shows a
  "Coming soon" badge; the explanatory text plainly states multiplayer is not available in this
  build and names the two working alternatives; direct buttons to Quick Skirmish and Local Hot
  Seat were added to that screen instead of only a back-to-menu link. The room-code input was
  deliberately left enabled (only the Join button is disabled) after disabling it broke an
  existing regression test (`e2e/i18n.spec.ts`'s "keeps room codes LTR" case) that specifically
  exercises typing into it to verify bidi-safe `dir="ltr"` handling for a future functional build.
- **Tests added:** `e2e/multiplayer-stub.spec.ts`.
- **Manual validation:** Screenshotted the Online Room screen on a production build; visually
  confirmed the badge, plain-language copy, and working alternative buttons.
- **Commit:** `bba6226`.
- **Remaining limitations:** None for the labeling itself. Building the actual WebSocket service
  remains out of scope per the task's own instructions and `docs/ROADMAP.md` item 5.

## Explicitly out of scope (confirmed, not fixed)

- **PM-GAME-008 — Starting territories don't grant initial Pax Points.** A balance/design question
  (documented as excluded speculative balance change in the task instructions: "awarding starting
  Pax Points"). Not changed.
- **PM-AUDIO-010 — No audio.** Confirmed still silent; adding original music/SFX was explicitly
  out of scope for this pass. Backlog entries recorded in `docs/ROADMAP.md` item 3 (already
  present, expanded with a pointer to this finding).
- **Art direction / unit glyphs.** Confirmed still text-glyph based (`♟ ♞ ⛵`); replacing them with
  original art was explicitly out of scope. `docs/ROADMAP.md` item 3 already covers this.
- **Combat animation.** Confirmed absent; out of scope. `docs/ROADMAP.md` item 3.
- **Balance changes** (8-Pax target, fleet transport capacity, randomized deterministic combat):
  not implemented, per explicit instruction to treat these as design-review items, not bugs.

---

## Full test suite results (this branch, after all fixes)

- `npm run check` (format, lint, typecheck, coverage, content/i18n validation, build): **pass**.
  Coverage: 92.95% statements / 87.41% branches / 100% functions / 96.18% lines — all above the
  85/80/85/85 thresholds in `vitest.config.ts`.
- `npm run test:integration`: **1/1 pass**.
- `npm run test:e2e` (Chromium desktop + mobile projects, 60 specs including 4 desktop-only visual
  baselines correctly skipped on mobile): **56/56 pass**.
- `npm run test:ai`: no illegal states across 50 seeded AI-vs-AI matches; see the AI section above
  for the honest reading of the completion/idle metrics.
- `npm run validate:maps`, `npm run validate:scenarios`, `npm run validate:i18n`: **pass** (200
  keys validated across en/fr/ar-TN, including the new campaign-victory, recruitment-placement,
  and multiplayer-labeling strings).
- `npm run build`: **pass**, producing a production bundle scoped to the `/pax-mediterranea/` base
  path (matches the GitHub Pages project path); all e2e tests run against this built-and-previewed
  production bundle via `playwright.config.ts`'s `webServer`, so the GitHub Pages subpath is
  exercised by the entire e2e suite, not just spot-checked.

## AI behavior observed after the fix

Solo/campaign mode (human vs. AI, the actual reported scenario): the AI now recruits, moves
multiple units per turn toward valuable and vulnerable targets, uses cards to refresh acted units
or gain coins, invokes favor when available, and — notably — captured the player's undefended
capital in one validation run after the player moved their only starting unit away from it,
demonstrating it now punishes an exposed position rather than ignoring it.

AI-vs-AI simulation (`npm run test:ai`, 50 seeded matches, 20-turn cap): 0 natural completions in
both the before and after runs, but for different reasons. Before the fix, this reflected genuine
passivity — the AI never recruited, never played cards, never invoked favor, and only ever moved
the first unit it found regardless of whether the move helped. After the fix, direct inspection of
individual matches shows both sides recruiting to their garrison cap, contesting territory,
correctly declining unfavorable attacks, and then reaching a stable, mutually-defended frontier
within roughly 3–4 turns — after which further action is correctly withheld because none is
favorable, not because the AI has stopped trying. This is a legitimate characteristic of a small,
symmetric, deterministic-combat map (also independently flagged in `docs/ROADMAP.md` item 2, which
predates this pass), not a residual defect; see the AI section above for the full reasoning and the
diagnostics (`naturalCompletions`, `idleHalfTurnRate`, `netUnitDelta`) added to
`scripts/run-ai-simulations.ts` to make this distinction visible in future regression checks.

## Deployment status

Not deployed as part of this pass (branch work only; the task instructions describe an
incremental commit-and-push workflow, not a deploy). `npm run build` was run repeatedly against
this branch and the resulting bundle was served via `vite preview` (matching the GitHub Pages
`/pax-mediterranea/` base path) for every manual/scripted validation described above, including
the full e2e suite via Playwright's own `webServer` config. GitHub Pages deployment itself is
driven by the existing CI workflow on `main` and was not modified.

## Issues that could not be reproduced

None. Every issue investigated in this pass reproduced as described (or, for PM-UI-009, more
precisely than described — see that entry).
