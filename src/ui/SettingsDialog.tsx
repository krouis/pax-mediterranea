import { useTranslation } from 'react-i18next';
import type { Preferences } from '../persistence/preferences';
import { LanguageSelector } from './LanguageSelector';

interface Props {
  preferences: Preferences;
  setPreferences: (value: Preferences) => void;
  close: () => void;
}

export function SettingsDialog({ preferences, setPreferences, close }: Props) {
  const { t } = useTranslation();
  const update = (patch: Partial<Preferences>) => setPreferences({ ...preferences, ...patch });
  return (
    <div className="scrim" role="presentation">
      <section
        className="dialog stone-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <h2 id="settings-title">{t('settings.title')}</h2>
        <LanguageSelector value={preferences.locale} onChange={(locale) => update({ locale })} />
        <label className="toggle">
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(event) => update({ reducedMotion: event.target.checked })}
          />
          {t('settings.motion')}
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={preferences.sound}
            onChange={(event) => update({ sound: event.target.checked })}
          />
          {t('settings.sound')}
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={preferences.music}
            onChange={(event) => update({ music: event.target.checked })}
          />
          {t('settings.music')}
        </label>
        <button className="primary" onClick={close}>
          {t('actions.close')}
        </button>
      </section>
    </div>
  );
}
