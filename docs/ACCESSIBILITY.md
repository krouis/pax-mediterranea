# Accessibility

Accessibility is a release gate. Menus use headings, landmarks, labels, and native controls. The map
provides named territory buttons and keyboard-selectable unit tokens. Focus is visible, touch
targets aim for 44×44 pixels, faction ownership combines color and symbols, and status messages use
live regions. Layout supports 360×640 portrait through large desktop.

Reduced motion follows the OS and an explicit setting. Audio never carries essential information
and can be disabled. Test with Tab, Enter/Space, Escape where applicable, zoomed text, screen-reader
landmarks, axe, and Playwright mobile viewports. Planned map navigation adds arrow/WASD/HJKL spatial
focus and stronger dialog focus trapping.

English, French, and formal Arabic accessibility labels share translation parity. Arabic changes
the semantic direction and mirrors directional arrows while the map stays explicitly LTR. Focus
continues in DOM order, Latin room codes use a local LTR override, and Arabic disables uppercase and
letter spacing. Axe runs in all three required languages on desktop and mobile.
