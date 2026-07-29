import { useTranslation } from 'react-i18next';
import type { Preferences } from '../persistence/preferences';
import { PixelDialog } from './components/PixelDialog';
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
    <PixelDialog titleId="settings-title" title={t('settings.title')} onClose={close}>
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
    </PixelDialog>
  );
}
