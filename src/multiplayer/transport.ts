import type { GameAction, GameState } from '../game/engine/types';

export interface SignedGameAction {
  id: string;
  roomId: string;
  playerId: string;
  sequence: number;
  gameVersion: 1;
  action: GameAction;
}

export interface PresenceState {
  playerId: string;
  displayName: string;
  connected: boolean;
  ready: boolean;
}

export type Unsubscribe = () => void;

export interface MultiplayerTransport {
  connect(roomId: string): Promise<void>;
  disconnect(): Promise<void>;
  sendAction(action: SignedGameAction): Promise<void>;
  requestResync(): Promise<GameState | undefined>;
  onAction(callback: (action: SignedGameAction) => void): Unsubscribe;
  onPresence(callback: (presence: PresenceState) => void): Unsubscribe;
}

export class MockTransport implements MultiplayerTransport {
  private actions = new Set<(action: SignedGameAction) => void>();
  private presence = new Set<(presence: PresenceState) => void>();
  private roomId?: string;

  async connect(roomId: string): Promise<void> {
    if (!/^[A-Z0-9-]{4,12}$/i.test(roomId)) throw new Error('Invalid room code.');
    this.roomId = roomId;
  }

  async disconnect(): Promise<void> {
    this.roomId = undefined;
  }

  async sendAction(action: SignedGameAction): Promise<void> {
    if (!this.roomId || action.roomId !== this.roomId) throw new Error('Not connected.');
    this.actions.forEach((callback) => callback(structuredClone(action)));
  }

  async requestResync(): Promise<GameState | undefined> {
    return undefined;
  }

  onAction(callback: (action: SignedGameAction) => void): Unsubscribe {
    this.actions.add(callback);
    return () => this.actions.delete(callback);
  }

  onPresence(callback: (presence: PresenceState) => void): Unsubscribe {
    this.presence.add(callback);
    return () => this.presence.delete(callback);
  }
}

export function sanitizeDisplayName(value: string): string {
  return value.replace(/[<>&]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
}
