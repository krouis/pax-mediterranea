import { useTranslation } from 'react-i18next';
import type { Territory, Unit } from '../../game/engine/types';
import { UnitIcon } from '../icons/UnitIcons';
import { TerrainIcon } from '../icons/TerrainIcons';
import { ActionIcon } from '../icons/ActionIcons';

interface Props {
  attacker: Unit;
  territory: Territory;
  attack: number;
  defense: number;
  outcome: 'victory' | 'defeat' | 'stalemate';
  onCancel: () => void;
  onConfirm: () => void;
}

export function CombatPreview({
  attacker,
  territory,
  attack,
  defense,
  outcome,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="combat-preview">
      <div className="combat-preview-sides">
        <div
          className={`combat-preview-side owner-${attacker.ownerId}`}
          aria-label={t('game:combat.attackStrength', { value: attack })}
        >
          <UnitIcon type={attacker.type} />
          <strong aria-hidden="true">{attack}</strong>
        </div>
        <span className="combat-preview-vs" aria-hidden="true">
          <ActionIcon name="attackBoost" />
        </span>
        <div
          className="combat-preview-side combat-preview-defender"
          aria-label={t('game:combat.defenseStrength', { value: defense })}
        >
          <TerrainIcon terrain={territory.terrain} />
          <strong aria-hidden="true">{defense}</strong>
        </div>
      </div>
      <p className={`combat-preview-outcome combat-preview-outcome-${outcome}`}>
        {t('game:combat.outcome', { outcome: t(`game:combat.${outcome}`) })}
      </p>
      <div className="panel-footer">
        <button onClick={onCancel}>{t('actions.cancel')}</button>
        <button className="primary" onClick={onConfirm}>
          {t('game:actions.attack')}
        </button>
      </div>
    </div>
  );
}
