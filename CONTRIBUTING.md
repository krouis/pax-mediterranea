# Contributing

Use a focused branch and conventional commits. Before opening a pull request, run `npm run check`
and the relevant browser or simulation tests. Keep rules pure, data serializable, visible text
localized in English, French, and Tunisian Arabic, and controls keyboard/touch accessible.

Do not add secrets, tracking, incompatible assets, copied game art, or unsourced claims. Historical
corrections should cite academic, museum, university, peer-reviewed, or carefully contextualized
primary sources. Disclose substantial AI assistance. By contributing, you agree that your original
work is provided under the MIT License.

## Translation contributions

Translators can work entirely inside `src/i18n/locales/<locale>`. Preserve stable keys and
`{{placeholders}}`, consult [the localization guide](docs/LOCALIZATION.md), and use the relevant
glossary. Run:

```bash
npm run validate:i18n
npm run test:i18n
npm run test:e2e:i18n -- --project=chromium
```

For RTL, inspect portrait, landscape, keyboard order, mixed Latin values, and the unmirrored map.
Pull requests should identify reviewer fluency, confirm all namespace files are complete, include
intentional screenshot changes, and request native-speaker review. Substantial AI-assisted
translation must be disclosed and cannot replace fluent review.
