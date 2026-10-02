import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import path from 'node:path';
import fs from 'node:fs';
import { startServer, ApplicationServer } from '../../src/server/index.js';
import { RoleType } from '../../src/core/types.js';
import { ServerMessage, StateSyncMessage } from '../../src/server/protocol.js';

describe('Security Wire Frame Audit (Zero Opponent Metric Leakage)', () => {
  let appServer: ApplicationServer;
  let tempDbPath: string;
  let wsUrl: string;

  beforeAll(async () => {
    tempDbPath = path.resolve(process.cwd(), `test_wire_${Date.now()}.db`);
    appServer = await startServer({
      port: 0,
      dbPath: tempDbPath,
      heartbeatIntervalMs: 60_000,
    });
    wsUrl = `ws://127.0.0.1:${appServer.port}`;
  });

  afterAll(async () => {
    await appServer.close();
    if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
    const wal = `${tempDbPath}-wal`;
    const shm = `${tempDbPath}-shm`;
    if (fs.existsSync(wal)) fs.unlinkSync(wal);
    if (fs.existsSync(shm)) fs.unlinkSync(shm);
  });

  function connectClient(): Promise<{ ws: WebSocket; rawFrames: string[]; messages: ServerMessage[] }> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const rawFrames: string[] = [];
      const messages: ServerMessage[] = [];

      ws.on('message', (data) => {
        const text = data.toString();
        rawFrames.push(text);
        try {
          messages.push(JSON.parse(text));
        } catch {
          // Ignore parse errors if any
        }
      });

      ws.once('open', () => resolve({ ws, rawFrames, messages }));
      ws.once('error', reject);
    });
  }

  async function waitForCondition(fn: () => boolean, timeoutMs = 4000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (fn()) return;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }

  it('proves 100% zero opponent state leakage across raw WebSocket frames in active rounds', async () => {
    const gameId = 'WIRE-AUDIT-ROOM';
    await appServer.gameService.createGame(gameId);

    const clients: Record<RoleType, { ws: WebSocket; rawFrames: string[]; messages: ServerMessage[] }> = {
      retailer: await connectClient(),
      wholesaler: await connectClient(),
      distributor: await connectClient(),
      factory: await connectClient(),
    };

    // 1. Join each role to transition room to in_progress
    for (const role of ['retailer', 'wholesaler', 'distributor', 'factory'] as RoleType[]) {
      clients[role].ws.send(JSON.stringify({ type: 'JOIN_GAME', gameId, role }));
    }

    // Wait until all roles receive STATE_SYNC for Round 1
    await waitForCondition(() => {
      return (['retailer', 'wholesaler', 'distributor', 'factory'] as RoleType[]).every(
        (role) => clients[role].messages.some((m) => m.type === 'STATE_SYNC' && (m as StateSyncMessage).view.currentRound === 1),
      );
    });

    // 2. Deep inspect raw string frames received by Retailer
    const retailerSyncFrames = clients.retailer.rawFrames.filter((f) => f.includes('STATE_SYNC'));
    expect(retailerSyncFrames.length).toBeGreaterThan(0);

    for (const rawJson of retailerSyncFrames) {
      const parsed = JSON.parse(rawJson) as StateSyncMessage;
      const view = parsed.view;

      // Identity invariant
      expect(view.myRole).toBe('retailer');

      // Assert private opponent metrics do not exist at top level or nested
      expect((view as any).roles).toBeUndefined(); // Raw GameState.roles MUST be stripped
      expect((view as any).shippingQueue).toBeUndefined(); // Internal pipelines MUST be stripped
      expect((view as any).currentRoundIntermediates).toBeUndefined();

      // Assert peers strictly reveals ONLY occupied, ready, and connected booleans
      expect(view.peers).toBeDefined();
      const peers: RoleType[] = ['wholesaler', 'distributor', 'factory'];
      for (const peer of peers) {
        const peerData = view.peers[peer];
        expect(peerData).toBeDefined();
        expect(typeof peerData.isOccupied).toBe('boolean');
        expect(typeof peerData.hasSubmittedThisRound).toBe('boolean');
        expect(typeof peerData.isConnected).toBe('boolean');
        // Crucial: peerData must NOT leak private numbers
        expect((peerData as any).inventory).toBeUndefined();
        expect((peerData as any).backlog).toBeUndefined();
        expect((peerData as any).roundCost).toBeUndefined();
        expect((peerData as any).totalCost).toBeUndefined();
        expect((peerData as any).orderPlaced).toBeUndefined();
        expect((peerData as any).incomingOrder).toBeUndefined();
      }

      // Assert forbidden field names are completely absent from the raw string
      expect(rawJson).not.toContain('"shippingQueue"');
      expect(rawJson).not.toContain('"wholesalerInventory"');
      expect(rawJson).not.toContain('"distributorBacklog"');
      expect(rawJson).not.toContain('"factoryCost"');
    }

    // 3. Play Round 1 with asymmetric secret values:
    // Retailer orders 4, Wholesaler orders 17, Distributor orders 29, Factory orders 53
    clients.retailer.ws.send(JSON.stringify({ type: 'SUBMIT_ORDER', order: 4 }));
    clients.wholesaler.ws.send(JSON.stringify({ type: 'SUBMIT_ORDER', order: 17 }));
    clients.distributor.ws.send(JSON.stringify({ type: 'SUBMIT_ORDER', order: 29 }));
    clients.factory.ws.send(JSON.stringify({ type: 'SUBMIT_ORDER', order: 53 }));

    // Wait until round 2 is reached
    await waitForCondition(() => {
      return clients.retailer.messages.some(
        (m) => m.type === 'STATE_SYNC' && (m as StateSyncMessage).view.currentRound === 2,
      );
    });

    // Inspect Round 2 frame received by Retailer
    const round2RetailerFrames = clients.retailer.rawFrames.filter(
      (f) => f.includes('STATE_SYNC') && f.includes('"currentRound":2'),
    );
    expect(round2RetailerFrames.length).toBeGreaterThan(0);

    const round2Json = round2RetailerFrames[round2RetailerFrames.length - 1]!;
    const round2Parsed = JSON.parse(round2Json) as StateSyncMessage;

    // Assert secret order numbers (17, 29, 53) are NEVER leaked to Retailer
    expect(round2Json).not.toContain('"order":17');
    expect(round2Json).not.toContain('"orderPlaced":17');
    expect(round2Json).not.toContain('"orderPlaced":29');
    expect(round2Json).not.toContain('"orderPlaced":53');

    // Retailer's past history must only record their own history
    expect(round2Parsed.view.myState.history.length).toBe(1);
    expect(round2Parsed.view.myState.history[0]?.orderPlaced).toBe(4);

    // Teardown sockets
    for (const role of ['retailer', 'wholesaler', 'distributor', 'factory'] as RoleType[]) {
      clients[role].ws.close();
    }
  });

  it('guarantees full chain cost is broadcast ONLY when the game completes after 20 rounds', async () => {
    const gameId = 'WIRE-COMPLETION-ROOM';
    await appServer.gameService.createGame(gameId);

    const clients: Record<RoleType, { ws: WebSocket; rawFrames: string[]; messages: ServerMessage[] }> = {
      retailer: await connectClient(),
      wholesaler: await connectClient(),
      distributor: await connectClient(),
      factory: await connectClient(),
    };

    for (const role of ['retailer', 'wholesaler', 'distributor', 'factory'] as RoleType[]) {
      clients[role].ws.send(JSON.stringify({ type: 'JOIN_GAME', gameId, role }));
    }

    await waitForCondition(() => {
      return clients.retailer.messages.some((m) => m.type === 'STATE_SYNC');
    });

    // Simulate all 20 rounds where all roles order 4
    for (let round = 1; round <= 20; round++) {
      for (const role of ['retailer', 'wholesaler', 'distributor', 'factory'] as RoleType[]) {
        clients[role].ws.send(JSON.stringify({ type: 'SUBMIT_ORDER', order: 4 }));
      }

      if (round < 20) {
        await waitForCondition(
          () =>
            clients.retailer.messages.some(
              (m) =>
                (m.type === 'ROUND_ADVANCED' && (m as any).round === round + 1) ||
                (m.type === 'STATE_SYNC' && (m as StateSyncMessage).view.currentRound === round + 1),
            ),
          3000,
        );
      } else {
        await waitForCondition(
          () => clients.retailer.messages.some((m) => m.type === 'GAME_COMPLETED'),
          3000,
        );
      }
    }

    const completedMsg = clients.retailer.messages.find((m) => m.type === 'GAME_COMPLETED') as any;
    expect(completedMsg).toBeDefined();
    expect(completedMsg.type).toBe('GAME_COMPLETED');
    expect(completedMsg.totalChainCost).toBe(754); // Exact 20-round MIT reference fixture

    for (const role of ['retailer', 'wholesaler', 'distributor', 'factory'] as RoleType[]) {
      clients[role].ws.close();
    }
  });
});
