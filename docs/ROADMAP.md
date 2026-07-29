# Roadmap

1. Harden the vertical slice: spatial keyboard navigation, focus trapping, IndexedDB slots,
   save import/export, and card-per-turn enforcement (currently one card per action phase is not
   engine-enforced beyond hand size). Event-driven tutorial gates and a default AI that takes
   meaningful actions each turn (recruit, move/attack, cards, favor) have shipped. Complete
   native-speaker editorial review for formal Arabic and Tunisian historical transcriptions.
2. Expand the compact quick map to 20–35 readable territories and balance through AI simulations.
   A deterministic, data-driven simulation and design-analysis engine now exists for this
   (`src/game/simulation`, see [docs/SIMULATION.md](SIMULATION.md)) and its first baseline
   (`simulation/baselines/current-main.json`, `simulation/reports/INITIAL-SIMULATION-REPORT.md`)
   confirms the current 12-territory map reaches a stable, contested frontier within a handful of
   turns with no further favorable moves for either side across every persona pairing tested; a
   larger map is the intended way to give the same personas more strategic room to play out, not a
   signal that the AI itself needs further tuning. Re-run `npm run simulate:baseline` and
   `npm run simulate:matrix -- --experiment simulation/experiments/persona-matrix.json ...` against
   any future map to measure the effect before and after.
3. Add polished original pixel sprites, animation atlas, combat/movement animation, and original
   faction music/sound-effect loops (the game is currently silent and uses text-glyph unit icons —
   see the black-box report's audio/art findings, which are out of scope for the gameplay-fix pass
   that shipped alongside this roadmap update).
4. Add Greek League and Ptolemaic Egypt only after Carthage/Rome are stable.
5. Add the optional open-source WebSocket server with reconnection and authoritative validation.
   The Online Room screen already labels this as unavailable rather than presenting a non-functional
   flow as usable.
6. Continue the curated Carthaginian campaign with sourced, qualified historical notes.

Broad diplomacy, open chat, large production trees, and grand-strategy systems are explicitly out of
scope for the first release.
