import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import path from 'node:path';
import fs from 'node:fs';
import { startServer, ApplicationServer } from '../../src/server/index.js';
import {
  ClientMessage,
  ServerMessage,
  StateSyncMessage,
  GameStartedMessage,
  RoundAdvancedMessage,
  SupersededMessage,
} from '../../src/server/protocol.js';

class VirtualClient {
  readonly ws: WebSocket;
  private messageQueue: ServerMessage[] = [];
  private listeners: Array<(msg: ServerMessage) => boolean> = [];

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.on('message', (data) => {
      const parsed = JSON.parse(data.toString()) as ServerMessage;
      // Check active listeners
      let handled = false;
      for (let i = 0; i < this.listeners.length; i++) {
        const listener = this.listeners[i]!;
        if (listener(parsed)) {
          this.listeners.splice(i, 1);
          handled = true;
          break;
        }
      }
      if (!handled) {
        this.messageQueue.push(parsed);
      }
    });
  }

  async waitForOpen(): Promise<void> {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((resolve, reject) => {
      this.ws.once('open', () => resolve());
      this.ws.once('error', (err) => reject(err));
    });
  }

  send(msg: ClientMessage): void {
    this.ws.send(JSON.stringify(msg));
  }

  async waitForMessage<T extends ServerMessage>(
    predicateOrType: T['type'] | ((msg: ServerMessage) => msg is T),
    label?: string,
    timeoutMs = 4000,
  ): Promise<T> {
    const desc = label ?? (typeof predicateOrType === 'string' ? predicateOrType : 'custom predicate');
    const predicate =
      typeof predicateOrType === 'function'
        ? predicateOrType
        : (m: ServerMessage): m is T => m.type === predicateOrType;

    // Check if message is already queued
    const idx = this.messageQueue.findIndex(predicate);
    if (idx !== -1) {
      const [matched] = this.messageQueue.splice(idx, 1);
      return matched as T;
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const queuedTypes = this.messageQueue.map((m) => m.type).join(', ');
        reject(new Error(`Timeout waiting for [${desc}]. Queued messages: [${queuedTypes}]`));
      }, timeoutMs);

      const listener = (msg: ServerMessage): boolean => {
        if (predicate(msg)) {
          clearTimeout(timer);
          resolve(msg);
          return true;
        }
        return false;
      };

      this.listeners.push(listener);
    });
  }

  close(): void {
    if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.close();
    }
  }
}

