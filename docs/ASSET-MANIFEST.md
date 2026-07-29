# Asset manifest

All visual assets added by the pixel-art/UI overhaul are original, hand-authored inline SVG React
components — no raster files, no external source material, no likeness of any real artwork. Every
entry below follows the same attribution schema as
[`docs/THIRD-PARTY-ASSETS.md`](THIRD-PARTY-ASSETS.md) even though nothing here is third-party;
this file exists so future original assets have one place to be listed and reviewed, per that
doc's own "any future attribution-required asset must list ... here before merging" convention —
this file is the "here" for original, project-authored visual assets specifically, while
`THIRD-PARTY-ASSETS.md` remains the record for anything not authored for this project.

| Asset                                                                                                                                            | Authoring method                        | License | Source file                        | Exported unit                     | Dimensions                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ------- | ---------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| Coastal scene illustration (harbor, ship, city silhouette, sea)                                                                                  | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/icons/CoastalScene.tsx`    | `CoastalScene`                    | `viewBox 0 0 160 60`                                       |
| Mediterranean landmass/sea backdrop                                                                                                              | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/board/MapBackground.tsx`   | `MapBackground`                   | `viewBox 0 0 100 100` (matches territory coordinate space) |
| Terrain icons: plains, hills, mountains, city, port, sea, sacred                                                                                 | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/icons/TerrainIcons.tsx`    | `TerrainIcon`                     | `viewBox 0 0 24 24`                                        |
| Unit icons: infantry, cavalry, fleet                                                                                                             | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/icons/UnitIcons.tsx`       | `UnitIcon`                        | `viewBox 0 0 24 24`                                        |
| Faction emblems: Carthage, Rome (real)                                                                                                           | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/icons/FactionEmblems.tsx`  | `FactionEmblem`                   | `viewBox 0 0 32 32`                                        |
| Faction emblems: Greek League, Ptolemaic Egypt (ROADMAP item 4 placeholders, Codex-only)                                                         | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/icons/FactionEmblems.tsx`  | `FactionEmblem`                   | `viewBox 0 0 32 32`                                        |
| Pantheon icons: Baal Hammon, Tanit, Jupiter, Juno (real)                                                                                         | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/icons/PantheonIcons.tsx`   | `PantheonIcon`                    | `viewBox 0 0 24 24`                                        |
| Pantheon icon: Melqart (documented `LOCALIZATION-AR-TN.md` glossary placeholder, Codex-only)                                                     | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/icons/PantheonIcons.tsx`   | `PantheonIcon`                    | `viewBox 0 0 24 24`                                        |
| Leader portraits: Dido, Hannibal Barca, Hamilcar Barca, Hasdrubal Barca (symbolic, non-literal — no historical likeness is attested; Codex-only) | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/icons/LeaderPortraits.tsx` | `LeaderPortrait`, `PortraitFrame` | `viewBox 0 0 48 48`                                        |
| Action/HUD icons: coins, favor, Pax, settings, save, end turn, history, attack-boost, refresh                                                    | Hand-authored SVG, AI-assisted (Claude) | MIT     | `src/ui/icons/ActionIcons.tsx`     | `ActionIcon`                      | `viewBox 0 0 20 20`                                        |

## Scope notes

- Greek/Egyptian emblems and the four leader portraits render **only** inside the Codex screen
  (`src/ui/screens/CodexScreen.tsx`), each visually marked as future/non-playable content — see
  `docs/ROADMAP.md` item 4. No other screen references them, and no game-state, save-format, or
  content-schema field was added to accommodate them.
- No pantheon icon exists for any deity absent from this project's actual content or documented
  glossary (`docs/LOCALIZATION-AR-TN.md`). Melqart is included because that document already names
  it as a reserved future patron; nothing else was invented.
- Every icon is text-free (pure vector shapes, `aria-hidden="true"`) so none of them ever need a
  translated variant, and none require RTL mirroring except the two directional-arrow glyphs,
  which reuse the pre-existing `.directional-arrow` CSS mirroring class.
- All icons render as inline SVG inside React components — nothing is a separate binary asset
  file, so there is nothing new for the PWA's `workbox.globPatterns` (`vite.config.ts`) to
  precache, and no impact on the third-party font attribution table in
  [`docs/THIRD-PARTY-ASSETS.md`](THIRD-PARTY-ASSETS.md).
