import { describe, expect, it } from 'vitest';
import { TraceRecorder } from './traces';
import type { TraceEntry } from './types';

function fakeEntry(overrides: Partial<TraceEntry> = {}): TraceEntry {
  return {
    turn: 1,
    activePlayerId: 'p1',
    phase: 'act',
    action: { type: 'END_TURN', playerId: 'p1' },
    candidateCount: 1,
    selectedScore: 0,
    scoreComponents: {},
    stateHashBefore: 'a',
    ok: true,
    stateHashAfter: 'b',
    eventKeys: [],
    ...overrides,
  };
}

describe('TraceRecorder', () => {
  it('records nothing and finalizes to undefined when disabled', () => {
    const trace = new TraceRecorder(false);
    trace.record(fakeEntry());
    trace.recordTurnEndReason('k', 'end-turn-selected');
    expect(trace.finalize()).toBeUndefined();
  });

  it('records entries and turn-end reasons when enabled', () => {
    const trace = new TraceRecorder(true);
    trace.record(fakeEntry({ turn: 1 }));
    trace.record(fakeEntry({ turn: 2 }));
    trace.recordTurnEndReason('1-p1', 'end-turn-selected');
    const finalized = trace.finalize();
    expect(finalized?.entries).toHaveLength(2);
    expect(finalized?.turnEndReasons['1-p1']).toBe('end-turn-selected');
  });
});
