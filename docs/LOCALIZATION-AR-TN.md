# Arabic localization for Tunisia (`ar-TN`)

## Language standard and audience

The `ar-TN` locale uses Modern Standard Arabic for all prose and interface text. The Tunisian
locale designation is used to prefer historical names, transcriptions, terminology, and
conventions familiar in Tunisia, especially for Carthaginian and North African history.

The interface is intended for a broad Arabic-reading Tunisian audience. It uses concise,
contemporary formal Arabic rather than Tunisian dialect, ornate literary prose, or bureaucratic
phrasing. `ar-TN` is a modern interface locale and is not represented as the historical language
of ancient Carthage. Historical summaries translate the same source text as the other locales.

## Interface glossary

| English     | Preferred Arabic    | Notes                              |
| ----------- | ------------------- | ---------------------------------- |
| Play        | ابدأ                | Short primary action               |
| Continue    | متابعة              | Not the dialectal `كمّل`           |
| Campaign    | الحملة              |                                    |
| Quick match | مباراة سريعة        |                                    |
| Multiplayer | لعب جماعي           | `اتصال اللاعبين` for transport UI  |
| Turn        | الدور               |                                    |
| End turn    | إنهاء الدور         |                                    |
| Move        | تحريك / الحركة      | Action/noun                        |
| Attack      | هجوم / الهجوم       | Action/noun                        |
| Recruit     | تجنيد / التجنيد     | Action/noun                        |
| Capture     | احتلال / السيطرة    | Action/result according to context |
| City        | مدينة               |                                    |
| Port        | ميناء               |                                    |
| Fleet       | الأسطول             |                                    |
| Infantry    | المشاة              |                                    |
| Cavalry     | سلاح الفرسان        |                                    |
| Coins       | القطع               | Abstract game currency             |
| Favor       | الحظوة              | A favor, not destructive magic     |
| Pantheon    | مجمع الآلهة         | Used in explanatory prose          |
| Victory     | انتصار              |                                    |
| Defeat      | هزيمة               |                                    |
| Settings    | الإعدادات           |                                    |
| Save        | حفظ                 |                                    |
| Load        | تحميل               |                                    |
| Offline     | دون اتصال بالإنترنت |                                    |
| Room code   | رمز الغرفة          | Value remains LTR                  |

## Reviewed historical-name glossary

Stable IDs never change with display language.

| Internal ID       | English         | Preferred Arabic |
| ----------------- | --------------- | ---------------- |
| `dido`            | Dido / Elissa   | عليسة            |
| `hannibal-barca`  | Hannibal Barca  | حنبعل برقة       |
| `hamilcar-barca`  | Hamilcar Barca  | أميلكار برقة     |
| `hasdrubal-barca` | Hasdrubal Barca | صدربعل برقة      |
| `carthage`        | Carthage        | قرطاج            |
| `carthaginian`    | Carthaginian    | قرطاجي           |
| `punic`           | Punic           | بوني             |
| `baal-hammon`     | Baal Hammon     | بعل حمون         |
| `tanit`           | Tanit           | تانيت            |
| `melqart`         | Melqart         | ملقرت            |
| `numidia`         | Numidia         | نوميديا          |
| `masinissa`       | Masinissa       | ماسينيسا         |

`أميلكار` is preferred in the Tunisian locale; `حملقار` is recorded as a known Arabic variant.
The Barca family name is consistently `برقة`, never the phonetic English-derived `باركا`.
Tunisian sources also vary between `بعل حمون`, `بعل حمّون`, and `بعل حامون`; the project uses
`بعل حمون` consistently.

## Evidence and naming review

