import { useTranslation } from 'react-i18next';
import { terrainRules } from '../../content/gameContent';
import { legalDestinations } from '../../game/engine/rules';
import type { GameState, Unit } from '../../game/engine/types';
import { TerrainIcon } from '../icons/TerrainIcons';
import { UnitIcon } from '../icons/UnitIcons';
import { MapBackground } from './MapBackground';

interface Props {
  state: GameState;
  selectedUnitId?: string;
  selectUnit: (id: string) => void;
  chooseTerritory: (id: string) => void;
  recruitLegal?: string[];
  objectiveTerritoryId?: string;
}

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
  objectiveTerritoryId,
}: Props) {
  const { t } = useTranslation();
  const legal = selectedUnitId ? legalDestinations(state, selectedUnitId) : [];
  const currentPlayerId = state.players[state.activePlayerIndex].id;
  const playerName = (name: string) =>
    name === 'carthage' || name === 'rome' ? t(`content:factions.${name}.name`) : name;

  const enemyUnits = state.units.filter((unit) => unit.ownerId !== currentPlayerId);
  const threatenedTerritoryIds = new Set(
    enemyUnits.flatMap((unit) => legalDestinations(state, unit.id)),
  );

  return (
    <section
      className="map-shell"
      data-testid="game-map"
      dir="ltr"
      aria-label={t('accessibility:map')}
    >
      <MapBackground />
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
        const friendlyUnits = units.filter((unit) => unit.ownerId === currentPlayerId);
        const isLegalTarget = legal.includes(territory.id);
        const isRecruitTarget = recruitLegal.includes(territory.id);
        const hostileHere =
          isLegalTarget &&
          Boolean(
            (territory.ownerId && territory.ownerId !== currentPlayerId) ||
            units.some((unit) => unit.ownerId !== currentPlayerId),
          );
        const isSelectedHere = friendlyUnits.some((unit) => unit.id === selectedUnitId);
        const isObjective = objectiveTerritoryId === territory.id;
        const isThreatened =
          territory.ownerId === currentPlayerId && threatenedTerritoryIds.has(territory.id);

        const stateClasses = [
          isRecruitTarget ? 'legal-recruit' : '',
          isLegalTarget && hostileHere ? 'legal-attack' : '',
          isLegalTarget && !hostileHere ? 'legal-move' : '',
          isSelectedHere ? 'selected' : '',
          isObjective ? 'objective' : '',
          isThreatened ? 'threatened' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const active = isLegalTarget || isRecruitTarget;
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
            className={`territory terrain-${territory.terrain} owner-${territory.ownerId ?? 'neutral'} ${stateClasses}`}
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
            {isObjective && (
              <span className="territory-objective-mark" aria-hidden="true">
                ★
              </span>
            )}
            {isThreatened && (
              <span className="territory-threat-mark" aria-hidden="true">
                !
              </span>
            )}
            <TerrainIcon terrain={territory.terrain} className="terrain-icon" />
            <span className="territory-name" dir="auto">
              {t(territory.nameKey)}
            </span>
            <span className="units">
              {groupUnits(units).map((group) => {
                const [sample] = group;
                const selectedInGroup = group.some((unit) => unit.id === selectedUnitId);
                const actedCount = group.filter((unit) => unit.acted).length;
                const allActed = actedCount === group.length;
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
                    className={`unit unit-${sample.ownerId} ${selectedInGroup ? 'selected' : ''} ${allActed ? 'acted' : ''}`}
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
                    <UnitIcon type={sample.type} />
                    {group.length > 1 && (
                      <span className="unit-count" aria-hidden="true">
                        {group.length}
                      </span>
                    )}
                  </span>
                );
              })}
            </span>
            {/*
              Icon-only content (terrain/unit SVGs) contributes no text, so adjacent territory
              buttons' names would otherwise concatenate directly in raw textContent scans
              (e.g. e2e/i18n.spec.ts's dialect check) with no separator between them.
            */}
            <span className="sr-only"> </span>
          </button>
        );
      })}
      <div className="sea-label" aria-hidden="true">
        MARE INTERNVM
      </div>
    </section>
  );
}
