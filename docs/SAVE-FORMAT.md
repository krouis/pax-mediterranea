# Save format

Saves are JSON objects with `format: "pax-mediterranea-save"`, top-level `version: 2`, ISO
`savedAt`, serializable `state`, and optional action history. Game state separately carries
`schemaVersion: 2`. Import validates the envelope and rejects unknown/malformed data. Version 2
stores stable content and event keys rather than translated territory or system-player text; a
tested migration upgrades version 1 saves.

Migrations must be pure, sequential (`v1 -> v2`), tested with fixtures, and preserve the original
until successful. Never execute imported content. Display names are data, not markup. The vertical
slice has one autosave; multiple IndexedDB slots and explicit JSON import/export are next.

`GameState.scenarioId` (optional) records which campaign scenario, if any, governs the match; it is
additive and absent on pre-existing saves, so no schema version bump or migration was needed to add
it. Campaign completion (which scenario IDs have been won) is tracked separately from the autosave,
under its own `pax.campaign.v1` `localStorage` key (`src/persistence/campaign.ts`), so it survives
starting a new match and is not part of the save envelope above.
