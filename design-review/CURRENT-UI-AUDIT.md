# Current UI Audit

Captured against `feat/simulation-engine` @ `4f24863` (the base of this overhaul), production
build served via `vite preview`. Screenshots referenced below live in
[`design-review/screenshots/`](screenshots/) and are not committed en masse — this file quotes a
curated representative set, same convention as `test-report/evidence/screenshots/`.

Overall: the game is mechanically complete and the color palette/typography choices (muted
Tyrian purple for Carthage, desaturated crimson for Rome, warm parchment panels) are already a
reasonable starting point. What's missing is everywhere at once: there is no illustration, no
original iconography (literal Unicode glyphs stand in for every unit/terrain/action icon), no
depth/shading, and every panel is a flat, uniformly-rounded rectangle — it reads as a well-organized
HTML form, not a game board. This matches `docs/ROADMAP.md` item 3's own assessment.

## Main menu (`en-desktop-01-menu.png`)

- **Works:** Clear title hierarchy (eyebrow / title / tagline), primary action visually
  distinguished (purple gradient "Quick Skirmish" vs. flat parchment for the rest), footer trust
  signals (offline/no-tracking/open-source) build confidence, decorative arcs in the corners hint
  at motion without being distracting.
- **Unfinished:** The "sun-mark" `✦` above the title is the single largest piece of "art" on the
  entire screen and it's a Unicode character with a CSS drop-shadow. The corner arcs are bare
  `border-radius` circles, not a coastline/harbor scene. There is no sense of place — nothing on
  this screen says "ancient Mediterranean" except the copy.
- **Hard to understand:** Nothing — the menu is legible and the six mode buttons are self-
  explanatory via icon+label+subtext.
- **Lacks hierarchy:** All five secondary buttons (Campaign/Hot Seat/Tutorial/Online, plus the
  implicit sixth "Continue" when a save exists) are visually equal weight; a returning player with
  a save in progress has no more prominence pointing them to "Continue" than a first-time player
  choosing "Tutorial."
- **Breaks pixel-art direction:** Every icon is a Unicode glyph (`⚔ ▶ ♜ ♟ ⌁ ✦`) rendered at whatever
  size/weight the system font happens to give it — inconsistent stroke widths, no shared visual
  language between them.
- **What should change:** Replace the sun-mark and corner arcs with an actual illustrated scene
  (harbor, ship, city silhouette against a stylized sea), replace all six mode icons with a
  matched icon set, add a distinct "Continue" treatment when a save exists (this is the single
  highest-value hierarchy fix on the whole screen).

## Faction/patron selection (`en-desktop-02-mode-select-faction.png`)

- **Works:** Side-by-side comparison layout is immediately legible; faction identity (purple vs.
  crimson) is consistent with later screens.
- **Unfinished:** The "emblem" is a flat colored circle containing a single Unicode glyph (`◇` for
  Carthage, `⬡` for Rome) — these read as placeholder icons, not faction crests. No pattern,
  silhouette, or texture differentiates the two beyond hue.
- **Hard to understand:** Nothing structurally, but there's no visual cue for _why_ a patron
  matters strategically (both patron buttons look identical regardless of what the favor does).
- **Lacks hierarchy:** Patron description text is the same size/weight as its name; a player
  skimming won't easily compare "Prosperity and civic endurance" vs. "Protection and resilience."
- **Breaks pixel-art direction:** The emblem glyphs, plus flat parchment cards with a single drop
  shadow, look like a settings form, not a civilization-select screen.
- **What should change:** Real faction emblem art (still symbolic, not literal), a small per-patron
  icon (see Pantheon icon set), and a stronger card frame treatment per faction.

## Campaign intro (`en-desktop-08-campaign-intro.png`)

- **Works:** Narrative copy, objective, and historical note are clearly separated and the parchment
  background reinforces "campaign/story mode" as visually distinct from skirmish setup.
