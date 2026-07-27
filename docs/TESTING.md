# Testing

`npm run test:coverage` runs deterministic rules, serialization, AI, and transport unit tests with
85/80/85/85 statement/branch/function/line thresholds. `npm run test:integration` targets combined
flows. `npm run test:e2e` runs Chromium desktop and mobile flows; axe checks serious accessibility
issues. Content and localization validators run independently.

`npm run test:ai` executes bounded seeded matches and reports completion, average turns, stalemate
rate, and illegal states. CI uploads coverage and browser reports. Before release, also manually
verify installability, offline reload after one online visit, update prompting, save continuity,
keyboard-only play, reduced motion, and all required languages.

`npm run validate:i18n` checks 100% namespace/key parity, non-empty values, placeholders, plural
forms, locale metadata, exposed-locale completeness, syntax, and common hard-coded attributes.
`npm run test:i18n` covers detection, fallback, persistence, interpolation, formatting, document
language/direction, and locale-independent game state. `npm run test:e2e:i18n` covers all required
languages, RTL, offline reload, mixed-direction room codes, Arabic tutorial entry, localized axe,
French expansion, and reviewed screenshots.

The Arabic validation stage also rejects a reviewed list of unambiguously dialectal interface terms
and pins formal critical-path wording plus Tunisian historical-name conventions. This lint is a
regression guard, not a replacement for native review. Quoted incorrect examples belong only in
linguistic documentation or rejection tests, outside production locale resources.
