import { RoleType } from '../../core/types.js';

export type CrossTabEvent =
  | { type: 'ROLE_CLAIMED'; gameId: string; role: RoleType }
  | { type: 'ROLE_RELEASED'; gameId: string; role: RoleType }
  | { type: 'ORDER_SUBMITTED'; gameId: string; role: RoleType; round: number }
  | { type: 'ROUND_ADVANCED'; gameId: string; round: number }
  | { type: 'GAME_STARTED'; gameId: string }
  | { type: 'ROOM_CREATED'; gameId: string };

class CrossTabBus {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(event: CrossTabEvent) => void>();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('beer_game_bus');
        this.channel.onmessage = (e: MessageEvent<CrossTabEvent>) => {
          if (e.data && typeof e.data === 'object' && 'type' in e.data) {
            for (const listener of this.listeners) {
              try {
                listener(e.data);
              } catch {
                // Ignore listener error
              }
            }
          }
        };
      } catch {
        this.channel = null;
      }
    }
  }

  broadcast(event: CrossTabEvent): void {
    try {
      this.channel?.postMessage(event);
    } catch {
      // Ignore postMessage failure
    }
  }

  subscribe(listener: (event: CrossTabEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const tabBus = new CrossTabBus();