- Tunisia's National Heritage Institute uses `حنبعل` and describes Punic history in its
  [illustrated history of Tunisia](https://www.inp2020.tn/ar/inp_tunisie/les-traces-de-lhomme-en-tunisie/).
- The National Heritage Institute uses `تانيت` and both `بعل حمون`/`بعل حمّون` in its
  [Bardo Museum catalog](https://www.inp2020.tn/ar/2019/12/26/musee-national-du-bardo/) and
  [2025 excavation report](https://www.inp2020.tn/ar/2025/07/31/travaux_scientifiques_temple_tanit_et_baal_hammon/).
- Tunisia's National Library catalogs the founder as
  [عليسة](https://www.bibliotheque.nat.tn/BNTK/doc/SYRACUSE/6245472/%D8%B9%D9%84%D9%8A%D8%B3%D8%A9?_lg=ar-TN).
- Tunisia's educational network uses `عليسة`, `حنبعل`, `ماسينيسا`, and `ملقرت` in its
  [Carthage overview](https://www.edunet.tn/ressources/site_etab/regional/primaire/el-ahd-el-jedid-ezzarat/_private/journ/_private/biladi/adhar/a.htm).
- The Tunisian heritage portal Turathy uses `حملقار` and `صدر بعل` as variants in its
  [Hannibal profile](https://turathy.tn/article/%D8%AD%D9%86%D8%A8%D8%B9%D9%84).

Sources were reviewed on 2026-07-27. They establish Tunisian usage but do not eliminate every
scholarly transcription dispute.

## Numerals, typography, and bidirectionality

Ordinary quantities use `Intl.NumberFormat` with `ar-TN`; the runtime therefore applies the
locale's numeral conventions consistently. Room codes, versions, URLs, file names, and technical
identifiers retain Latin characters and explicit LTR direction.

Noto Sans Arabic provides real Arabic shaping. The locale avoids decorative tatweel, unnecessary
diacritics, uppercase transformation, and harmful letter spacing. Diacritics appear only to resolve
genuine ambiguity, as in the imperative `أنهِ`. Navigation may mirror, but map geography and
faction emblems do not.

## Formal-Arabic review report

Files reviewed:

- `common.json`: brand, language, actions, settings, status, and plurals;
- `game.json`: modes, selection, HUD, phases, actions, instructions, combat, rooms, errors, events;
- `content.json`: factions, leaders, patrons, cards, units, terrain, territories;
- `campaigns.json`: scenario title, narration, objective, historical note;
- `accessibility.json`: every screen-reader and navigation label.

Dialectal wording was replaced project-wide:

| Replaced dialectal wording | Formal project wording   |
| -------------------------- | ------------------------ |
| اختار                      | اختر                     |
| كمّل / كمّل الدور          | متابعة / إنهاء الدور     |
| ارجع                       | رجوع / العودة            |
| سكّر                       | إغلاق                    |
| سجّل                       | حفظ                      |
| تعدّى                      | تخطي                     |
| نقّص                       | تقليل                    |
| يخدم بلا إنترنت            | متاح دون اتصال بالإنترنت |
| فمّا                       | تتوفر                    |
| عدّي                       | مرر                      |
| توّة                       | الآن                     |
| ياخذ / اربح                | يحصل على / احصل على      |
| تنجّم                      | يمكن                     |
| وحدك                       | فردي                     |
| اللي بعثهولك               | الذي أرسله               |
| موش                        | ليس / غير                |
| ما عندكش                   | ليست لديك                |
| ما تنجّمش                  | لا يمكنك                 |
| ما فمّاش                   | لا يوجد                  |
| هاذي                       | هذه                      |
| خذا                        | حصل على                  |
| وفات                       | انتهت                    |
| تردّ                       | صُدّ                     |

Proper names normalized in resources are `عليسة`, `حنبعل برقة`, `أميلكار برقة`,
`صدربعل برقة`, `قرطاج`, `بعل حمون`, and `تانيت`.

## Review status

Automated parity, forbidden-dialect, historical-name, RTL, browser, and screenshot checks pass.
Native-speaker and Tunisian historian review is still requested for the project convention `برقة`,
the preferred transcription `أميلكار`, the spacing in `صدربعل`, and future uses of `ملقرت`,
`بوني`, and `ماسينيسا`. Any change must be applied consistently to resources, glossary, tests,
and historical notes.
