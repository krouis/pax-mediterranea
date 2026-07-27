# Pax Mediterranea

> Every power promises peace. Only one will achieve it.

Pax Mediterranea is an accessible, synchronous turn-based strategy game inspired by the ancient
Mediterranean during the Punic Wars. It combines handheld-strategy readability with a compact board
game: recruit a small force, cross an illustrated map, time a leader card or divine favor, and earn
8 Pax Points before your rival.

![Pax Mediterranea menu placeholder](public/icons/icon.svg)

**Status:** playable vertical slice under active development. The static build supports solo AI,
local hot seat, a Carthaginian tutorial, one campaign scenario, three launch languages, saves, and
offline installation. The online room screen demonstrates the optional adapter boundary.

Play the latest default-branch build at
[krouis.github.io/pax-mediterranea](https://krouis.github.io/pax-mediterranea/).

## Features

- Deterministic, serializable TypeScript rules with commands, logs, seeded classic variation, and replay-ready state
- Carthage and Rome; infantry, cavalry, fleets; cards; Baal Hammon, Tanit, Jupiter, and Juno
- Compact Mediterranean graph map with cities, ports, plains, hills, mountains, sea, and sacred sites
- Solo AI, local hot seat, tutorial, quick skirmish, and _The Sicilian Question_ campaign scenario
- Complete English, French, and 🇹🇳 Tunisian Arabic interfaces with persisted switching and RTL
- Responsive keyboard/touch UI, reduced motion, color-plus-symbol faction cues, and audio controls
- Prompt-updating service worker, GitHub Pages subpath support, no tracking, and no required account

## Develop

Node.js 24 is pinned in `.nvmrc`.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. Common commands:

```bash
npm run build
npm run check
npm run test
npm run test:e2e
npm run test:ai
npm run validate:maps
```

The production preview lives below `/pax-mediterranea/`:

```bash
npm run build
npm run preview
```

## Repository structure

`src/game` contains DOM-independent rules, AI, and serialization. `src/content` contains validated
game data. `src/app` and `src/ui` contain React screens and semantic controls. `src/audio`,
`src/persistence`, and `src/multiplayer` are capability adapters. `scripts` holds CI validators and
simulations; `e2e` holds browser tests; `docs` contains design and engineering references.

Translation resources live in `src/i18n/locales`. Production-ready locales are English (`en`),
French (`fr`), and Arabic for Tunisia (`ar-TN`). See [Localization](docs/LOCALIZATION.md) and the
[Tunisian Arabic glossary](docs/LOCALIZATION-AR-TN.md).

## Historical, privacy, and AI notes

The game is historically inspired, not a reconstruction. Borders, chronology, forces, and
institutions are simplified; disputed claims should be qualified. Carthage is represented as a
complex Mediterranean civilization rather than merely Rome's antagonist. See
[Historical Notes](docs/HISTORICAL-NOTES.md).

Offline play stores only preferences and game state on the device. There is no analytics,
advertising, tracking, fingerprinting, or open chat. See [Privacy](docs/PRIVACY.md).

Pax Mediterranea is an AI-assisted open-source project created for study, experimentation, and
learning. Design, code, tests, documentation, visual concepts, audio concepts, and historical
summaries may include substantial AI assistance. All material is subject to human review,
correction, licensing checks, and historical verification. See [AI Disclosure](AI_DISCLOSURE.md).

Contributions are welcome under [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). Original project code and assets are MIT licensed.
