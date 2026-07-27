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

  it('declares only complete launch locales and the Arabic Tunisian locale identity', () => {
    expect(supportedLocales).toEqual(['en', 'fr', 'ar-TN']);
    expect(localeMetadata['ar-TN']).toEqual({
      nativeName: 'العربية — تونس',
      flag: '🇹🇳',
      direction: 'rtl',
    });
  });

  it('uses formal Arabic actions and Tunisian historical-name conventions', () => {
    expect(i18n.t('actions.play', { lng: 'ar-TN' })).toBe('ابدأ');
    expect(i18n.t('actions.continue', { lng: 'ar-TN' })).toBe('متابعة');
    expect(i18n.t('game:selection.faction', { lng: 'ar-TN' })).toBe('اختر حضارتك');
    expect(i18n.t('game:actions.endTurn', { lng: 'ar-TN' })).toBe('إنهاء الدور');
    expect(i18n.t('game:actions.recruit', { lng: 'ar-TN' })).toBe('تجنيد');
    expect(i18n.t('game:actions.move', { lng: 'ar-TN' })).toBe('تحريك');
    expect(i18n.t('game:actions.attack', { lng: 'ar-TN' })).toBe('هجوم');
    expect(i18n.t('actions.save', { lng: 'ar-TN' })).toBe('حفظ');
    expect(i18n.t('actions.load', { lng: 'ar-TN' })).toBe('تحميل');
    expect(i18n.t('settings.title', { lng: 'ar-TN' })).toBe('الإعدادات');

    expect(i18n.t('content:leaders.dido.name', { lng: 'ar-TN' })).toBe('عليسة');
    expect(i18n.t('content:leaders.hannibal-barca.name', { lng: 'ar-TN' })).toBe('حنبعل برقة');
    expect(i18n.t('content:leaders.hamilcar-barca.name', { lng: 'ar-TN' })).toBe('أميلكار برقة');
    expect(i18n.t('content:leaders.hasdrubal-barca.name', { lng: 'ar-TN' })).toBe('صدربعل برقة');
    expect(i18n.t('content:factions.carthage.name', { lng: 'ar-TN' })).toBe('قرطاج');
    expect(i18n.t('content:patrons.baal-hammon.name', { lng: 'ar-TN' })).toBe('بعل حمون');
    expect(i18n.t('content:patrons.tanit.name', { lng: 'ar-TN' })).toBe('تانيت');
    expect(i18n.t('game:combat.victory', { lng: 'ar-TN' })).toBe('انتصار');
    expect(i18n.t('game:combat.defeat', { lng: 'ar-TN' })).toBe('هزيمة');
    expect(i18n.t('game:errors.illegalDestination', { lng: 'ar-TN' })).toBe(
      'لا يمكنك الانتقال إلى هذه المنطقة.',
    );
    expect(i18n.t('status.saved', { lng: 'ar-TN' })).toBe('تم حفظ اللعبة على هذا الجهاز.');
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
