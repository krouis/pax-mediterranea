import { resolveLocale, type SupportedLocale } from '../i18n';
import { deserializeGame, serializeGame } from '../game/serialization/save';
import type { GameState } from '../game/engine/types';

export interface Preferences {
  locale: SupportedLocale;
  reducedMotion: boolean;
  sound: boolean;
  music: boolean;
}

const preferenceKey = 'pax.preferences.v1';
const autosaveKey = 'pax.autosave.v1';

export function loadPreferences(): Preferences {
  try {
    return {
      locale: resolveLocale(localStorage.getItem('pax.locale') ?? navigator.language),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      sound: true,
      music: true,
      ...JSON.parse(localStorage.getItem(preferenceKey) ?? '{}'),
    };
  } catch {
    return { locale: 'en', reducedMotion: false, sound: true, music: true };
  }
}

export function savePreferences(preferences: Preferences): void {
  localStorage.setItem(preferenceKey, JSON.stringify(preferences));
  localStorage.setItem('pax.locale', preferences.locale);
}

export function saveGame(state: GameState): void {
  localStorage.setItem(autosaveKey, serializeGame(state));
}

export function loadGame(): GameState | undefined {
  const value = localStorage.getItem(autosaveKey);
  if (!value) return undefined;
  try {
    return deserializeGame(value).state;
  } catch {
    return undefined;
  }
}
