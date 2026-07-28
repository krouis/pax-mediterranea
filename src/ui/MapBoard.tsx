import { useTranslation } from 'react-i18next';
import { terrainRules } from '../content/gameContent';
import { legalDestinations } from '../game/engine/rules';
import type { GameState } from '../game/engine/types';

interface Props {
  state: GameState;
  selectedUnitId?: string;
  selectUnit: (id: string) => void;
  chooseTerritory: (id: string) => void;
  recruitLegal?: string[];
}

const icons = { infantry: '♟', cavalry: '♞', fleet: '⛵' };
const terrainIcons = {
  plains: '·',
  hills: '♒',
  mountains: '▲',
  city: '▦',
  port: '⚓',
  sea: '≈',
  sacred: '✦',
};

export function MapBoard({
  state,
  selectedUnitId,
  selectUnit,
  chooseTerritory,
  recruitLegal = [],
}: Props) {
  const { t } = useTranslation();
  const legal = selectedUnitId ? legalDestinations(state, selectedUnitId) : [];
  const playerName = (name: string) =>
    name === 'carthage' || name === 'rome' ? t(`content:factions.${name}.name`) : name;
  return (
    <section
      className="map-shell"
      data-testid="game-map"
      dir="ltr"
      aria-label={t('accessibility:map')}
    >
      <svg className="connections" viewBox="0 0 100 100" aria-hidden="true">
        {state.territories.flatMap((territory) =>
          territory.connections
            .filter((id) => territory.id < id)
            .map((id) => {
              const other = state.territories.find((candidate) => candidate.id === id)!;
              return (
                <line
                  key={`${territory.id}-${id}`}
                  x1={territory.position.x}
                  y1={territory.position.y}
                  x2={other.position.x}
                  y2={other.position.y}
                />
              );
            }),
        )}
      </svg>
      {state.territories.map((territory) => {
        const units = state.units.filter((unit) => unit.territoryId === territory.id);
        const active = legal.includes(territory.id) || recruitLegal.includes(territory.id);
        return (
          <button
            key={territory.id}
            className={`territory terrain-${territory.terrain} owner-${territory.ownerId ?? 'neutral'} ${active ? 'legal' : ''}`}
            style={{ left: `${territory.position.x}%`, top: `${territory.position.y}%` }}
            onClick={() => chooseTerritory(territory.id)}
            aria-label={t('accessibility:territory', {
              territory: t(territory.nameKey),
              terrain: t(terrainRules[territory.terrain].nameKey),
              ownership: territory.ownerId
                ? t('accessibility:controlledBy', {
                    player: playerName(
                      state.players.find(({ id }) => id === territory.ownerId)?.name ?? '',
                    ),
                  })
                : t('accessibility:neutral'),
            })}
          >
            <span className="terrain-icon" aria-hidden="true">
              {terrainIcons[territory.terrain]}
            </span>
            <span className="territory-name" dir="auto">
              {t(territory.nameKey)}
            </span>
            <span className="units">
              {units.map((unit) => (
                <span
                  key={unit.id}
                  role="button"
                  tabIndex={0}
                  className={`unit unit-${unit.ownerId} ${selectedUnitId === unit.id ? 'selected' : ''}`}
                  title={`${t(`content:units.${unit.type}`)}${
                    unit.acted ? ` (${t('accessibility:acted')})` : ''
                  }`}
                  aria-label={t('accessibility:selectUnit', {
                    unit: t(`content:units.${unit.type}`),
                  })}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectUnit(unit.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') selectUnit(unit.id);
                  }}
                >
                  {icons[unit.type]}
                </span>
              ))}
            </span>
          </button>
        );
      })}
      <div className="sea-label" aria-hidden="true">
        MARE INTERNVM
      </div>
    </section>
  );
}
