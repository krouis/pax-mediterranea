import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import type { GameEvent } from '../game/engine/types';
import { HistoryPanel } from './HistoryPanel';

const events: GameEvent[] = [
  { turn: 1, key: 'game:events.begins' },
  { turn: 1, key: 'game:events.income', values: { player: 'Carthage', count: 3 } },
  { turn: 2, key: 'game:events.capture', values: { player: 'Carthage', territory: 'Sicily' } },
];

describe('HistoryPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders every event in chronological order with formatted text', () => {
    const formatEvent = vi.fn((event: GameEvent) => `formatted:${event.key}`);
    render(<HistoryPanel events={events} formatEvent={formatEvent} onClose={() => {}} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('formatted:game:events.begins');
    expect(items[2]).toHaveTextContent('formatted:game:events.capture');
    expect(formatEvent).toHaveBeenCalledTimes(3);
  });

  it('shows an empty state when there are no events', () => {
    render(<HistoryPanel events={[]} formatEvent={() => ''} onClose={() => {}} />);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText('No events yet.')).toBeInTheDocument();
  });

  it('is a labeled, keyboard-closable dialog', () => {
    const onClose = vi.fn();
    render(<HistoryPanel events={events} formatEvent={(event) => event.key} onClose={onClose} />);

    const dialog = screen.getByRole('dialog', { name: 'Game history' });
    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the close button or backdrop is activated, but not on inner clicks', () => {
    const onClose = vi.fn();
    const { container } = render(
      <HistoryPanel events={events} formatEvent={(event) => event.key} onClose={onClose} />,
    );

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('.scrim')!);
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
