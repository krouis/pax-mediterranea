# Save format

Saves are JSON objects with `format: "pax-mediterranea-save"`, top-level `version: 1`, ISO
`savedAt`, serializable `state`, and optional action history. Game state separately carries
`schemaVersion: 1`. Import validates the envelope and rejects unknown/malformed data.

Migrations must be pure, sequential (`v1 -> v2`), tested with fixtures, and preserve the original
until successful. Never execute imported content. Display names are data, not markup. The vertical
slice has one autosave; multiple IndexedDB slots and explicit JSON import/export are next.
