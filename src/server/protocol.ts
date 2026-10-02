import { PlayerView, RoleType } from '../core/types.js';

// ==========================================
// Client -> Server Message Contracts
// ==========================================

export interface JoinGameMessage {
  readonly type: 'JOIN_GAME';
  readonly gameId: string;
  readonly role: RoleType;
  readonly playerToken?: string | undefined;
}

export interface ReconnectMessage {
  readonly type: 'RECONNECT';
  readonly playerToken: string;
}

export interface SubmitOrderMessage {
  readonly type: 'SUBMIT_ORDER';
  readonly order: number;
}

export interface PingMessage {
  readonly type: 'PING';
}

export interface SimulateRoundMessage {
  readonly type: 'SIMULATE_ROUND';
  readonly targetRound?: number | undefined;
}

export interface WatchRoomMessage {
  readonly type: 'WATCH_ROOM';
  readonly gameId: string;
}

export interface RequestSyncMessage {
  readonly type: 'REQUEST_SYNC';
}

export type ClientMessage =
  | JoinGameMessage
  | ReconnectMessage
  | SubmitOrderMessage
  | PingMessage
  | SimulateRoundMessage
  | WatchRoomMessage
  | RequestSyncMessage;

// ==========================================
// Server -> Client Message Contracts
// ==========================================

export interface StateSyncMessage {
  readonly type: 'STATE_SYNC';
  readonly view: PlayerView;
  readonly playerToken: string;
}

export interface RoomStateMessage {
  readonly type: 'ROOM_STATE';
  readonly gameId: string;
  readonly status: string;
  readonly roles: Record<RoleType, { isOccupied: boolean; ready: boolean }>;
}

export interface ErrorAlertMessage {
  readonly type: 'ERROR_ALERT';
  readonly code: string;
  readonly message: string;
}

export interface SupersededMessage {
  readonly type: 'SUPERSEDED';
  readonly message: string;
}

export interface GameStartedMessage {
  readonly type: 'GAME_STARTED';
  readonly gameId: string;
}

export interface RoundAdvancedMessage {
  readonly type: 'ROUND_ADVANCED';
  readonly round: number;
}

export interface GameCompletedMessage {
  readonly type: 'GAME_COMPLETED';
  readonly totalChainCost: number;
}

export interface PongMessage {
  readonly type: 'PONG';
}

export type ServerMessage =
  | StateSyncMessage
  | RoomStateMessage
  | ErrorAlertMessage
  | SupersededMessage
  | GameStartedMessage
  | RoundAdvancedMessage
  | GameCompletedMessage
  | PongMessage;

/**
 * Safely parses and validates incoming WebSocket string payload.
 */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  try {
    if (typeof raw !== 'string') return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
      return null;
    }

    switch (parsed.type) {
      case 'JOIN_GAME':
        if (typeof parsed.gameId === 'string' && typeof parsed.role === 'string') {
          return {
            type: 'JOIN_GAME',
            gameId: parsed.gameId.trim(),
            role: parsed.role as RoleType,
            playerToken: typeof parsed.playerToken === 'string' ? parsed.playerToken : undefined,
          };
        }
        return null;

      case 'RECONNECT':
        if (typeof parsed.playerToken === 'string' && parsed.playerToken.trim().length > 0) {
          return {
            type: 'RECONNECT',
            playerToken: parsed.playerToken.trim(),
          };
        }
        return null;

      case 'SUBMIT_ORDER':
        if (
          typeof parsed.order === 'number' &&
          Number.isInteger(parsed.order) &&
          parsed.order >= 0 &&
          parsed.order <= 10000
        ) {
          return {
            type: 'SUBMIT_ORDER',
            order: parsed.order,
          };
        }
        return null;


      case 'PING':
        return { type: 'PING' };

      case 'SIMULATE_ROUND':
        return {
          type: 'SIMULATE_ROUND',
          targetRound:
            typeof parsed.targetRound === 'number' &&
            Number.isInteger(parsed.targetRound) &&
            parsed.targetRound >= 1
              ? parsed.targetRound
              : undefined,
        };

      case 'WATCH_ROOM':
        if (typeof parsed.gameId === 'string' && parsed.gameId.trim().length > 0) {
          return {
            type: 'WATCH_ROOM',
            gameId: parsed.gameId.trim().toUpperCase(),
          };
        }
        return null;

      case 'REQUEST_SYNC':
        return { type: 'REQUEST_SYNC' };

      default:
        return null;
    }
  } catch {
    return null;
  }
}