describe('Authoritative WebSocket & Express Integration', () => {
  let appServer: ApplicationServer;
  let testDbPath: string;
  let wsUrl: string;
  let httpUrl: string;

  beforeAll(async () => {
    testDbPath = path.resolve(process.cwd(), `data/test_ws_${Date.now()}.sqlite`);
    appServer = await startServer({
      port: 0, // OS assigns an ephemeral free port
      dbPath: testDbPath,
      heartbeatIntervalMs: 10_000,
    });

    httpUrl = `http://127.0.0.1:${appServer.port}`;
    wsUrl = `ws://127.0.0.1:${appServer.port}`;
  });

  afterAll(async () => {
    await appServer.close();
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {
        // Safe to ignore on Windows file handle delay
      }
    }
  });

  it('serves health probe via HTTP GET /api/health', async () => {
    const res = await fetch(`${httpUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; uptime: number };
    expect(data.status).toBe('ok');
    expect(typeof data.uptime).toBe('number');
  });

  it('creates game room via HTTP POST /api/games', async () => {
    const res = await fetch(`${httpUrl}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredId: 'WS-ROOM-1' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { gameId: string; status: string };
    expect(data.gameId).toBe('WS-ROOM-1');
    expect(data.status).toBe('waiting');
  });

  it('orchestrates 4 virtual clients: role claim, game start, simultaneous ordering, and Fog-of-War', async () => {
    const gameId = 'WS-ROOM-1';

    // 1. Connect 4 virtual clients
    const retailerClient = new VirtualClient(wsUrl);
    const wholesalerClient = new VirtualClient(wsUrl);
    const distributorClient = new VirtualClient(wsUrl);
    const factoryClient = new VirtualClient(wsUrl);

    await Promise.all([
      retailerClient.waitForOpen(),
      wholesalerClient.waitForOpen(),
      distributorClient.waitForOpen(),
      factoryClient.waitForOpen(),
    ]);

    // 2. Retailer joins
    retailerClient.send({ type: 'JOIN_GAME', gameId, role: 'retailer' });
    const rSync1 = await retailerClient.waitForMessage<StateSyncMessage>('STATE_SYNC');
    expect(rSync1.view.myRole).toBe('retailer');
    expect(rSync1.view.status).toBe('waiting');
    expect(rSync1.playerToken).toMatch(/^tok_/);
    const retailerToken = rSync1.playerToken;

    // 3. Wholesaler joins
    wholesalerClient.send({ type: 'JOIN_GAME', gameId, role: 'wholesaler' });
    const wSync1 = await wholesalerClient.waitForMessage<StateSyncMessage>('STATE_SYNC');
    expect(wSync1.view.myRole).toBe('wholesaler');

    // 4. Distributor joins
    distributorClient.send({ type: 'JOIN_GAME', gameId, role: 'distributor' });
    const dSync1 = await distributorClient.waitForMessage<StateSyncMessage>('STATE_SYNC');
    expect(dSync1.view.myRole).toBe('distributor');

    // 5. Factory joins (4th player triggers auto-start)
    factoryClient.send({ type: 'JOIN_GAME', gameId, role: 'factory' });

    // All 4 clients receive GAME_STARTED
    const [startR, startW, startD, startF] = await Promise.all([
      retailerClient.waitForMessage<GameStartedMessage>('GAME_STARTED'),
      wholesalerClient.waitForMessage<GameStartedMessage>('GAME_STARTED'),
      distributorClient.waitForMessage<GameStartedMessage>('GAME_STARTED'),
      factoryClient.waitForMessage<GameStartedMessage>('GAME_STARTED'),
    ]);

    expect(startR.gameId).toBe(gameId);
    expect(startW.gameId).toBe(gameId);
    expect(startD.gameId).toBe(gameId);
    expect(startF.gameId).toBe(gameId);

    // All receive state sync for Round 1
    const rSync2 = await retailerClient.waitForMessage<StateSyncMessage>(
      (m): m is StateSyncMessage => m.type === 'STATE_SYNC' && m.view.status === 'in_progress',
    );
    expect(rSync2.view.status).toBe('in_progress');
    expect(rSync2.view.currentRound).toBe(1);
    expect(rSync2.view.myState.inventory).toBe(12);
    expect(rSync2.view.myState.backlog).toBe(0);

    // Fog of War Verification: opponent numbers are NOT present
    const peers = Object.values(rSync2.view.peers);
    expect(peers.length).toBe(4);
    for (const peer of peers) {
      expect(peer).toHaveProperty('role');
      expect(peer).toHaveProperty('isOccupied', true);
      expect(peer).toHaveProperty('hasSubmittedThisRound', false);
      expect(peer).not.toHaveProperty('inventory');
      expect(peer).not.toHaveProperty('backlog');
      expect(peer).not.toHaveProperty('lastOrderPlaced');
    }

    // 6. Submit orders concurrently across all 4 roles
    retailerClient.send({ type: 'SUBMIT_ORDER', order: 4 });
    wholesalerClient.send({ type: 'SUBMIT_ORDER', order: 4 });
    distributorClient.send({ type: 'SUBMIT_ORDER', order: 4 });
    factoryClient.send({ type: 'SUBMIT_ORDER', order: 4 });

    // When 4th order arrives, ROUND_ADVANCED is broadcast
    const [advR, advW, advD, advF] = await Promise.all([
      retailerClient.waitForMessage<RoundAdvancedMessage>('ROUND_ADVANCED'),
      wholesalerClient.waitForMessage<RoundAdvancedMessage>('ROUND_ADVANCED'),
      distributorClient.waitForMessage<RoundAdvancedMessage>('ROUND_ADVANCED'),
      factoryClient.waitForMessage<RoundAdvancedMessage>('ROUND_ADVANCED'),
    ]);

    expect(advR.round).toBe(2);
    expect(advW.round).toBe(2);
    expect(advD.round).toBe(2);
    expect(advF.round).toBe(2);

    // 7. Verify Round 2 State Sync
    const rRound2 = await retailerClient.waitForMessage<StateSyncMessage>(
      (m): m is StateSyncMessage => m.type === 'STATE_SYNC' && m.view.currentRound === 2,
    );
    expect(rRound2.view.currentRound).toBe(2);
    expect(rRound2.view.myState.history.length).toBe(1);

    // 8. Test Duplicate Role Takeover
    const takeoverClient = new VirtualClient(wsUrl);
    await takeoverClient.waitForOpen();

    takeoverClient.send({
      type: 'JOIN_GAME',
      gameId,
      role: 'retailer',
      playerToken: retailerToken,
    });

    // Old socket receives SUPERSEDED and is cleanly disconnected
    const superseded = await retailerClient.waitForMessage<SupersededMessage>('SUPERSEDED');
    expect(superseded.type).toBe('SUPERSEDED');

    // New socket receives active state sync
    const takeoverSync = await takeoverClient.waitForMessage<StateSyncMessage>('STATE_SYNC');
    expect(takeoverSync.view.myRole).toBe('retailer');
    expect(takeoverSync.view.currentRound).toBe(2);

    // Cleanup virtual clients
    retailerClient.close();
    wholesalerClient.close();
    distributorClient.close();
    factoryClient.close();
    takeoverClient.close();
  });

  it('provides zero-polling real-time lobby sync via WATCH_ROOM and REQUEST_SYNC', async () => {
    // 1. Create room
    const createRes = await fetch(`${httpUrl}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: 'REALTIME-LOBBY-TEST' }),
    });
    expect(createRes.status).toBe(201);
    const { gameId } = (await createRes.json()) as { gameId: string };

    // 2. Connect a lobby spectator tab
    const lobbyClient = new VirtualClient(wsUrl);
    await lobbyClient.waitForOpen();

    lobbyClient.send({
      type: 'WATCH_ROOM',
      gameId,
    });

    // Lobby client immediately receives active ROOM_STATE
    const initialLobbyState = await lobbyClient.waitForMessage<any>('ROOM_STATE');
    expect(initialLobbyState.gameId).toBe(gameId);
    expect(initialLobbyState.roles.retailer.isOccupied).toBe(false);

    // 3. Connect a player tab and claim retailer
    const playerClient = new VirtualClient(wsUrl);
    await playerClient.waitForOpen();

    playerClient.send({
      type: 'JOIN_GAME',
      gameId,
      role: 'retailer',
    });

    const playerSync = await playerClient.waitForMessage<StateSyncMessage>('STATE_SYNC');
    expect(playerSync.view.myRole).toBe('retailer');

    // 4. Lobby client receives updated ROOM_STATE in 0ms without polling!
    const updatedLobbyState = await lobbyClient.waitForMessage<any>(
      (m: any) => m.type === 'ROOM_STATE' && m.roles.retailer.isOccupied === true,
      'ROOM_STATE with retailer occupied',
    );
    expect(updatedLobbyState.roles.retailer.isOccupied).toBe(true);
    expect(updatedLobbyState.roles.wholesaler.isOccupied).toBe(false);

    // 5. Test REQUEST_SYNC
    playerClient.send({ type: 'REQUEST_SYNC' });
    const freshSync = await playerClient.waitForMessage<StateSyncMessage>('STATE_SYNC');
    expect(freshSync.view.myRole).toBe('retailer');

    lobbyClient.close();
    playerClient.close();
  });
});
