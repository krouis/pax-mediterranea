# Final UI Review

This closes out the pixel-art/UI overhaul against the baseline recorded in
[`CURRENT-UI-AUDIT.md`](CURRENT-UI-AUDIT.md) and [`INTERACTION-FLOWS.md`](INTERACTION-FLOWS.md).
Before screenshots: [`screenshots/`](screenshots/). After screenshots:
[`screenshots-after/`](screenshots-after/).

**What this is:** an original ancient-Mediterranean pixel-art strategy presentation, inspired by
the readability and charm of handheld-era tactical games. **What this is not:** a claim of
"Advance Wars art," a copy of any commercial game's assets, or evidence that the redesign itself
makes the game more fun — that still requires human playtesting (see
[`docs/MDA-EVALUATION.md`](../docs/MDA-EVALUATION.md), which this overhaul did not touch).

## What changed

| Area                  | Before                                                                                      | After                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Menu                  | Unicode sun-mark + bare CSS arcs (`en-desktop-01-menu.png`)                                 | Illustrated coastal scene (harbor, ship, city silhouette), distinct "Continue" treatment (`screenshots-after/en-desktop-01-menu.png`)                                                                                    |
| Campaign intro        | Three scattered emoji glyphs (`en-desktop-08-campaign-intro.png`)                           | The same coastal-scene illustration reused as a vignette (`screenshots-after/en-desktop-02-campaign-intro.png`)                                                                                                          |
| Map                   | Flat CSS blobs, no geography, Unicode terrain glyphs (`en-desktop-03-game-board.png`)       | Illustrated landmass/sea backdrop, original terrain/unit icons, distinct legal-move/legal-attack/legal-recruit/objective/threatened states instead of one shared glow (`screenshots-after/en-desktop-03-game-board.png`) |
| Faction identity      | Flat glyph-in-circle emblem (`◇`/`⬡`)                                                       | Original symbolic faction emblems, correctly tinted even when the human player chooses Rome (a pre-existing bug the crest never handled)                                                                                 |
| Cards                 | Plain bordered-rectangle buttons, visually identical to every other button                  | `CardView`: faction-framed left accent, effect-category icon                                                                                                                                                             |
| Combat dialog         | Plain text ("Attack 2 · Defense 3 · Expected: defeat") (`en-desktop-10-attack-preview.png`) | `CombatPreview`: attacker/defender icons, color-coded outcome banner, same numeric transparency preserved exactly (`screenshots-after/en-desktop-04-attack-preview.png`)                                                 |
| Favor button          | Plain full-width button, visually identical to Save/End Turn                                | Distinct gold treatment with the active patron's own icon                                                                                                                                                                |
| HUD                   | Three near-identical inline coin/favor/Pax blocks                                           | `ResourceCounter` component, original icons                                                                                                                                                                              |
| New: Historical Codex | Did not exist                                                                               | `screenshots-after/en-desktop-05-codex.png` — faction emblems (2 real + 2 marked "future"), 4 leader portraits, patron icons, all honestly labeled                                                                       |
| Animation             | None beyond a hover scale and a legal-move pulse                                            | Territory move/capture pop+flash, a turn-transition banner, press feedback on cards/favor — all reduced-motion-safe automatically                                                                                        |
| Dialogs               | Ad hoc Escape handling (History had it, Settings didn't), no focus trap                     | Shared `PixelDialog`: focus trap, Escape-to-close, focus-return, on every dialog                                                                                                                                         |
| RTL                   | Already correct                                                                             | Re-verified correct through the entire rewrite (`screenshots-after/ar-desktop-01-game-board.png`) — map still non-mirrored, all new icons text-free                                                                      |
| Mobile                | Already responsive                                                                          | Re-verified with the new art at 390×844 (`screenshots-after/en-mobile-portrait-01-game-board.png`) — no new breakpoint was needed                                                                                        |

## Design principles applied

- **Presentation-only.** Territory topology, combat math, AI behavior, and save format are
  byte-for-byte unchanged. Every change in this overhaul is presentational.
- **Symbolic, not literal.** Faction emblems, pantheon icons, and leader portraits are geometric/
  symbolic; no likeness is claimed for historical figures, and no religious iconography is
  reproduced verbatim (Tanit's icon is inspired by, not a copy of, the historical "Sign of Tanit").
- **Real content over speculative content.** Assets exist for what's actually in the game
  (Carthage/Rome, 3 unit types, 7 terrain types, 6 cards, 4 patrons); roadmap-only content (Greek/
  Egyptian factions, the 4 leaders) got a dedicated, clearly-labeled home (the Codex) instead of
  being faked into faction-select or gameplay UI.
- **Bundle discipline as a design constraint, not an afterthought.** Every asset is inline SVG in
  React, not a raster sprite sheet — this is why 40+ original icons cost single-digit KB of gzip
  rather than hundreds of KB of PNGs, and why the `dist/` bundle actually _shrank_ relative to the
  branch's start point (disabling production sourcemaps reclaimed far more than the new art cost).
- **State communication through more than color.** Every new interaction-state color on the map
  pairs with a distinct border style or marker icon.

## Tests

- `npm run check` (format/lint/typecheck/coverage/content+i18n validation/build): pass.
- `npm run test:e2e` (chromium + mobile projects): pass, including 11 new tests in
  `e2e/visual.spec.ts` (7 visual baselines, 1 axe check, 1 focus-trap check — the mobile-project
  runs execute the axe/focus-trap checks too, only the screenshot tests are chromium-only).
- `npm run test:integration`: pass.
- `npm run test:coverage` (`src/game/**`, unaffected by this UI-only work): unchanged at
  92.75%/84.17%/97.64%/94.71%, still above the 85/80/85/85 thresholds.
- Manual verification: en/fr/ar-TN × desktop/mobile-portrait/mobile-landscape, all screens listed
  in the audit, re-checked after the full rewrite.

## Known limitations / backlog

1. **Movement is a territory-level pop, not a sliding token.** True FLIP-style animation of a unit
   token crossing the board needs unit tokens to keep a stable DOM identity across `MapBoard`'s
   `groupUnits()` stacking, which the current grouping-by-owner+type architecture doesn't provide.
   Scoped out of this pass rather than shipped half-working; see `docs/ROADMAP.md` item 3.
2. **No music or new sound effects.** The overhaul is visual-only; `src/audio/sound.ts` still has
   only four short synthesized UI tones, unchanged. `docs/AUDIO-DIRECTION.md` already documents
   this as a separate backlog item.
3. **Only one map exists**, so the illustrated landmass backdrop is hand-fit to today's 12
   territories. `docs/ROADMAP.md` item 2's map-expansion work would need a new backdrop (or a
   generative approach) to scale past this map.
4. **`PatronBadge`/`ActionTray`/`UnitBadge` were not built as separate named components.** Their
   intended visual outcomes were achieved directly (the favor button's gold treatment and pantheon
   icon; the existing recruit-row markup restyled in place; `UnitIcon` used directly in `MapBoard`)
   without introducing three additional thin wrapper components that would have added indirection
   without changing what actually renders. If a future pass needs to reuse the favor-button or
   recruit-row treatment somewhere else, extracting them at that point is straightforward.
5. **Unit-icon fill weight.** The 18–22px unit tokens read correctly (ownership ring color +
   white icon silhouette, matching the "strong silhouette, high-chroma faction distinction"
   principle) but the icons themselves are visually dense at that size; a follow-up pass could
   thin the strokes for a lighter look at the smallest map zoom levels.
6. **No tablet-specific breakpoint was added.** Visual testing at 390×844 and 1280×800 showed the
   existing two breakpoints (780px/520px) already handle the new art correctly; a tablet tier
   wasn't added since nothing demonstrated a real gap, per the plan's "only if testing shows a
   need" scoping.

## Reviewing the build

```bash
npm ci
npm run build && npm run preview
```

Then open `http://127.0.0.1:4173/pax-mediterranea/` (or whatever port `preview` reports).
