# Architecture

The engine is a DOM-independent TypeScript state machine. `GameState` is explicit JSON-safe data;
each `GameAction` passes through `applyAction`, which clones, validates, resolves, and records the
result. A seeded xorshift generator supports reproducible optional variation.

```mermaid
flowchart LR
  UI[React + semantic HTML] --> A[GameAction]
  AI[Deterministic AI] --> A
  MP[Transport adapter] --> A
  A --> V[Validation + rules]
  V --> S[Serializable GameState]
  S --> UI
  S --> Save[Save / replay]
```

Content is defined in `src/content` and checked for schema, ID, and graph errors in CI. React owns
menus and accessible controls; SVG/HTML renders the small graph map without making rules depend on
the renderer. Persistence uses versioned JSON and device-local storage; IndexedDB is the planned
multi-slot adapter. AI evaluates public state only and is bounded to prevent loops.

`src/ui` is organized by role, all presentational, none of it imported by `src/game`: `screens/`
holds one component per top-level `Screen` (menu, campaign intro, online stub, faction select,
Codex — the game screen itself stays in `src/app/App.tsx`, which owns screen routing and all game
logic); `board/` holds the map (`MapBoard`, `MapBackground`); `icons/` holds every original SVG
icon component (terrain, units, faction emblems, pantheon, leader portraits, action/HUD icons —
see [`docs/ASSET-MANIFEST.md`](ASSET-MANIFEST.md)); `components/` holds shared, reusable UI
primitives (`PixelButton`, `PixelPanel`, `PixelDialog`, `FactionBadge`, `ResourceCounter`,
`CardView`, `CombatPreview`, `TurnBanner`). `src/ui/tokens.css` is the single source of truth for
the design-token palette/spacing/type-scale/animation-duration system; `src/ui/styles.css`
`@import`s it and keeps the legacy CSS variable names as aliases so existing selectors didn't need
a rewrite. See [`docs/ART-DIRECTION.md`](ART-DIRECTION.md) for the full visual system.

i18next supplies five JSON namespaces for each complete locale, with English fallback, browser and
saved-language detection, interpolation, plural rules, and `Intl` formatting. Content data and
engine events reference stable translation keys. React translates only at the display boundary.
Locale switching updates document language/direction without altering deterministic state. Save
format 2 removes legacy translated territory/event values.

The PWA precaches the static shell with explicit update prompting and outdated-cache cleanup. Vite's
base is `/pax-mediterranea/`. Multiplayer is transport-independent: the optional server/peer layer
carries signed, sequenced commands, while the same authoritative rules validate them. Vitest covers
rules; Playwright covers flows, mobile layouts, PWA-facing behavior, and accessibility.

`src/game/simulation` is a DOM-independent, Node-runnable design-analysis layer that plays batches
of deterministic matches through the same `applyAction`/`startActionPhase` rules engine, never
re-deriving combat/income/victory logic. It has no dependency on the app bundle (nothing under
`src/app`/`src/ui` imports it, so it does not ship to the browser) and is exercised only via
`scripts/simulate*.ts` and `vitest`. See [Simulation](SIMULATION.md).
