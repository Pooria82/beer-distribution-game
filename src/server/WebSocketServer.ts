import { WebSocketServer as WSServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'node:http';
import { GameService } from './services/GameService.js';
import { RoomManager } from './RoomManager.js';
import { parseClientMessage, ServerMessage, ErrorAlertMessage } from './protocol.js';
import { DomainError, RoundAlreadySubmittedError } from '../core/errors.js';
import { StateSanitizer } from '../core/StateSanitizer.js';

export interface WebSocketGatewayOptions {
  readonly server?: HttpServer | undefined;
  readonly port?: number | undefined;
  readonly gameService: GameService;
  readonly roomManager?: RoomManager | undefined;
  readonly heartbeatIntervalMs?: number | undefined;
}

interface TrackedWebSocket extends WebSocket {
  isAlive?: boolean | undefined;
}

export class WebSocketGateway {
  private readonly wss: WSServer;
  private readonly gameService: GameService;
  private readonly roomManager: RoomManager;
  private readonly heartbeatTimer: NodeJS.Timeout;

  constructor(options: WebSocketGatewayOptions) {
    this.gameService = options.gameService;
    this.roomManager = options.roomManager ?? new RoomManager();

    if (options.server) {
      this.wss = new WSServer({ server: options.server });
    } else if (typeof options.port === 'number') {
      this.wss = new WSServer({ port: options.port });
    } else {
      this.wss = new WSServer({ noServer: true });
    }

    this.setupConnectionHandling();

    // 30-Second Ping/Pong Heartbeat to eliminate idle timeouts
    const intervalMs = options.heartbeatIntervalMs ?? 30_000;
    this.heartbeatTimer = setInterval(() => {
      this.performHeartbeat();
    }, intervalMs);
    this.heartbeatTimer.unref();
  }

  getRoomManager(): RoomManager {
    return this.roomManager;
  }

  getWss(): WSServer {
    return this.wss;
  }

  private setupConnectionHandling(): void {
    this.wss.on('connection', (ws: TrackedWebSocket) => {
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data: Buffer | string) => {
        try {
          await this.handleClientMessage(ws, data.toString());
        } catch (err) {
          this.handleError(ws, err);
        }
      });

      ws.on('close', () => {
        this.handleClientDisconnect(ws);
      });

      ws.on('error', () => {
        this.handleClientDisconnect(ws);
      });
    });
  }

  private async handleClientMessage(ws: TrackedWebSocket, rawMessage: string): Promise<void> {
    const msg = parseClientMessage(rawMessage);
    if (!msg) {
      this.sendError(ws, 'INVALID_PAYLOAD', 'Message payload does not conform to protocol');
      return;
    }

    switch (msg.type) {
      case 'PING': {
        ws.isAlive = true;
        this.sendMessage(ws, { type: 'PONG' });
        break;
      }

      case 'WATCH_ROOM': {
        this.roomManager.registerLobbyConnection(msg.gameId, ws);
        try {
          const game = this.gameService.getGame(msg.gameId);
          const roles = game.getRoles();
          this.sendMessage(ws, {
            type: 'ROOM_STATE',
            gameId: msg.gameId,
            status: game.getStatus(),
            roles: {
              retailer: {
                isOccupied: roles.retailer.getIsOccupied(),
                ready: roles.retailer.getHasSubmittedThisRound(),
              },
              wholesaler: {
                isOccupied: roles.wholesaler.getIsOccupied(),
                ready: roles.wholesaler.getHasSubmittedThisRound(),
              },
              distributor: {
                isOccupied: roles.distributor.getIsOccupied(),
                ready: roles.distributor.getHasSubmittedThisRound(),
              },
              factory: {
                isOccupied: roles.factory.getIsOccupied(),
                ready: roles.factory.getHasSubmittedThisRound(),
              },
            },
          });
        } catch {
          this.sendError(ws, 'GAME_NOT_FOUND', `Game room "${msg.gameId}" not found`);
        }
        break;
      }

      case 'REQUEST_SYNC': {
        const mapping = this.roomManager.getMappingForSocket(ws);
        if (mapping && mapping.gameId) {
          try {
            const game = this.gameService.getGame(mapping.gameId);
            const room = this.roomManager.getRoom(mapping.gameId);
            if (mapping.role) {
              const token = room?.getTokenForRole(mapping.role) ?? '';
              const connectedRoles = room?.getConnectedRoles() ?? new Set();
              const view = StateSanitizer.sanitize(game.toSnapshot(), mapping.role, connectedRoles);
              this.sendMessage(ws, { type: 'STATE_SYNC', view, playerToken: token });
            } else {
              const roles = game.getRoles();
              this.sendMessage(ws, {
                type: 'ROOM_STATE',
                gameId: mapping.gameId,
                status: game.getStatus(),
                roles: {
                  retailer: {
                    isOccupied: roles.retailer.getIsOccupied(),
                    ready: roles.retailer.getHasSubmittedThisRound(),
                  },
                  wholesaler: {
                    isOccupied: roles.wholesaler.getIsOccupied(),
                    ready: roles.wholesaler.getHasSubmittedThisRound(),
                  },
                  distributor: {
                    isOccupied: roles.distributor.getIsOccupied(),
                    ready: roles.distributor.getHasSubmittedThisRound(),
                  },
                  factory: {
                    isOccupied: roles.factory.getIsOccupied(),
                    ready: roles.factory.getHasSubmittedThisRound(),
                  },
                },
              });
            }
          } catch {
            // Room or game not initialized yet
          }
        }
        break;
      }

      case 'JOIN_GAME': {
        const result = await this.gameService.joinGame(msg.gameId, msg.role, msg.playerToken);
        const room = this.roomManager.registerConnection(
          msg.gameId,
          msg.role,
          result.playerToken,
          ws,
        );

        if (result.started) {
          room.broadcastMessage({ type: 'GAME_STARTED', gameId: msg.gameId });
        }

        // Broadcast individualized state with updated presence to all connected roles
        room.broadcastSanitizedState(result.game.toSnapshot());
        break;
      }

      case 'RECONNECT': {
        const { session, game } = this.gameService.reconnectPlayer(msg.playerToken);
        const room = this.roomManager.registerConnection(
          session.gameId,
          session.role,
          session.token,
          ws,
        );

        room.broadcastSanitizedState(game.toSnapshot());
        break;
      }

      case 'SUBMIT_ORDER': {
        const mapping = this.roomManager.getMappingForSocket(ws);
        if (!mapping || !mapping.role) {
          this.sendError(ws, 'UNAUTHORIZED_PLAYER', 'Socket is not attached to an active role');
          return;
        }

        const room = this.roomManager.getRoom(mapping.gameId);
        const token = room?.getTokenForRole(mapping.role);
        if (!token) {
          this.sendError(ws, 'UNAUTHORIZED_PLAYER', 'Session token not found for this role');
          return;
        }

        const { advanceResult, game } = await this.gameService.submitOrder(
          mapping.gameId,
          mapping.role,
          token,
          msg.order,
        );

        if (advanceResult.gameCompleted) {
          room?.broadcastMessage({
            type: 'GAME_COMPLETED',
            totalChainCost: game.getTotalChainCost(),
          });
        } else if (advanceResult.roundAdvanced) {
          room?.broadcastMessage({
            type: 'ROUND_ADVANCED',
            round: game.getCurrentRound(),
          });
        }

        room?.broadcastSanitizedState(game.toSnapshot());
        break;
      }

      case 'SIMULATE_ROUND': {
        const mapping = this.roomManager.getMappingForSocket(ws);
        if (!mapping || !mapping.role) {
          this.sendError(ws, 'UNAUTHORIZED_PLAYER', 'Socket is not attached to an active role');
          return;
        }

        const room = this.roomManager.getRoom(mapping.gameId);
        try {
          const { advanceResult, game } = await this.gameService.simulateRound(
            mapping.gameId,
            4,
            mapping.role,
            msg.targetRound,
          );

          if (advanceResult.gameCompleted) {
            room?.broadcastMessage({
              type: 'GAME_COMPLETED',
              totalChainCost: game.getTotalChainCost(),
            });
          } else if (advanceResult.roundAdvanced) {
            room?.broadcastMessage({
              type: 'ROUND_ADVANCED',
              round: game.getCurrentRound(),
            });
          }

          room?.broadcastSanitizedState(game.toSnapshot());
        } catch (err) {
          if (err instanceof RoundAlreadySubmittedError) {
            console.log(`[WebSocketGateway] Suppressed duplicate SIMULATE_ROUND: ${err.message}`);
            return;
          }
          throw err;
        }
        break;
      }
    }
  }

  private async handleClientDisconnect(ws: TrackedWebSocket): Promise<void> {
    const disconnected = this.roomManager.handleDisconnect(ws);
    if (!disconnected) return;

    if (!disconnected.role) {
      // Lobby watcher disconnected
      const room = this.roomManager.getRoom(disconnected.gameId);
      if (room && room.isEmpty()) {
        this.roomManager.removeRoomIfEmpty(disconnected.gameId);
      }
      return;
    }

    console.log(`[WebSocketGateway] Client disconnected: room=${disconnected.gameId}, role=${disconnected.role}`);

    try {
      let game = this.gameService.getGame(disconnected.gameId);
      if (game.getStatus() === 'waiting') {
        game = await this.gameService.leaveRole(disconnected.gameId, disconnected.role);
      }
      const room = this.roomManager.getRoom(disconnected.gameId);
      if (room && !room.isEmpty()) {
        room.broadcastSanitizedState(game.toSnapshot());
      } else {
        this.roomManager.removeRoomIfEmpty(disconnected.gameId);
      }
    } catch {
      // Safe to ignore if room cleanup in progress
    }
  }

  private performHeartbeat(): void {
    for (const client of this.wss.clients) {
      const ws = client as TrackedWebSocket;
      if (ws.isAlive === false) {
        console.log('[WebSocketGateway] Dead socket detected (isAlive === false). Forcibly terminating connection.');
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }

  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch {
        // Socket write error, ignore
      }
    }
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    const errorMsg: ErrorAlertMessage = {
      type: 'ERROR_ALERT',
      code,
      message,
    };
    this.sendMessage(ws, errorMsg);
  }

  private handleError(ws: WebSocket, err: unknown): void {
    if (err instanceof DomainError) {
      this.sendError(ws, err.code, err.message);
      return;
    }

    const message = err instanceof Error ? err.message : 'Internal Server Error';
    this.sendError(ws, 'INTERNAL_SERVER_ERROR', message);
  }

  async close(): Promise<void> {
    clearInterval(this.heartbeatTimer);

    return new Promise((resolve) => {
      for (const client of this.wss.clients) {
        try {
          client.terminate();
        } catch {
          // Ignore termination errors on close
        }
      }

      this.wss.close(() => {
        resolve();
      });
    });
  }
}
