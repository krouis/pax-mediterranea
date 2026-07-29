import { useTranslation } from 'react-i18next';
import { factions, patrons } from '../../content/gameContent';
import type { FactionId } from '../../game/engine/types';
import { FactionBadge } from '../components/FactionBadge';

interface Props {
  mode: string;
  onBack: () => void;
  onSelect: (faction: FactionId, patron: string) => void;
}

export function FactionSelectScreen({ mode, onBack, onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <main className="sub-page parchment">
      <button className="back" onClick={onBack}>
        <span className="directional-arrow" aria-hidden="true">
          ←
        </span>{' '}
        {t('actions.back')}
      </button>
      <p className="eyebrow">
        {mode === 'tutorial' ? t('game:modes.guided') : t('game:modes.quick')}
      </p>
      <h1>{t('game:selection.faction')}</h1>
      <div className="faction-grid">
        {(Object.keys(factions) as FactionId[]).map((id) => (
          <section key={id} data-testid={`faction-${id}`} className={`faction-card ${id}`}>
            <FactionBadge factionId={id} />
            <h2>{t(factions[id].nameKey)}</h2>
            <p>{t(factions[id].passiveKey)}</p>
            <h3>{t('game:selection.patron')}</h3>
            {factions[id].patrons.map((patron) => (
              <button
                key={patron}
                data-testid={`patron-${patron}`}
                className="patron"
                onClick={() => onSelect(id, patron)}
              >
                <strong>{t(patrons[patron].nameKey)}</strong>
                <small>{t(patrons[patron].descriptionKey)}</small>
              </button>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
