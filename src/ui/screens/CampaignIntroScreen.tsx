import { useTranslation } from 'react-i18next';
import type { scenarios } from '../../content/gameContent';
import { CoastalScene } from '../icons/CoastalScene';

interface Props {
  scenario: (typeof scenarios)[number];
  onBack: () => void;
  onBegin: () => void;
}

export function CampaignIntroScreen({ scenario, onBack, onBegin }: Props) {
  const { t } = useTranslation();
  return (
    <main className="sub-page parchment">
      <button className="back" onClick={onBack}>
        <span className="directional-arrow" aria-hidden="true">
          ←
        </span>{' '}
        {t('actions.back')}
      </button>
      <p className="eyebrow">{t('campaigns:sicilian-question.chapter')}</p>
      <h1>{t(scenario.titleKey)}</h1>
      <CoastalScene className="campaign-illustration" />
      <section className="stone-panel prose">
        <p>{t(scenario.introKey)}</p>
        <h2>{t('campaigns:sicilian-question.objectiveTitle')}</h2>
        <p>{t(scenario.objectiveKey)}</p>
        <p className="historical-note">{t(scenario.historicalNoteKey)}</p>
      </section>
      <button className="primary large" onClick={onBegin}>
        {t('actions.play')}
      </button>
    </main>
  );
}
