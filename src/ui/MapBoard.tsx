import { useTranslation } from 'react-i18next';
import { terrainRules } from '../content/gameContent';
import { legalDestinations } from '../game/engine/rules';
import type { GameState, Unit } from '../game/engine/types';

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

function groupUnits(units: Unit[]): Unit[][] {
  const groups = new Map<string, Unit[]>();
  for (const unit of units) {
    const key = `${unit.ownerId}-${unit.type}`;
    const group = groups.get(key);
    if (group) group.push(unit);
    else groups.set(key, [unit]);
  }
  return [...groups.values()];
}

export function MapBoard({
  state,
  selectedUnitId,
  selectUnit,
  chooseTerritory,
  recruitLegal = [],
}: Props) {
  const { t } = useTranslation();
  const legal = selectedUnitId ? legalDestinations(state, selectedUnitId) : [];
  const currentPlayerId = state.players[state.activePlayerIndex].id;
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
        const friendlyUnits = units.filter((unit) => unit.ownerId === currentPlayerId);
        const handleTerritoryClick = () => {
          if (!active && friendlyUnits.length > 0) {
            const currentIndex = friendlyUnits.findIndex((unit) => unit.id === selectedUnitId);
            const next = friendlyUnits[(currentIndex + 1) % friendlyUnits.length];
            selectUnit(next.id);
            return;
          }
          chooseTerritory(territory.id);
        };
        return (
          <button
            key={territory.id}
            className={`territory terrain-${territory.terrain} owner-${territory.ownerId ?? 'neutral'} ${active ? 'legal' : ''}`}
            style={{ left: `${territory.position.x}%`, top: `${territory.position.y}%` }}
            onClick={handleTerritoryClick}
            aria-label={
              t('accessibility:territory', {
                territory: t(territory.nameKey),
                terrain: t(terrainRules[territory.terrain].nameKey),
                ownership: territory.ownerId
                  ? t('accessibility:controlledBy', {
                      player: playerName(
                        state.players.find(({ id }) => id === territory.ownerId)?.name ?? '',
                      ),
                    })
                  : t('accessibility:neutral'),
              }) +
              (friendlyUnits.length > 1
                ? ` ${t('accessibility:cycleUnits', { count: friendlyUnits.length })}`
                : '')
            }
          >
            <span className="terrain-icon" aria-hidden="true">
              {terrainIcons[territory.terrain]}
            </span>
            <span className="territory-name" dir="auto">
              {t(territory.nameKey)}
            </span>
            <span className="units">
              {groupUnits(units).map((group) => {
                const [sample] = group;
                const selectedInGroup = group.some((unit) => unit.id === selectedUnitId);
                const actedCount = group.filter((unit) => unit.acted).length;
                const label =
                  group.length > 1
                    ? t('accessibility:selectUnitStack', {
                        count: group.length,
                        unit: t(`content:units.${sample.type}`),
                      })
                    : t('accessibility:selectUnit', { unit: t(`content:units.${sample.type}`) });
                return (
                  <span
                    key={`${sample.ownerId}-${sample.type}`}
                    role="button"
                    tabIndex={0}
                    className={`unit unit-${sample.ownerId} ${selectedInGroup ? 'selected' : ''}`}
                    title={`${t(`content:units.${sample.type}`)}${
                      group.length > 1 ? ` ×${group.length}` : ''
                    }${actedCount > 0 ? ` (${t('accessibility:acted')})` : ''}`}
                    aria-label={label}
                    onClick={(event) => {
                      event.stopPropagation();
                      const currentIndex = group.findIndex((unit) => unit.id === selectedUnitId);
                      const next = group[(currentIndex + 1) % group.length];
                      selectUnit(next.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      const currentIndex = group.findIndex((unit) => unit.id === selectedUnitId);
                      const next = group[(currentIndex + 1) % group.length];
                      selectUnit(next.id);
                    }}
                  >
                    {icons[sample.type]}
                    {group.length > 1 && (
                      <span className="unit-count" aria-hidden="true">
                        {group.length}
                      </span>
                    )}
                  </span>
                );
              })}
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
