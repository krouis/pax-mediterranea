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
