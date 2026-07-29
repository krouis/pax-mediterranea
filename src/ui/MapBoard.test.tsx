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

describe('MapBoard stacked unit display', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function stateWithStack() {
    const state = startActionPhase(createGame({ seed: 1 }));
    state.units.push(
      { id: 'u5', ownerId: 'p1', type: 'infantry', territoryId: 'carthage', acted: false },
      { id: 'u6', ownerId: 'p1', type: 'infantry', territoryId: 'carthage', acted: true },
    );
    return state;
  }

  it('collapses same-type units into a single badge showing the count instead of one icon per unit', () => {
    const state = stateWithStack();
    render(<MapBoard state={state} selectUnit={() => {}} chooseTerritory={() => {}} />);

    const carthageButton = screen.getByRole('button', { name: /^Carthage,/ });
    // 3 infantry (u1, u5, u6) collapse into a single badge, not three.
    expect(within(carthageButton).getAllByRole('button')).toHaveLength(1);
    expect(within(carthageButton).getByText('3')).toBeInTheDocument();
  });

  it('keeps a territory-fixed footprint regardless of stack size', () => {
    const small = startActionPhase(createGame({ seed: 1 }));
    const { container: smallContainer } = render(
      <MapBoard state={small} selectUnit={() => {}} chooseTerritory={() => {}} />,
    );
    const smallButton = smallContainer.querySelector('button.territory[aria-label^="Carthage"]')!;
    const smallStyle = smallButton.getAttribute('style');
    cleanup();

    const stacked = stateWithStack();
    const { container: stackedContainer } = render(
      <MapBoard state={stacked} selectUnit={() => {}} chooseTerritory={() => {}} />,
    );
    const stackedButton = stackedContainer.querySelector(
      'button.territory[aria-label^="Carthage"]',
    )!;
    expect(stackedButton.getAttribute('style')).toBe(smallStyle);
  });

  it('cycles between a stack of same-type units and reports acted status in the title', () => {
    const state = stateWithStack();
    const selectUnit = vi.fn();
    render(<MapBoard state={state} selectUnit={selectUnit} chooseTerritory={() => {}} />);

    const carthageButton = screen.getByRole('button', { name: /^Carthage,/ });
    const badge = within(carthageButton).getByRole('button', { name: /Select Infantry/i });
    expect(badge.getAttribute('title')).toContain('×3');
    expect(badge.getAttribute('title')).toContain('acted');

    fireEvent.click(badge);
    expect(selectUnit).toHaveBeenCalledWith('u1');
  });
});
