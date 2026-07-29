# Art direction

Handheld readability, an illustrated ancient atlas, and a tabletop diorama — reinterpreted, not
copied, from any commercial strategy game. Every asset is a hand-authored inline SVG React
component (`src/ui/icons/`), not a raster sprite sheet: this keeps the whole art system inside the
JS bundle's existing gzip, needs no new build-time asset pipeline, and lets every icon pick up
faction/terrain color via `currentColor`/CSS custom properties instead of being pre-baked per
palette. See [`docs/ASSET-MANIFEST.md`](ASSET-MANIFEST.md) for the full per-asset list.

## Palette

Defined once in `src/ui/tokens.css`, consumed everywhere else via `var(--token)`. The legacy
`--purple`/`--rome`/`--gold`/etc. names in `src/ui/styles.css` are kept as aliases onto these
tokens so existing rules don't need a rewrite.

| Role                       | Token                                                                                      | Value                                   |
| -------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------- |
| Sea                        | `--color-sea-deep` / `-mid` / `-bright` / `-foam`                                          | `#123a4d` `#1f6e83` `#3d94a7` `#bce7e8` |
| Land                       | `--color-sand` / `-sand-dark` / `-limestone` / `-ivory`                                    | `#d9b877` `#a9803f` `#f0d6a5` `#f5dfb2` |
| Vegetation                 | `--color-olive` / `-cypress`                                                               | `#6f7d3c` `#364a34`                     |
| Clay/mountains             | `--color-terracotta` / `-clay`                                                             | `#b9633f` `#8a5a34`                     |
| Metals                     | `--color-bronze` / `-gold` / `-gold-bright`                                                | `#a8703e` `#d6a640` `#f3c952`           |
| Carthage                   | `--color-carthage` / `-dark` / `-bright`                                                   | `#603263` `#321e43` `#9c65a2`           |
| Rome                       | `--color-rome` / `-dark` / `-bright`                                                       | `#a83c39` `#6b201f` `#cf6457`           |
| Future Greece (Codex only) | `--color-greece` / `-bright`                                                               | `#3f6ea8` `#d9c98f`                     |
| Future Egypt (Codex only)  | `--color-egypt` / `-bright`                                                                | `#1f7a7a` `#d6b23a`                     |
| Interaction state          | `--color-legal-move` / `-attack` / `-recruit` / `-objective` / `-threatened` / `-captured` | see `tokens.css`                        |

Every faction also gets an emblem, not just a hue — see `src/ui/icons/FactionEmblems.tsx`.

## Icon grid

| Category                                             | Grid             | Component                                 |
| ---------------------------------------------------- | ---------------- | ----------------------------------------- |
| Small UI/action icons                                | 16–20 logical px | `src/ui/icons/ActionIcons.tsx`            |
| Units                                                | 24×24            | `src/ui/icons/UnitIcons.tsx`              |
| Terrain                                              | 24×24            | `src/ui/icons/TerrainIcons.tsx`           |
| Faction emblems, pantheon icons                      | 32×32 / 24×24    | `FactionEmblems.tsx`, `PantheonIcons.tsx` |
| Leader portraits (Codex only, symbolic, non-literal) | 48×48            | `src/ui/icons/LeaderPortraits.tsx`        |

All icons use `shapeRendering="crispEdges"` and integer-coordinate shapes so they read as pixel
art at any CSS scale, never anti-aliased blur. Infantry get an oversized shield silhouette,
cavalry a chunky horse-and-rider silhouette, and fleets a compact hull-and-sail silhouette — each
must stay a distinct, recognizable shape at 18–22px and in grayscale (a real check performed
during Pass 3, not just a stated goal).

## Map

The landmass/sea backdrop (`src/ui/board/MapBackground.tsx`) is one SVG using the same
`viewBox="0 0 100 100"` percentage coordinate space as `Territory.position` in
`src/content/gameContent.ts`, so it lines up under the territory graph without any topology
change. Territory interaction states are genuinely distinct, not one shared glow: legal-move,
legal-attack, legal-recruit, selected, objective, and threatened each get their own color/border/
marker combination (`src/ui/styles.css`'s `.territory.legal-*` etc. rules) — always paired with a
non-color cue (border style, corner marker, icon), never color alone.

## Animation

Plain CSS `animation`/`transition`, timed per interaction (`--duration-*` tokens in
`tokens.css`): selection ~120ms, a territory pop on move ~320ms, a brighter pop+flash on capture
~500ms, a turn-transition banner sweep ~900ms. All of it is automatically neutralized by the
existing `[data-motion='reduced']` / `prefers-reduced-motion` rules — new animation work never
needs its own reduced-motion branch, it only needs to use `animation`/`transition` like everything
else already does.

## Density and accessibility constraints (unchanged, still binding)

Acceptable density exposes topology, ownership, units, and legal moves immediately. Unacceptable
density layers labels, particles, textures, banners, and decoration until connections disappear.
Maintain 4.5:1 text contrast, 44×44 touch targets, visible focus, and non-color cues. All work
must be original or compatibly licensed and listed in
[`docs/ASSET-MANIFEST.md`](ASSET-MANIFEST.md) (new, project-original assets) or
[`docs/THIRD-PARTY-ASSETS.md`](THIRD-PARTY-ASSETS.md) (attribution-required third-party
material — currently only the bundled fonts).
