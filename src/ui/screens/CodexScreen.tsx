import { useTranslation } from 'react-i18next';
import { factions, patrons } from '../../content/gameContent';
import type { FactionId } from '../../game/engine/types';
import { FactionEmblem } from '../icons/FactionEmblems';
import { LeaderPortrait, PortraitFrame } from '../icons/LeaderPortraits';
import { PantheonIcon } from '../icons/PantheonIcons';

interface Props {
  onBack: () => void;
}

const realFactionIds: FactionId[] = ['carthage', 'rome'];
const futureFactions = ['greek', 'egyptian'] as const;
const leaderIds = ['dido', 'hannibal-barca', 'hamilcar-barca', 'hasdrubal-barca'];
const patronIds = ['baal-hammon', 'tanit', 'jupiter', 'juno'] as const;

export function CodexScreen({ onBack }: Props) {
  const { t } = useTranslation();
  return (
    <main className="sub-page parchment codex-page">
      <button className="back" onClick={onBack}>
        <span className="directional-arrow" aria-hidden="true">
          ←
        </span>{' '}
        {t('actions.back')}
      </button>
      <p className="eyebrow">{t('game:codex.title')}</p>
      <h1>{t('game:codex.title')}</h1>
      <p className="codex-intro">{t('game:codex.intro')}</p>

      <section className="stone-panel prose codex-section">
        <h2>{t('game:codex.factionsHeading')}</h2>
        <div className="codex-grid">
          {realFactionIds.map((id) => (
            <div key={id} className="codex-entry">
              <FactionEmblem factionId={id} className="codex-emblem" />
              <strong>{t(factions[id].nameKey)}</strong>
              <span className="codex-status codex-status-playable">
                {t('game:codex.playable')}
              </span>
            </div>
          ))}
          {futureFactions.map((id) => (
            <div key={id} className="codex-entry codex-entry-future">
              <FactionEmblem factionId={id} className="codex-emblem" />
              <strong>{t(`game:codex.${id}.name`)}</strong>
              <span className="codex-status">{t(`game:codex.${id}.description`)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="stone-panel prose codex-section">
        <h2>{t('game:codex.leadersHeading')}</h2>
        <div className="codex-grid">
          {leaderIds.map((id) => (
            <div key={id} className="codex-entry">
              <PortraitFrame>
                <LeaderPortrait leaderId={id} className="codex-portrait" />
              </PortraitFrame>
              <strong>{t(`content:leaders.${id}.name`)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="stone-panel prose codex-section">
        <h2>{t('game:codex.pantheonHeading')}</h2>
        <div className="codex-grid">
          {patronIds.map((id) => (
            <div key={id} className="codex-entry">
              <PantheonIcon patronId={id} className="codex-pantheon-icon" />
              <strong>{t(patrons[id].nameKey)}</strong>
            </div>
          ))}
          <div className="codex-entry codex-entry-future">
            <PantheonIcon patronId="melqart" className="codex-pantheon-icon" />
            <strong>{t('game:codex.melqart.name')}</strong>
            <span className="codex-status">{t('game:codex.melqart.description')}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
