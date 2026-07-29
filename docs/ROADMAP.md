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
3. Original pixel sprites, an illustrated map, faction/pantheon/leader iconography, territory
   interaction-state art, and movement/capture/turn-transition animation have shipped (see
   [docs/ART-DIRECTION.md](ART-DIRECTION.md), [docs/ASSET-MANIFEST.md](ASSET-MANIFEST.md)); the
   game no longer uses text-glyph unit/terrain icons. Remaining: original faction music/sound-
   effect loops (the game still only has four short synthesized UI tones, see
   [docs/AUDIO-DIRECTION.md](AUDIO-DIRECTION.md)), and a true cross-board sliding movement
   animation (currently a territory-level pop/flash, not a token that visibly travels between
   territories — see `design-review/FINAL-UI-REVIEW.md` for why this was scoped out of the first
   animation pass).
4. Add Greek League and Ptolemaic Egypt only after Carthage/Rome are stable. Their emblems already
   exist as Codex-only placeholders (`docs/ASSET-MANIFEST.md`), clearly marked as future/non-
   playable content, alongside portrait art for four historical figures that exist today only as
   an i18n glossary with no other game-state hook.
5. Add the optional open-source WebSocket server with reconnection and authoritative validation.
   The Online Room screen already labels this as unavailable rather than presenting a non-functional
   flow as usable.
6. Continue the curated Carthaginian campaign with sourced, qualified historical notes.

Broad diplomacy, open chat, large production trees, and grand-strategy systems are explicitly out of
scope for the first release.
