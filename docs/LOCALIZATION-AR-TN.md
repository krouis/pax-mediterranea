# Tunisian Arabic localization (`ar-TN`)

## Audience and tone

This interface is for a broad modern Tunisian audience. It balances familiar Tunisian phrasing with
clear Modern Standard Arabic. Short actions, tutorial prompts, confirmations, and casual status
messages may use approachable Tunisian forms such as “كمّل”, “اختار”, “توّة”, and “فمّا”.
Historical explanations, technical descriptions, terrain, institutions, and ambiguous concepts use
more standard vocabulary. Clarity matters more than dialect density.

`ar-TN` is solely a modern interface locale. It is not presented as the historical language of
ancient Carthage. Historical summaries are translations of the same source text, not independent
rewrites.

## Preferred glossary

| English     | Preferred Arabic         | Notes                                         |
| ----------- | ------------------------ | --------------------------------------------- |
| Play        | ابدأ اللعب               | Clear launch action                           |
| Continue    | كمّل                     | Familiar short UI action                      |
| Campaign    | الحملة                   | Standard historical/game term                 |
| Quick match | مباراة سريعة             | Broadly understood                            |
| Multiplayer | لعب جماعي / ربط اللاعبين | Use contextually                              |
| Turn        | الدور                    | Consistent throughout                         |
| End turn    | كمّل الدور               | Approachable action wording                   |
| Move        | تحرّك                    | Verb; “الحركة” as noun                        |
| Attack      | اهجم / الهجوم            | Verb/noun distinction                         |
| Recruit     | جنّد / التجنيد           | Verb/noun distinction                         |
| Capture     | سيطر / السيطرة           | Avoid overly literal wording                  |
| City        | مدينة                    | Standard Arabic                               |
| Port        | ميناء                    | Standard Arabic                               |
| Fleet       | الأسطول                  | Standard Arabic                               |
| Infantry    | المشاة                   | Standard military term                        |
| Cavalry     | الفرسان                  | Readable alternative to سلاح الفرسان          |
| Coins       | القطع                    | Abstract game currency                        |
| Favor       | الحظوة                   | Divine/public favor, not a spell              |
| Pantheon    | مجمع الآلهة              | Use in longer explanatory text                |
| Victory     | انتصار                   | Standard Arabic                               |
| Defeat      | هزيمة                    | Standard Arabic                               |
| Settings    | الإعدادات                | Standard technical term                       |
| Save        | سجّل                     | Game action; “حفظ” in technical documentation |
| Load        | حمّل                     | Game action                                   |
| Offline     | بلا إنترنت               | Prefer clarity over borrowed terms            |
| Room code   | رمز الغرفة               | Code value remains LTR                        |

## Historical names

Use recognizable, consistent forms:

- Carthage — قرطاج
- Hannibal Barca — حنبعل برقا
- Hamilcar Barca — حملقار برقا
- Hasdrubal Barca — صدربعل برقا
- Baal Hammon — بعل حمّون
- Tanit — تانيت
- Melqart — ملقرت
- Rome — روما
- Jupiter — جوبيتر
- Juno — جونو
- Apollo — أبولو
- Zeus — زيوس

Where Arabic references vary, this project uses one stable display form while retaining Latin
stable IDs. Do not transliterate French vocabulary when a clear Arabic term exists.

## Typography and accessibility

Arabic joining and shaping must come from a real system Arabic font; fake pixel fonts are
prohibited. Diacritics are sparse and used only for clarity. The document is RTL, navigation arrows
mirror, map geography and emblems do not, and room codes remain LTR. Avoid uppercase transforms and
letter spacing. Test Arabic punctuation, Arabic/Latin mixtures, localized numerals, wrapping,
keyboard focus, screen-reader labels, portrait/landscape layouts, and 200% zoom.

## Examples

- “اختار حضارتك” — choose your civilization.
- “ما عندكش قطع كافية.” — not enough Coins.
- “فمّا نسخة جديدة جاهزة.” — an update is ready.
- “تقدّم المصادر القديمة وجهات نظر مختلفة…” — standard register for historical caveats.

## Review status

The locale has complete automated key coverage and browser/RTL review. It still requires final
native-speaker editorial review, especially military terminology, naturalness across different
Tunisian regions, historical transliterations, and screen-reader pronunciation. Reviewers should
avoid adding dialect merely for appearance and should record glossary changes here.
