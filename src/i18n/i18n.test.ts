import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createGame } from '../game/engine/state';
import { loadPreferences, savePreferences } from '../persistence/preferences';
import i18n, {
  applyDocumentLocale,
  localeMetadata,
  resolveLocale,
  supportedLocales,
} from './index';

describe('internationalization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('resolves supported browser variants and falls back to English', () => {
    expect(resolveLocale('fr-FR')).toBe('fr');
    expect(resolveLocale('ar')).toBe('ar-TN');
    expect(resolveLocale('ar_TN')).toBe('ar-TN');
    expect(resolveLocale('ja-JP')).toBe('en');
    expect(resolveLocale(undefined)).toBe('en');
  });

  it('declares only complete launch locales and the Tunisian Arabic identity', () => {
    expect(supportedLocales).toEqual(['en', 'fr', 'ar-TN']);
    expect(localeMetadata['ar-TN']).toEqual({
      nativeName: 'العربية — تونس',
      flag: '🇹🇳',
      direction: 'rtl',
    });
  });

  it.each([
    ['en', 'ltr'],
    ['fr', 'ltr'],
    ['ar-TN', 'rtl'],
  ] as const)('updates document language and direction for %s', async (locale, direction) => {
    await i18n.changeLanguage(locale);
    expect(document.documentElement.lang).toBe(locale);
    expect(document.documentElement.dir).toBe(direction);
  });

  it('formats interpolation, plurals, numbers, dates, times, and lists by locale', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('game:combat.attackStrength', { value: 12 })).toContain('12');
    expect(i18n.t('numbers.players', { count: 2 })).toContain('2');
    expect(
      i18n.options.interpolation?.format?.(new Date('2026-07-27T10:00:00Z'), 'date', 'fr'),
    ).toBeTruthy();
    expect(i18n.options.interpolation?.format?.(['Rome', 'Carthage'], 'list', 'en')).toContain(
      'and',
    );
  });

  it('restores a saved locale and preserves it with preferences', () => {
    savePreferences({ locale: 'ar-TN', reducedMotion: true, sound: false, music: false });
    expect(loadPreferences().locale).toBe('ar-TN');
    expect(localStorage.getItem('pax.locale')).toBe('ar-TN');
  });

  it('keeps deterministic game state independent from display locale', async () => {
    const before = createGame({ seed: 270 });
    await i18n.changeLanguage('ar-TN');
    const after = createGame({ seed: 270 });
    expect(after).toEqual(before);
    expect(JSON.stringify(after)).not.toContain('قرطاج');
  });

  it('applies explicit locale state without mirroring identifiers', () => {
    applyDocumentLocale('ar-TN');
    expect(document.documentElement.dataset.locale).toBe('ar-TN');
    expect(createGame().players[0].faction).toBe('carthage');
  });
});
