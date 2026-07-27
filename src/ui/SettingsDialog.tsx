import type { Locale, MessageKey } from '../app/i18n';
import type { Preferences } from '../persistence/preferences';

interface Props {
  preferences: Preferences;
  setPreferences: (value: Preferences) => void;
  close: () => void;
  t: (key: MessageKey) => string;
}

export function SettingsDialog({ preferences, setPreferences, close, t }: Props) {
  const update = (patch: Partial<Preferences>) => setPreferences({ ...preferences, ...patch });
  return (
    <div className="scrim" role="presentation">
      <section
        className="dialog stone-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <h2 id="settings-title">{t('settings')}</h2>
        <label>
          {t('language')}
          <select
            value={preferences.locale}
            onChange={(event) => update({ locale: event.target.value as Locale })}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(event) => update({ reducedMotion: event.target.checked })}
          />
          {t('motion')}
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={preferences.sound}
            onChange={(event) => update({ sound: event.target.checked })}
          />
          {t('sound')}
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={preferences.music}
            onChange={(event) => update({ music: event.target.checked })}
          />
          {t('music')}
        </label>
        <button className="primary" onClick={close}>
          {t('close')}
        </button>
      </section>
    </div>
  );
}
