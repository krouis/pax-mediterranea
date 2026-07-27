import { useTranslation } from 'react-i18next';
import { localeMetadata, supportedLocales, type SupportedLocale } from '../i18n';

interface Props {
  value: SupportedLocale;
  onChange: (locale: SupportedLocale) => void;
  compact?: boolean;
}

export function LanguageSelector({ value, onChange, compact = false }: Props) {
  const { t, i18n } = useTranslation();
  const change = (locale: SupportedLocale) => {
    onChange(locale);
    void i18n.changeLanguage(locale);
  };
  return (
    <label className={`language-selector ${compact ? 'compact' : ''}`}>
      <span>{t('language.label')}</span>
      <select
        value={value}
        aria-label={t('accessibility:languageSelector')}
        onChange={(event) => change(event.target.value as SupportedLocale)}
      >
        {supportedLocales.map((locale) => (
          <option key={locale} value={locale}>
            {localeMetadata[locale].flag} {localeMetadata[locale].nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
