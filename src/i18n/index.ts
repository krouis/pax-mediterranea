import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enAccessibility from './locales/en/accessibility.json';
import enCampaigns from './locales/en/campaigns.json';
import enCommon from './locales/en/common.json';
import enContent from './locales/en/content.json';
import enGame from './locales/en/game.json';
import frAccessibility from './locales/fr/accessibility.json';
import frCampaigns from './locales/fr/campaigns.json';
import frCommon from './locales/fr/common.json';
import frContent from './locales/fr/content.json';
import frGame from './locales/fr/game.json';
import arAccessibility from './locales/ar-TN/accessibility.json';
import arCampaigns from './locales/ar-TN/campaigns.json';
import arCommon from './locales/ar-TN/common.json';
import arContent from './locales/ar-TN/content.json';
import arGame from './locales/ar-TN/game.json';

export const supportedLocales = ['en', 'fr', 'ar-TN'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const localeMetadata: Record<
  SupportedLocale,
  { nativeName: string; flag: string; direction: 'ltr' | 'rtl' }
> = {
  en: { nativeName: enCommon.meta.name, flag: enCommon.meta.flag, direction: 'ltr' },
  fr: { nativeName: frCommon.meta.name, flag: frCommon.meta.flag, direction: 'ltr' },
  'ar-TN': { nativeName: arCommon.meta.name, flag: arCommon.meta.flag, direction: 'rtl' },
};

export function resolveLocale(value?: string | null): SupportedLocale {
  if (!value) return 'en';
  const normalized = value.replace('_', '-').toLowerCase();
  if (normalized === 'ar-tn' || normalized === 'ar') return 'ar-TN';
  if (normalized.startsWith('fr')) return 'fr';
  if (normalized.startsWith('en')) return 'en';
  return 'en';
}

export function applyDocumentLocale(locale: SupportedLocale): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = localeMetadata[locale].direction;
  document.documentElement.dataset.locale = locale;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        game: enGame,
        content: enContent,
        campaigns: enCampaigns,
        accessibility: enAccessibility,
      },
      fr: {
        common: frCommon,
        game: frGame,
        content: frContent,
        campaigns: frCampaigns,
        accessibility: frAccessibility,
      },
      'ar-TN': {
        common: arCommon,
        game: arGame,
        content: arContent,
        campaigns: arCampaigns,
        accessibility: arAccessibility,
      },
    },
    supportedLngs: supportedLocales,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'game', 'content', 'campaigns', 'accessibility'],
    interpolation: {
      escapeValue: false,
      format(value, format, language) {
        const locale = resolveLocale(language);
        if (format === 'number' && typeof value === 'number')
          return new Intl.NumberFormat(locale).format(value);
        if (format === 'date' && value instanceof Date)
          return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value);
        if (format === 'time' && value instanceof Date)
          return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(value);
        if (format === 'list' && Array.isArray(value))
          return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(value);
        return String(value);
      },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'pax.locale',
      caches: ['localStorage'],
      convertDetectedLanguage: resolveLocale,
    },
    returnNull: false,
    showSupportNotice: false,
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (_languages, namespace, key) => {
      if (import.meta.env.DEV) console.error(`Missing translation: ${namespace}:${key}`);
    },
  })
  .then(() => applyDocumentLocale(resolveLocale(i18n.resolvedLanguage)));

i18n.on('languageChanged', (language) => applyDocumentLocale(resolveLocale(language)));

export default i18n;
