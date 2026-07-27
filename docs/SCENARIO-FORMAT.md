# Scenario format

A scenario has stable `id`, localized title/introduction keys, objective, historical note, map ID,
players, starting ownership/units, seed, turn limit, difficulty modifiers, primary objective, and
optional secondary objectives. Custom rules should be declarative flags rather than branches in UI.

Every scenario validator must check referenced IDs, reachable objectives, compatible faction/patron
choices, legal units, nonnegative resources, qualification of speculative history, and English/French
keys. The current TypeScript data is intentionally small and migrates to this full schema as more
missions are added.
