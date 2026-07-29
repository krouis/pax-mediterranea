import { useTranslation } from 'react-i18next';
import type { GameState } from '../../game/engine/types';
import type { Preferences } from '../../persistence/preferences';
import { CoastalScene } from '../icons/CoastalScene';
import { LanguageSelector } from '../LanguageSelector';

interface Props {
  preferences: Preferences;
  setPreferences: (updater: (current: Preferences) => Preferences) => void;
  savedGame: GameState | undefined;
  onQuick: () => void;
  onContinue: () => void;
  onCampaign: () => void;
  onHotseat: () => void;
  onTutorial: () => void;
  onOnline: () => void;
  onOpenSettings: () => void;
}

export function MainMenuScreen({
  preferences,
  setPreferences,
  savedGame,
  onQuick,
  onContinue,
  onCampaign,
  onHotseat,
  onTutorial,
  onOnline,
  onOpenSettings,
}: Props) {
  const { t } = useTranslation();
  return (
    <main className="menu-page">
      <CoastalScene className="menu-hero-scene" />
      <header className="hero">
        <span className="sun-mark" aria-hidden="true">
          ✦
        </span>
        <p className="eyebrow">{t('brand.genre')}</p>
        <h1>{t('brand.name')}</h1>
        <p className="tagline">{t('brand.tagline')}</p>
      </header>
      <nav className="menu-actions" aria-label={t('accessibility:gameModes')}>
        <button data-testid="mode-quick" className="primary large" onClick={onQuick}>
          <span>⚔</span>
          <strong>{t('game:modes.quick')}</strong>
          <small>
            {t('numbers.minutes', { min: 10, max: 25 })} · {t('game:modes.solo')}
          </small>
        </button>
        {savedGame && (
          <button className="continue-highlight" onClick={onContinue}>
            <span>▶</span>
            <strong>{t('actions.continue')}</strong>
            <small>{t('numbers.turn', { value: savedGame.turn })}</small>
          </button>
        )}
        <button onClick={onCampaign}>
          <span>♜</span>
          <strong>{t('game:modes.campaign')}</strong>
          <small>{t('campaigns:sicilian-question.title')}</small>
        </button>
        <button data-testid="mode-hotseat" onClick={onHotseat}>
          <span>♟</span>
          <strong>{t('game:modes.hotseat')}</strong>
          <small>
            {t('numbers.players', { count: 2 })} · {t('game:modes.oneDevice')}
          </small>
        </button>
        <button data-testid="mode-tutorial" onClick={onTutorial}>
          <span>?</span>
          <strong>{t('game:modes.tutorial')}</strong>
          <small>
            {t('numbers.minutes', { min: 3, max: 5 })} · {t('content:factions.carthage.name')}
          </small>
        </button>
        <button data-testid="mode-online" onClick={onOnline}>
          <span>⌁</span>
          <strong>{t('game:modes.online')}</strong>
          <small>{t('game:modes.comingSoon')}</small>
        </button>
      </nav>
      <button
        className="icon-button settings-button"
        onClick={onOpenSettings}
        aria-label={t('accessibility:settings')}
      >
        ⚙
      </button>
      <LanguageSelector
        compact
        value={preferences.locale}
        onChange={(locale) => setPreferences((current) => ({ ...current, locale }))}
      />
      <footer>
        {t('status.offlineReady')} · {t('status.noTracking')} · {t('status.openSource')}
      </footer>
    </main>
  );
}
