import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { createGame } from '../game/engine/state';
import { startActionPhase } from '../game/engine/rules';
import { MapBoard } from './MapBoard';

describe('MapBoard territory click routing', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('selects the sole friendly unit when clicking the territory body without a prior selection', () => {
    const state = startActionPhase(createGame({ seed: 1 }));
    const selectUnit = vi.fn();
    const chooseTerritory = vi.fn();
    render(<MapBoard state={state} selectUnit={selectUnit} chooseTerritory={chooseTerritory} />);

    fireEvent.click(screen.getByRole('button', { name: /^Carthage,/ }));
    expect(selectUnit).toHaveBeenCalledWith('u1');
    expect(chooseTerritory).not.toHaveBeenCalled();
  });

  it('cycles through multiple friendly units on repeated territory-body clicks', () => {
    const state = startActionPhase(createGame({ seed: 1 }));
    state.units.push({
      id: 'u5',
      ownerId: 'p1',
      type: 'cavalry',
      territoryId: 'carthage',
      acted: false,
    });
    const selectUnit = vi.fn();
    const chooseTerritory = vi.fn();
    const { rerender } = render(
      <MapBoard state={state} selectUnit={selectUnit} chooseTerritory={chooseTerritory} />,
    );

    const carthageButton = screen.getByRole('button', { name: /^Carthage,/ });
    fireEvent.click(carthageButton);
    expect(selectUnit).toHaveBeenLastCalledWith('u1');

    rerender(
      <MapBoard
        state={state}
        selectedUnitId="u1"
        selectUnit={selectUnit}
        chooseTerritory={chooseTerritory}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Carthage,/ }));
    expect(selectUnit).toHaveBeenLastCalledWith('u5');
  });

  it('dispatches to chooseTerritory instead of selecting when the territory is a legal destination', () => {
    const state = startActionPhase(createGame({ seed: 1 }));
    const selectUnit = vi.fn();
    const chooseTerritory = vi.fn();
    render(
      <MapBoard
        state={state}
        selectedUnitId="u1"
        selectUnit={selectUnit}
        chooseTerritory={chooseTerritory}
      />,
    );

    // Sicily is a legal destination for u1 (infantry at Carthage) and has no units.
    fireEvent.click(screen.getByRole('button', { name: /^Sicily,/ }));
    expect(chooseTerritory).toHaveBeenCalledWith('sicily');
    expect(selectUnit).not.toHaveBeenCalled();
  });

  it('still lets the individual unit icon select a specific unit directly', () => {
    const state = startActionPhase(createGame({ seed: 1 }));
    state.units.push({
      id: 'u5',
      ownerId: 'p1',
      type: 'cavalry',
      territoryId: 'carthage',
      acted: false,
    });
    const selectUnit = vi.fn();
    const chooseTerritory = vi.fn();
    render(<MapBoard state={state} selectUnit={selectUnit} chooseTerritory={chooseTerritory} />);

    const carthageButton = screen.getByRole('button', { name: /^Carthage,/ });
    fireEvent.click(within(carthageButton).getByRole('button', { name: 'Select Cavalry' }));
    expect(selectUnit).toHaveBeenCalledWith('u5');
    expect(chooseTerritory).not.toHaveBeenCalled();
  });
});
