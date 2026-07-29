import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { findForbiddenArabicDialectTerms } from '../src/i18n/formalArabic';

const root = resolve('src/i18n/locales');
const requiredLocales = ['en', 'fr', 'ar-TN'];
const requiredNamespaces = ['common', 'game', 'content', 'campaigns', 'accessibility'];
const errors: string[] = [];

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function readResource(locale: string, namespace: string): JsonValue {
  const path = resolve(root, locale, `${namespace}.json`);
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as JsonValue;
  } catch (error) {
    errors.push(`${locale}/${namespace}.json is missing or invalid: ${String(error)}`);
    return {};
  }
}

function flatten(value: JsonValue, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  if (typeof value === 'string') {
    result.set(prefix, value);
  } else if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      for (const [childKey, text] of flatten(child, path)) result.set(childKey, text);
    }
  }
  return result;
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{\{\s*([a-zA-Z0-9_]+)(?:\s*,[^}]*)?\s*\}\}/g)]
    .map((match) => match[1])
    .sort();
}

const exposedLocales = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (exposedLocales.join('|') !== [...requiredLocales].sort().join('|'))
  errors.push(
    `Exposed locales must be exactly ${requiredLocales.join(', ')}; found ${exposedLocales.join(', ')}.`,
  );

let keyCount = 0;
for (const namespace of requiredNamespaces) {
  const english = flatten(readResource('en', namespace));
  keyCount += english.size;
  for (const [key, value] of english) {
    if (!value.trim()) errors.push(`en/${namespace}:${key} is empty.`);
  }
  for (const locale of requiredLocales.slice(1)) {
    const localized = flatten(readResource(locale, namespace));
    const englishKeys = [...english.keys()].sort();
    const localizedKeys = [...localized.keys()].sort();
    if (englishKeys.join('|') !== localizedKeys.join('|')) {
      for (const key of englishKeys.filter((candidate) => !localized.has(candidate)))
        errors.push(`${locale}/${namespace}:${key} is missing.`);
      for (const key of localizedKeys.filter((candidate) => !english.has(candidate)))
        errors.push(`${locale}/${namespace}:${key} is unexpected.`);
    }
    for (const [key, value] of localized) {
      if (!value.trim()) errors.push(`${locale}/${namespace}:${key} is empty.`);
      const reference = english.get(key);
      if (reference && placeholders(reference).join('|') !== placeholders(value).join('|'))
        errors.push(`${locale}/${namespace}:${key} has mismatched placeholders.`);
    }
  }
}

for (const locale of requiredLocales) {
  const common = readResource(locale, 'common') as {
    meta?: { name?: string; flag?: string; direction?: string; complete?: boolean };
  };
  if (!common.meta?.name || !common.meta.flag || common.meta.complete !== true)
    errors.push(`${locale} has invalid or incomplete locale metadata.`);
  const expectedDirection = locale === 'ar-TN' ? 'rtl' : 'ltr';
  if (common.meta?.direction !== expectedDirection)
    errors.push(`${locale} must declare direction ${expectedDirection}.`);
}

const arabicResources = new Map<string, string>();
for (const namespace of requiredNamespaces) {
  for (const [key, value] of flatten(readResource('ar-TN', namespace)))
    arabicResources.set(`${namespace}:${key}`, value);
}
for (const [key, value] of arabicResources) {
  for (const term of findForbiddenArabicDialectTerms(value))
    errors.push(`ar-TN/${key} contains forbidden dialect term "${term}".`);
}

const requiredArabicValues: Record<string, string> = {
  'common:meta.name': 'العربية — تونس',
  'common:meta.flag': '🇹🇳',
  'common:actions.play': 'ابدأ',
  'common:actions.continue': 'متابعة',
  'common:actions.save': 'حفظ',
  'common:actions.load': 'تحميل',
  'common:settings.title': 'الإعدادات',
  'game:selection.faction': 'اختر حضارتك',
  'game:actions.endTurn': 'إنهاء الدور',
  'game:actions.recruit': 'تجنيد',
  'game:actions.move': 'تحريك',
  'game:actions.attack': 'هجوم',
  'content:leaders.dido.name': 'عليسة',
  'content:leaders.hannibal-barca.name': 'حنبعل برقة',
  'content:leaders.hamilcar-barca.name': 'أميلكار برقة',
  'content:leaders.hasdrubal-barca.name': 'صدربعل برقة',
  'content:factions.carthage.name': 'قرطاج',
  'content:patrons.baal-hammon.name': 'بعل حمون',
  'content:patrons.tanit.name': 'تانيت',
};
for (const [key, expected] of Object.entries(requiredArabicValues)) {
  const actual = arabicResources.get(key);
  if (actual !== expected)
    errors.push(`ar-TN/${key} must be "${expected}"; found "${actual ?? '(missing)'}".`);
}

for (const requiredKey of ['numbers.players_one', 'numbers.players_other']) {
  for (const locale of requiredLocales) {
    if (!flatten(readResource(locale, 'common')).has(requiredKey))
      errors.push(`${locale}/common:${requiredKey} plural form is missing.`);
  }
}

for (const path of [
  'src/app/App.tsx',
  'src/ui/board/MapBoard.tsx',
  'src/ui/SettingsDialog.tsx',
  'src/ui/LanguageSelector.tsx',
  'src/ui/HistoryPanel.tsx',
  'src/ui/components/PixelDialog.tsx',
  'src/ui/components/FactionBadge.tsx',
  'src/ui/screens/MainMenuScreen.tsx',
  'src/ui/screens/CampaignIntroScreen.tsx',
  'src/ui/screens/OnlineStubScreen.tsx',
  'src/ui/screens/FactionSelectScreen.tsx',
]) {
  const source = readFileSync(path, 'utf8');
  const hardCodedAttribute = source.match(/\b(?:aria-label|placeholder|title)="[A-Za-z][^"]+"/g);
  if (hardCodedAttribute)
    errors.push(
      `${path} contains hard-coded user-visible attributes: ${hardCodedAttribute.join(', ')}`,
    );
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `${keyCount} keys validated across ${requiredLocales.length} complete locales (${requiredLocales.join(', ')}).`,
  );
}