- **Unfinished:** The "campaign illustration" is three Unicode glyphs (`⛵ ♜ ▲`) sitting on two flat
  color bands meant to suggest sea/land — at native size these render as a tiny sailboat emoji, a
  chess-rook "tower," and a triangle "mountain" floating with huge gaps between them. This is the
  single most obviously placeholder visual in the whole app.
- **Hard to understand / hierarchy:** Fine as text; the illustration band adds no information.
- **Breaks pixel-art direction:** Directly contradicts it — default system emoji rendering next to
  a hand-styled title is the clearest "still an HTML prototype" moment in the app.
- **What should change:** Replace with a real illustrated coastal scene (this is a perfect home for
  a small hand-authored SVG vignette — ship, city silhouette, hills — reusing the same primitives
  as the main-menu hero scene).

## Tutorial (not separately screenshotted — inline overlay, see `App.tsx:599-612`)

- **Works:** The tip overlay is unobtrusive (fixed bottom-left, `pointer-events: none` except its
  own skip button) and event-gated (advances on real game actions, not a fixed script — this is
  already correct per `test-report/FIX-VALIDATION-REPORT.md`'s PM-UI-004 fix).
- **Unfinished:** Visually it's just another parchment-toned box with a numbered badge; nothing
  distinguishes "this is a coaching tip" from "this is a status message" at a glance.
- **What should change:** A distinct tutorial-specific frame/mascot treatment so it doesn't compete
  visually with the `.status` role="status" messages that already use a similar tan box.

## Game board / map (`en-desktop-03-game-board.png`, `en-mobile-portrait-02-game-board.png`)

- **Works:** The 12-territory graph is spatially readable, connection lines clarify adjacency,
  owner-color border rings are consistent, the sea gradient + faint animated diagonal-stripe
  "waves" already gesture at texture.
- **Unfinished:** Every territory is an identical organic-blob shape distinguished only by a CSS
  `clip-path` triangle for mountains and a size shrink for sea — there is no actual coastline,
  landmass, or geography. "Sicily" and "Carthage" look like the same shape in different colors.
  Terrain icons (`· ♒ ▲ ▦ ⚓ ≈ ✦`) are inconsistent-weight Unicode glyphs. The "MARE INTERNVM" sea
  label is plain rotated text with no texture behind it.
- **Hard to understand:** Territory name labels wrap awkwardly at current width (visible on
  "Balearic Isle[s]" in the mobile capture, and "Magna Graecia" nearly overflows its own border on
  desktop) — a real layout/typography problem, not just aesthetic.
- **Lacks hierarchy:** Legal-move highlighting (`.legal`, a yellow glow + pulse) is the _only_
  state distinction available; recruit-eligible territories reuse the exact same glow (confirmed
  in `en-desktop-05-recruit-placement.png` — the eligible cities/ports pulse identically to a
  legal attack/move target), so a player can't tell "I can move here" from "I can recruit here"
  without reading the side panel.
- **Breaks pixel-art direction:** No terrain art, no landmass, no port/city miniatures — this is
  the single highest-value target of the whole overhaul (brief §6).
- **What should change:** Full illustrated landmass/sea background (Pass 2), original terrain
  icons, and genuinely distinct visual states per interaction type (friendly/enemy/selected/
  legal-move/legal-attack/legal-recruit/objective/threatened), not one shared glow.

## Unit selection & stacks (`en-desktop-04-unit-selected.png`)

- **Works:** `groupUnits()` already does the right thing mechanically — units of the same
  owner+type on one territory collapse into a single token with a count badge, and clicking cycles
  through the stack. This directly resolves `test-report/UI-UX-AND-VISUAL-CRITIQUE.md` item #2
  ("stacked unit text overlap") — that critique item is **stale** against current code.
  Selection state (`translateY(-6px)` + gold outline) is visible.
  the acted/unacted state is tracked (`unit.acted`) but not currently surfaced visually.
- **Unfinished:** Unit tokens are plain colored circles containing a chess-glyph — no shape
  distinction between infantry/cavalry/fleet beyond the character inside.
- **What should change:** Real unit iconography with actual silhouette differentiation (shield vs.
  horse vs. hull, brief §7), and a visible dimmed/desaturated treatment for `acted: true` units so
  a player can see at a glance which units still have actions available this turn.

## Recruitment (`en-desktop-05-recruit-placement.png`)

- **Works:** The flow is coherent and already matches the brief's target (`choose unit type →
eligible territories highlight → choose location → confirm cost`) — this resolves
  `PM-GAME-002` per `FIX-VALIDATION-REPORT.md`. Cancel is present and obvious.
- **Unfinished:** As noted above, eligible-for-recruitment territories glow with the identical
  `.legal` treatment as legal move/attack targets — genuinely ambiguous the first time, only
  resolved by reading the status text.
- **What should change:** A distinct "legal-recruit" visual state (brief §6.2) — different outline
  color or a small recruit-flag icon, not the same pulse as combat/movement targets.

## Attack preview (`en-desktop-10-attack-preview.png`)

- **Works:** Attack/defense numbers and an explicit outcome prediction ("Expected: defeat") are
  shown before commit — genuinely good, already prevents the accidental-loss failure mode. Confirm
  is `autoFocus`ed and distinctly styled from Cancel.
  is exactly what a combat-confirmation UI should convey.
- **Unfinished:** The dialog is a flat parchment card centered on a dim scrim — no combat-specific
  visual identity (no unit portraits, no attacker/defender iconography, no color-coded outcome
  besides the plain word "defeat").
- **What should change:** A dedicated `CombatPreview` component (brief §8.3) showing the actual
  attacking/defending unit icons, territory terrain, and a visually distinct favorable/unfavorable
  treatment (not just text) — while keeping the existing numeric transparency, which is a real
  strength worth preserving exactly.

## Cards (`en-desktop-03-game-board.png`, right panel)

- **Works:** All three hand cards are always visible with name + effect text, no hidden state.
- **Unfinished:** Cards are unstyled bordered rectangles, visually identical to the recruit-row
  buttons and the invoke-favor button below them — nothing marks a card as a distinct, tactile game
  object (brief §8.5 calls this out directly).
- **What should change:** A real `CardView` component: faction-framed border, a small icon keyed
  to the card's effect category, clearer selected/targeting state (currently just default button
  focus).

## Pantheon favors (`en-desktop-03-game-board.png`, "Invoke favor" button)

- **Works:** Present, one click, clearly labeled with the active patron's name.
- **Unfinished:** It's a plain full-width button with a `✦` glyph prefix — visually
  indistinguishable from "Save" or "End turn" below it despite being a much rarer, more special
  action (limited by `favor`/turn budget).
- **What should change:** A distinct `PatronBadge` treatment (brief §8.6 — "special but restrained":
  symbolic icon, patron color, short glow on use), separated from the plain action buttons.

## History panel (`en-desktop-06-history-panel.png`)

- **Works:** Chronological event log, scrollable, `Escape`-to-close, `autoFocus` on close — this
  fully resolves `test-report/UI-UX-AND-VISUAL-CRITIQUE.md` item #3 ("no historical game log");
  that critique item is **stale** against current code.
- **Unfinished:** Visually identical parchment-dialog treatment as every other dialog in the app —
  fine functionally, but a good candidate for the shared `PixelDialog` frame rather than a one-off.

## Victory / defeat (not captured — requires playing to completion; verified via `styles.css:759-766`

and `App.tsx:659-671`)

- **Unfinished:** A single centered `✦` glyph at 5rem plus a title and one button — the least
  ceremonious moment in the entire game gets the least visual treatment. No distinction between a
  narrow/decisive win, no faction-colored treatment, no animation.
- **What should change:** This is explicitly brief §10's "victory/defeat" animation target — the
  payoff moment deserves the most polish per elapsed-time-to-value, not the least.

## Settings (`en-desktop-07-settings.png` — not captured but structurally identical to History)

- **Works:** Three clear toggles (motion/sound/music) plus language selector, all native form
  controls (real accessibility for free).
- **Unfinished:** Generic dialog chrome, no visual distinction from History/Attack-confirm.
- **Gap not visual:** No Escape-to-close handler exists on `SettingsDialog` (confirmed absent in
  `src/ui/SettingsDialog.tsx` — `HistoryPanel` has one, `SettingsDialog` doesn't) and neither
  dialog implements a real focus trap — Tab can escape to background content. This is a real,
  already-documented accessibility gap (`docs/ACCESSIBILITY.md`'s "planned... stronger dialog focus
  trapping") that `PixelDialog` should close for every dialog, not just cosmetically restyle.

## Online/multiplayer stub (`en-desktop-09-online-stub.png`)

- **Works:** Already honestly labeled unavailable with working alternative buttons (Quick
  Skirmish, Local Hot Seat) surfaced on the same screen — this is the `PM-MULTI-011` fix from
  `FIX-VALIDATION-REPORT.md`, and it's good.
- **Unfinished:** Same generic parchment-panel treatment as every sub-page; no visual distinction
  for "this is a stub, not a real feature."

## Mobile portrait (`en-mobile-portrait-01-menu.png`, `en-mobile-portrait-02-game-board.png`)

- **Works:** Layout genuinely reflows (map on top, action panel below, single-column menu) rather
  than just shrinking — the two existing breakpoints (780px/520px) are doing real work already.
- **Unfinished:** Territory name-label wrapping is worse at this size ("Balearic Isle[s]" clips its
  final letter against the token's rounded edge); the map itself is cramped (430px min-height on
  the smallest breakpoint) with 12 small tokens all requiring precise taps.
- **What should change:** Larger effective tap targets via better token spacing once illustrated
  art replaces the flat blobs (art can carry more visual weight in less literal space than text
  labels currently need), and a second look at whether map pan/zoom (brief §11) is needed once real
  content is added — not presumed necessary today given the current layout already fits.

## Mobile landscape (`en-mobile-landscape-01-game-board.png`)

- **Works:** This is already close to the brief's stated goal ("strongest mobile play mode") —
  side-by-side map+panel survives down to 844×390 without breaking.
- **Unfinished:** Same iconography/illustration gaps as desktop, nothing landscape-specific.

## Arabic RTL (`ar-desktop-01-menu.png`, `ar-desktop-02-faction-select.png`, `ar-desktop-03-game-board.png`)

- **Works:** This is the strongest area of the current app. Full interface mirrors correctly
  (action panel moves to the left, text aligns right), the map correctly stays **unmirrored** and
  `dir="ltr"` (confirmed — Sicily/Sardinia/Iberia keep their real west-to-east relationship even
  though the panel around them flips), Arabic renders cleanly via Noto Sans Arabic with no tofu/
  fallback glyphs, numerals and layout read naturally.
- **Unfinished:** Nothing RTL-specific is broken — the only gaps visible are the same
  iconography/illustration gaps present in every locale (Unicode glyphs are, correctly, not
  mirrored or altered for Arabic, but they're still generic Unicode glyphs).
- **What should change:** Nothing structural — this overhaul's job is to _preserve_ this behavior
  exactly while reskinning everything around it. Every new icon must stay text-free so it never
  needs a translated variant, and the map's `dir="ltr"` / non-mirror guarantee must survive the
  `MapBoard`/`MapBackground` rewrite unchanged.

## Cross-cutting findings

1. **Bundle-size discipline required.** All art must be inline SVG-as-React-component, not raster
   files — see the plan's Context section (`dist/` is already 3780/4096 KB before this overhaul).
2. **Every dialog shares one generic frame.** Settings/History/Attack-confirm/Victory would all
   benefit from one shared `PixelDialog` component — both visually and for the focus-trap fix.
3. **State communication relies almost entirely on one glow effect** (`.legal`) reused for three
   different meanings (legal move, legal attack, legal recruit) — the single highest-value
   structural fix for map readability.
4. **Two UI-UX-CRITIQUE.md items are stale** against current code (stacked-unit overlap, missing
   history log) and should not be relitigated as if still open; a third (contradictory campaign
   objective panel) also appears already resolved (`App.tsx:471-474` correctly branches on
   `activeScenario`).
