import { describe, expect, it, vi } from 'vitest';
import { MockTransport, sanitizeDisplayName } from './transport';

describe('multiplayer transport', () => {
  it('validates rooms and relays immutable actions', async () => {
    const transport = new MockTransport();
    await expect(transport.connect('x')).rejects.toThrow();
    await transport.connect('PAX-42');
    const listener = vi.fn();
    const unsubscribe = transport.onAction(listener);
    await transport.sendAction({
      id: 'a1',
      roomId: 'PAX-42',
      playerId: 'p1',
      sequence: 1,
      gameVersion: 1,
      action: { type: 'END_TURN', playerId: 'p1' },
    });
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    await transport.disconnect();
  });

  it('sanitizes and limits display names', () => {
    expect(sanitizeDisplayName('  <Hanno>   & friends  ')).toBe('Hanno friends');
    expect(sanitizeDisplayName('a'.repeat(50))).toHaveLength(24);
  });
});
