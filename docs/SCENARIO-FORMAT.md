# Scenario format

A scenario has stable `id`, localized title/introduction keys, objective, historical note, map ID,
players, starting ownership/units, seed, turn limit, difficulty modifiers, primary objective, and
optional secondary objectives. Custom rules should be declarative flags rather than branches in UI.

Every scenario validator must check referenced IDs, reachable objectives, compatible faction/patron
choices, legal units, nonnegative resources, qualification of speculative history, and English/French
keys. The current TypeScript data is intentionally small and migrates to this full schema as more
missions are added.

The engine currently resolves one structured objective type, `controlAtTurn: { territoryId, turn,
factionId }`: at the turn boundary named by `turn` (evaluated once, when the last player's turn
ends), the match concludes immediately — a win for `factionId` if it then controls `territoryId`,
otherwise a win for the opposing faction. This is evaluated in the engine
(`evaluateScenarioObjective` in `src/game/engine/rules.ts`), not the UI, and suppresses the generic
Pax victory for the duration of the scenario so the two conditions cannot race. `npm run
validate:scenarios` checks that every scenario has a resolvable objective referencing a real
territory, a positive integer turn, and a known faction. Additional objective types (e.g. survive,
eliminate, escort) should extend this discriminated union rather than branching on scenario `id` in
the UI.
