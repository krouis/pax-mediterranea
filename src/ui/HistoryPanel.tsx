import { useTranslation } from 'react-i18next';
import type { GameEvent } from '../game/engine/types';
import { PixelDialog } from './components/PixelDialog';

interface Props {
  events: GameEvent[];
  formatEvent: (event: GameEvent) => string;
  onClose: () => void;
}

export function HistoryPanel({ events, formatEvent, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <PixelDialog
      titleId="history-title"
      title={t('game:history.title')}
      onClose={onClose}
      closeOnScrimClick
      className="history-panel"
    >
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
      <button className="primary" onClick={onClose}>
        {t('actions.close')}
      </button>
    </PixelDialog>
  );
}
