import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameEvent } from '../game/engine/types';

interface Props {
  events: GameEvent[];
  formatEvent: (event: GameEvent) => string;
  onClose: () => void;
}

export function HistoryPanel({ events, formatEvent, onClose }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="scrim" onClick={onClose}>
      <section
        className="dialog stone-panel history-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="history-title">{t('game:history.title')}</h2>
        {events.length === 0 ? (
          <p>{t('game:history.empty')}</p>
        ) : (
          <ol className="history-list" aria-label={t('game:history.title')}>
            {events.map((event, index) => (
              <li key={`${event.turn}-${event.key}-${index}`}>
                <span className="history-turn">{t('numbers.turn', { value: event.turn })}</span>
                <span>{formatEvent(event)}</span>
              </li>
            ))}
          </ol>
        )}
        <button className="primary" onClick={onClose} autoFocus>
          {t('actions.close')}
        </button>
      </section>
    </div>
  );
}
