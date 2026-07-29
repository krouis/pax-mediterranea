import { useTranslation } from 'react-i18next';

interface Props {
  onBack: () => void;
  onQuick: () => void;
  onHotseat: () => void;
}

export function OnlineStubScreen({ onBack, onQuick, onHotseat }: Props) {
  const { t } = useTranslation();
  return (
    <main className="sub-page parchment">
      <button className="back" onClick={onBack}>
        <span className="directional-arrow" aria-hidden="true">
          ←
        </span>{' '}
        {t('actions.back')}
      </button>
      <p className="eyebrow">{t('game:room.adapter')}</p>
      <h1>
        {t('game:modes.online')}{' '}
        <span className="badge-unavailable">{t('game:room.unavailableBadge')}</span>
      </h1>
      <section className="stone-panel prose">
        <p id="room-help">{t('game:instructions.roomUnavailable')}</p>
        <label>
          {t('game:room.code')}
          <input
            dir="ltr"
            maxLength={8}
            placeholder={t('game:room.placeholder')}
            aria-describedby="room-help"
          />
        </label>
        <button disabled>{t('actions.joinRoom')}</button>
        <div className="panel-footer">
          <button onClick={onQuick}>{t('game:modes.quick')}</button>
          <button className="primary" onClick={onHotseat}>
            {t('game:modes.hotseat')}
          </button>
        </div>
      </section>
    </main>
  );
}
