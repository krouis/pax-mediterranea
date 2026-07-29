# Accessibility

Accessibility is a release gate. Menus use headings, landmarks, labels, and native controls. The map
provides named territory buttons and keyboard-selectable unit tokens. Focus is visible, touch
targets aim for 44×44 pixels, faction ownership combines color and symbols, and status messages use
live regions. Layout supports 360×640 portrait through large desktop.

Reduced motion follows the OS and an explicit setting; the pixel-art overhaul's new
`animation`/`transition` rules (territory move/capture feedback, the turn-transition banner, card/
favor press feedback — see [`docs/ART-DIRECTION.md`](ART-DIRECTION.md#animation)) are covered by
the same existing `[data-motion='reduced']` / `prefers-reduced-motion` rule with no new
reduced-motion logic. Audio never carries essential information and can be disabled. Test with Tab,
Enter/Space, Escape where applicable, zoomed text, screen-reader landmarks, axe, and Playwright
mobile viewports.

`PixelDialog` (`src/ui/components/PixelDialog.tsx`) is now the shared frame for every dialog
(Settings, History, combat confirmation, and Codex's future dialog needs) and implements a real
focus trap: focus moves to the first focusable element on open, Tab/Shift+Tab stay inside the
dialog, Escape closes it, and focus returns to whatever triggered it — closing the gap this
document previously listed as "planned." `e2e/visual.spec.ts`'s "combat confirmation dialog traps
focus and returns it on close" test exercises this end to end, not just unit-tests the mechanism.
Planned map navigation (arrow/WASD/HJKL spatial focus for the territory graph) remains open.

Every new SVG icon (`src/ui/icons/*.tsx`) is `aria-hidden="true"` and decorative only; the
accessible name for any control that uses one still comes from the surrounding element's existing
`aria-label`/translated text, unchanged from before the icon swap — icons never replace a label,
they sit alongside one. Interaction-state color cues on the map (legal-move/legal-attack/
legal-recruit/objective/threatened) are always paired with a non-color cue (distinct border style,
a corner marker icon), never color alone.

English, French, and formal Arabic accessibility labels share translation parity. Arabic changes
the semantic direction and mirrors directional arrows while the map stays explicitly LTR — the new
`MapBackground` illustration and territory-state icons were verified to preserve this exactly
(`dir="ltr"` on the map section, `[dir='rtl'] .map-shell { transform: none }`). Focus continues in
DOM order, Latin room codes use a local LTR override, and Arabic disables uppercase and letter
spacing. Axe runs in all three required languages on desktop and mobile, plus a dedicated check on
the new Codex screen (`e2e/visual.spec.ts`).
