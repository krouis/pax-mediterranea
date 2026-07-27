import { terrainRules } from '../content/gameContent';
import { legalDestinations } from '../game/engine/rules';
import type { GameState } from '../game/engine/types';

interface Props {
  state: GameState;
  selectedUnitId?: string;
  selectUnit: (id: string) => void;
  chooseTerritory: (id: string) => void;
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

export function MapBoard({ state, selectedUnitId, selectUnit, chooseTerritory }: Props) {
  const legal = selectedUnitId ? legalDestinations(state, selectedUnitId) : [];
  return (
    <section className="map-shell" aria-label="Mediterranean strategy map">
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
        const active = legal.includes(territory.id);
        return (
          <button
            key={territory.id}
            className={`territory terrain-${territory.terrain} owner-${territory.ownerId ?? 'neutral'} ${active ? 'legal' : ''}`}
            style={{ left: `${territory.position.x}%`, top: `${territory.position.y}%` }}
            onClick={() => chooseTerritory(territory.id)}
            aria-label={`${territory.name}, ${terrainRules[territory.terrain].label}, ${
              territory.ownerId
                ? `controlled by ${state.players.find(({ id }) => id === territory.ownerId)?.name}`
                : 'neutral'
            }`}
          >
            <span className="terrain-icon" aria-hidden="true">
              {terrainIcons[territory.terrain]}
            </span>
            <span className="territory-name">{territory.name}</span>
            <span className="units">
              {units.map((unit) => (
                <span
                  key={unit.id}
                  role="button"
                  tabIndex={0}
                  className={`unit unit-${unit.ownerId} ${selectedUnitId === unit.id ? 'selected' : ''}`}
                  title={`${unit.type}${unit.acted ? ' (acted)' : ''}`}
                  aria-label={`Select ${unit.type}`}
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
