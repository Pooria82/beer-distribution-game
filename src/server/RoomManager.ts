import { GameState, RoleType } from '../core/types.js';
import { StateSanitizer } from '../core/StateSanitizer.js';
import { ServerMessage, StateSyncMessage, SupersededMessage } from './protocol.js';

export interface ISocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  readonly readyState: number;
}

export class GameRoom {
  readonly gameId: string;
  private readonly sockets = new Map<RoleType, ISocket>();
  private readonly tokens = new Map<RoleType, string>();

  constructor(gameId: string) {
    this.gameId = gameId;
  }

  /**
   * Attaches a WebSocket to a role.
   * If another socket is already connected for this role, it sends a SUPERSEDED
   * frame to the old socket and gracefully disconnects it (duplicate role takeover).
   */
  attachSocket(role: RoleType, token: string, socket: ISocket): void {
    const existingSocket = this.sockets.get(role);
    if (existingSocket && existingSocket !== socket) {
      const supersedeMsg: SupersededMessage = {
        type: 'SUPERSEDED',
        message: 'This role was opened in another window or tab.',
      };
      try {
        existingSocket.send(JSON.stringify(supersedeMsg));
        existingSocket.close(4001, 'Superseded by new session');
      } catch {
        // Socket may already be dead, safely ignore
      }
    }

    this.sockets.set(role, socket);
    this.tokens.set(role, token);
  }

  detachSocket(socket: ISocket): RoleType | null {
    for (const [role, s] of this.sockets.entries()) {
      if (s === socket) {
        this.sockets.delete(role);
        return role;
      }
    }
    return null;
  }

  getSocketForRole(role: RoleType): ISocket | undefined {
    return this.sockets.get(role);
  }

  getTokenForRole(role: RoleType): string | undefined {
    return this.tokens.get(role);
  }

  getConnectedRoles(): Set<RoleType> {
    const connected = new Set<RoleType>();
    for (const [role, socket] of this.sockets.entries()) {
      // readyState 1 is OPEN in WebSocket standard
      if (socket.readyState === 1) {
        connected.add(role);
      }
    }
    return connected;
  }

  /**
   * Broadcasts individualized, sanitized state views to all connected roles.
   * Fog of War is strictly enforced: each socket only receives its own numbers.
   */
  broadcastSanitizedState(gameState: GameState): void {
    const connectedRoles = this.getConnectedRoles();

    for (const [role, socket] of this.sockets.entries()) {
      if (socket.readyState === 1) {
        const token = this.tokens.get(role) ?? '';
        const view = StateSanitizer.sanitize(gameState, role, connectedRoles);
        const syncMsg: StateSyncMessage = {
          type: 'STATE_SYNC',
          view,
          playerToken: token,
        };
        try {
          socket.send(JSON.stringify(syncMsg));
        } catch {
          // Socket write failed, cleanup handled on disconnect
        }
      }
    }
  }

  broadcastMessage(message: ServerMessage): void {
    const payload = JSON.stringify(message);
    for (const socket of this.sockets.values()) {
      if (socket.readyState === 1) {
        try {
          socket.send(payload);
        } catch {
          // Ignore write error on dropped socket
        }
      }
    }
  }

  sendMessageToRole(role: RoleType, message: ServerMessage): void {
    const socket = this.sockets.get(role);
    if (socket && socket.readyState === 1) {
      try {
        socket.send(JSON.stringify(message));
      } catch {
        // Socket write error
      }
    }
  }

  isEmpty(): boolean {
    return this.sockets.size === 0;
  }
}

export class RoomManager {
  private readonly rooms = new Map<string, GameRoom>();
  private readonly socketToRoomMap = new Map<ISocket, { gameId: string; role: RoleType }>();

  getOrCreateRoom(gameId: string): GameRoom {
    let room = this.rooms.get(gameId);
    if (!room) {
      room = new GameRoom(gameId);
      this.rooms.set(gameId, room);
    }
    return room;
  }

  getRoom(gameId: string): GameRoom | undefined {
    return this.rooms.get(gameId);
  }

  registerConnection(gameId: string, role: RoleType, token: string, socket: ISocket): GameRoom {
    const room = this.getOrCreateRoom(gameId);
    room.attachSocket(role, token, socket);
    this.socketToRoomMap.set(socket, { gameId, role });
    return room;
  }

  handleDisconnect(socket: ISocket): { gameId: string; role: RoleType } | null {
    const mapping = this.socketToRoomMap.get(socket);
    if (!mapping) {
      return null;
    }

    this.socketToRoomMap.delete(socket);
    const room = this.rooms.get(mapping.gameId);
    if (room) {
      room.detachSocket(socket);
    }

    return mapping;
  }

  getMappingForSocket(socket: ISocket): { gameId: string; role: RoleType } | undefined {
    return this.socketToRoomMap.get(socket);
  }

  removeRoomIfEmpty(gameId: string): boolean {
    const room = this.rooms.get(gameId);
    if (room && room.isEmpty()) {
      this.rooms.delete(gameId);
      return true;
    }
    return false;
  }
}
