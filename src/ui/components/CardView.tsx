import { useTranslation } from 'react-i18next';
import { cards } from '../../content/gameContent';
import type { FactionId } from '../../game/engine/types';
import { ActionIcon } from '../icons/ActionIcons';

const cardEffectIcon: Record<string, 'attackBoost' | 'coins' | 'refresh'> = {
  'hannibal-barca': 'attackBoost',
  'war-elephants': 'attackBoost',
  'merchant-fleet': 'coins',
  'scipio-africanus': 'attackBoost',
  'roman-veterans': 'refresh',
  'roman-roads': 'refresh',
};

interface Props {
  cardId: string;
  factionId: FactionId;
  onClick: () => void;
}

export function CardView({ cardId, factionId, onClick }: Props) {
  const { t } = useTranslation();
  return (
    <button className={`card-view card-view-${factionId}`} onClick={onClick}>
      <span className="card-view-icon">
        <ActionIcon name={cardEffectIcon[cardId] ?? 'attackBoost'} />
      </span>
      <span className="card-view-body">
        <strong>{t(cards[cardId].nameKey)}</strong>
        <small>{t(cards[cardId].descriptionKey)}</small>
      </span>
    </button>
  );
}
