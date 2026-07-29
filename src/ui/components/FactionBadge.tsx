import { useTranslation } from 'react-i18next';
import { factions } from '../../content/gameContent';
import type { FactionId } from '../../game/engine/types';
import { FactionEmblem } from '../icons/FactionEmblems';

interface Props {
  factionId: FactionId;
  size?: 'default' | 'small';
  onClick?: () => void;
  'aria-label'?: string;
}

/** Faction identity badge: an original symbolic emblem (see src/ui/icons/FactionEmblems.tsx). */
export function FactionBadge({ factionId, size = 'default', onClick, ...rest }: Props) {
  const { t } = useTranslation();
  const className =
    `faction-badge faction-badge-${factionId} ${size === 'small' ? 'small' : ''}`.trim();
  const content = <FactionEmblem factionId={factionId} className="faction-badge-icon" />;
  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        aria-label={rest['aria-label'] ?? t(factions[factionId].nameKey)}
      >
        {content}
      </button>
    );
  }
  return (
    <span className={className} aria-hidden="true">
      {content}
    </span>
  );
}
