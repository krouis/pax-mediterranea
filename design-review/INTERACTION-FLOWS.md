# Interaction Flows — Current vs. Target

Six core flows, current-state (from `src/app/App.tsx` and `src/ui/MapBoard.tsx`) against the
target from the overhaul brief. None of these change the underlying state machine
(`applyAction`/`legalDestinations`/`combatPreview`) — only presentation and feedback.

## Movement

**Current:** Click a friendly unit token (or click its territory, which cycles through friendly
units there) → `legalDestinations` computed, matching territories get `.legal` (yellow pulse) →
click a legal territory → `applyAction({ type: 'MOVE' })` fires immediately → board re-renders
with the unit's territory changed, no transition. Cancel is implicit only (click elsewhere doesn't
explicitly clear selection today except by re-selecting).

**Target:** Same click sequence and legality computation (unchanged — already correct). Add: (1) a
brief highlight-on-select animation on the chosen unit (80–150 ms), (2) a FLIP-transform glide of
the unit token from source to destination territory (200–400 ms) instead of an instant jump, (3) an
explicit, discoverable way to deselect (clicking the selected unit's own token again, or a visible
Cancel affordance matching recruitment's pattern) rather than relying on incidental re-selection.

## Attack

**Current:** Click a friendly unit → click a hostile/enemy-owned legal territory → `pendingAttack`
state set → `PixelDialog`-to-be (`role="alertdialog"`) shows attack/defense numbers and a plain-
text outcome prediction → Cancel clears `pendingAttack`; Attack calls `applyAction({ type:
'ATTACK' })` and closes the dialog with an instant board update.

**Target:** Same legality/preview computation (unchanged). Add: a real `CombatPreview` component
(unit icons for attacker/defender, terrain icon, color+icon-coded outcome badge, not just the word
"defeat"/"victory" in prose) and, on confirm, an attacker-lunge + defender-impact-shake/flash
(250–600 ms) before the board settles into its new state, plus a distinct capture transition
(owner-color cross-fade + flag-plant icon, 300–700 ms) if the territory changes hands.

## Recruitment

**Current:** Click a unit-type button in the recruit row → `recruitSelection` set → eligible
territories (city/port, or port-only for fleet) get `.legal` (same class/visual as movement
targets) → status text explains what's happening → click an eligible territory →
`applyAction({ type: 'RECRUIT' })` fires, `recruitSelection` clears → explicit Cancel button
visible whenever a type is selected.

**Target:** Same eligibility computation (unchanged — already correctly filtered by terrain in
`App.tsx:338-348`). Add: a visually distinct "legal-recruit" state (separate from legal-move/
legal-attack, see the audit's cross-cutting finding #3) and a brief recruitment-arrival animation
on the newly placed unit token. Cancel behavior (already present and correct) is preserved as-is.

## Cards

**Current:** Hand is always visible (max 3, per `player.hand.length`/3 header) as a vertical list
of plain buttons → click a card → `applyAction({ type: 'PLAY_CARD', unitId: selectedUnit })` fires
immediately using whatever unit (if any) is currently selected as the implicit target → error
surfaces via the shared `.status` message if the card requires a target that isn't selected.

**Target:** Same immediate-fire mechanics for cards that don't need a target (economic cards like
Merchant Fleet). For unit-targeted cards, the _current_ implicit "whatever's selected" model stays
mechanically (no engine change), but the redesigned `CardView` should make the target requirement
visually explicit (e.g. a "select a unit first" affordance/disabled state) rather than only
surfacing the requirement reactively as an error message after a failed click — this is a
presentation clarification, not a new interaction step.

## Favor

**Current:** Single "Invoke favor" button, always targets the player's first-found owned territory
(`game.territories.find(...)` — no target picker exists today despite some favors being
territory-directed) → `applyAction({ type: 'INVOKE_FAVOR' })` fires immediately.

**Target:** Preserve the current one-click model exactly (no new target-selection UI is introduced
here — that would be a mechanics change, out of scope for this overhaul). Redesign only the
button into a `PatronBadge` with symbolic icon + patron color + a short glow on successful
invocation, so the flow _feels_ special without changing what it does.

## Turn end

**Current:** "End turn" button always visible in the action panel footer → `applyAction({ type:
'END_TURN' })` → if hotseat, `concealed` overlay shows a "pass the device" prompt with a single
reveal button; if the next player is AI, `runAITurn` resolves synchronously and the board updates
directly to the following human turn; either way `startActionPhase` resets legal actions and a
`turn` sound plays. No confirmation step exists today (matches the brief's "not easy to press
accidentally" only via `min-height: 44px` touch-target sizing, not a confirmation dialog).

**Target:** Preserve the no-confirmation model (adding a confirmation step would be a mechanics/
friction change, not purely visual, and isn't requested). Add a brief `TurnBanner` sweep transition
(<1 s) between turns, reusing the same component for both the AI-resolves-instantly case and the
hotseat pass-device overlay, so turn boundaries read as a discrete beat rather than an instant
state swap.

## Cross-cutting interaction requirements (apply to all six flows)

- Visible current mode: recruitment already shows explicit status text when active; movement/
  attack currently show only implicit state via the `.legal` highlight — the redesign should make
  "what mode am I in" legible via the action panel's own state, not the map alone.
  reliable cancel: recruitment has it, movement doesn't have an explicit one — added per above.
- No silent failure: already true today — every rejected `applyAction` surfaces via the shared
  `role="status"` message; this must be preserved unchanged through the redesign.
- Clear result feedback: today it's an instant re-render; the animation work above adds the missing
  "what just happened" signal without changing what state actually changed.
