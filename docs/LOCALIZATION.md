# Localization

## Supported locales

The production selector exposes only complete launch locales:

| Locale  | Native name       | Direction | Status                                         |
| ------- | ----------------- | --------- | ---------------------------------------------- |
| `en`    | English           | LTR       | Complete                                       |
| `fr`    | Français          | LTR       | Complete                                       |
| `ar-TN` | 🇹🇳 العربية — تونس | RTL       | Complete; native-speaker review still welcomed |

English is the fallback. Browser detection considers the saved `pax.locale` preference first and
then the browser language. Generic Arabic resolves to `ar-TN`; unsupported languages fall back to
English. Changing the selector updates React, `html[lang]`, and `html[dir]` immediately and persists
locally.

## Resource organization

Each locale under `src/i18n/locales/<locale>/` has matching JSON namespaces:

- `common.json`: brand, settings, language, general actions, status, and pluralized counts;
- `game.json`: modes, phases, rules, combat previews, engine error/event keys, and tutorial text;
- `content.json`: factions, patrons, leaders/cards, units, terrain, and territories;
- `campaigns.json`: scenario narrative translated from the same factual source text;
- `accessibility.json`: map, control, ownership, and screen-reader labels.

Game content stores keys such as `content:patrons.baal-hammon.name`. Core state, saves, CSS,
multiplayer, and tests use stable IDs—not display strings. Save format 2 migrates legacy English
territory/player text to stable keys.

Interpolation uses `{{variable}}`; locale validation requires identical placeholders. Add
`, number`, `, date`, `, time`, or `, list` for the registered `Intl` formatters. Plural entries use
i18next suffixes such as `_one` and `_other`; Arabic resources also provide zero, two, few, and many
forms.

## RTL behavior

`ar-TN` sets the document to RTL. Flex/grid flow, text alignment, inset, and directional arrows use
logical behavior. The geographic map has `dir="ltr"` and a tested `transform: none`, so coastlines
and east/west relationships never mirror. Room codes remain explicitly LTR. Arabic avoids uppercase
and letter spacing. Focus follows DOM order and is checked in Chromium desktop/mobile.

No fonts are downloaded remotely. The UI uses the local system stack with `Noto Sans Arabic`,
Segoe UI, Tahoma, and Arial fallbacks. These names do not bundle font files or licenses; browsers
select an installed shaping-capable font. A future bundled font must be small, offline, compatible
with Arabic shaping, and recorded in `THIRD-PARTY-ASSETS.md`.

## Adding a locale

1. Copy all five English namespace files into a locale directory.
2. Translate meaning in context; preserve keys and interpolation variables.
3. Add complete locale metadata, plural forms, and an entry in `supportedLocales`.
4. Add layout, accessibility, critical-path, offline, persistence, and visual tests.
5. Run `npm run validate:i18n`, `npm run test:i18n`, and `npm run test:e2e:i18n`.
6. Request fluent/native review and document glossary or transliteration choices.

Optional locales are not exposed until every namespace has 100% key coverage, metadata says
complete, validation passes, all critical UI is reviewed in browsers, accessibility is clean,
screenshots are approved, and documentation lists the locale accurately. A partially translated
directory must remain outside `supportedLocales` and production resources.

## Translation checklist

- Preserve factual meaning and historical uncertainty.
- Use the glossary consistently; never translate stable IDs.
- Check interpolation, plural grammar, punctuation, numerals, mixed-direction values, and wrapping.
- Exercise 360×640 portrait, 640×360 landscape, and desktop.
- Confirm no key names appear in UI and no controls clip.
- Review screenshots intentionally; do not blindly update snapshots.
- State reviewer fluency and substantial AI assistance in the pull request.
