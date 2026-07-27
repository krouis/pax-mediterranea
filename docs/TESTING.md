# Testing

`npm run test:coverage` runs deterministic rules, serialization, AI, and transport unit tests with
85/80/85/85 statement/branch/function/line thresholds. `npm run test:integration` targets combined
flows. `npm run test:e2e` runs Chromium desktop and mobile flows; axe checks serious accessibility
issues. Content and localization validators run independently.

`npm run test:ai` executes bounded seeded matches and reports completion, average turns, stalemate
rate, and illegal states. CI uploads coverage and browser reports. Before release, also manually
verify installability, offline reload after one online visit, update prompting, save continuity,
keyboard-only play, reduced motion, and both languages.
