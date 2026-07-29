import { useTranslation } from 'react-i18next';
import { factions } from '../../content/gameContent';
import type { FactionId } from '../../game/engine/types';

interface Props {
  factionId: FactionId;
  size?: 'default' | 'small';
  onClick?: () => void;
  'aria-label'?: string;
}

/**
 * Faction identity badge. Currently renders the existing glyph icon from content data;
 * src/ui/icons/FactionEmblems.tsx (Pass 3) replaces the glyph here without touching call sites.
 */
export function FactionBadge({ factionId, size = 'default', onClick, ...rest }: Props) {
  const { t } = useTranslation();
  const className =
    `faction-badge faction-badge-${factionId} ${size === 'small' ? 'small' : ''}`.trim();
  const content = (
    <span className="faction-badge-icon" aria-hidden="true">
      {factions[factionId].icon}
    </span>
  );
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
