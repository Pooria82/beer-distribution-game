import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { startServer, ApplicationServer } from '../../src/server/index.js';
import {
  ClientMessage,
  ServerMessage,
  GameStartedMessage,
  RoundAdvancedMessage,
  GameCompletedMessage,
} from '../../src/server/protocol.js';
import { RoleType } from '../../src/core/types.js';

class VirtualPlayer {
  readonly ws: WebSocket;
  private messageQueue: ServerMessage[] = [];
  private listeners: Array<(msg: ServerMessage) => boolean> = [];

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.on('message', (data) => {
      const parsed = JSON.parse(data.toString()) as ServerMessage;
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
    timeoutMs = 6000,
  ): Promise<T> {
    const desc = label ?? (typeof predicateOrType === 'string' ? predicateOrType : 'custom predicate');
    const predicate =
      typeof predicateOrType === 'function'
        ? predicateOrType
        : (m: ServerMessage): m is T => m.type === predicateOrType;

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

describe('End-to-End: Full 20-Round Multi-Client Simulation', () => {
  let appServer: ApplicationServer;
  let testDbPath: string;
  let wsUrl: string;
  let httpUrl: string;

  beforeAll(async () => {
    testDbPath = path.join(os.tmpdir(), `beer-game-e2e-${Date.now()}.db`);
    appServer = await startServer({
      port: 0,
      dbPath: testDbPath,
    });
    wsUrl = `ws://127.0.0.1:${appServer.port}/ws`;
    httpUrl = `http://127.0.0.1:${appServer.port}`;
  });

  afterAll(async () => {
    await appServer.close();
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    }
  });

  it(
    'runs an authoritative 20-round game through WebSockets to completed debrief',
    async () => {
      // 1. Commission Game Room
      const createRes = await fetch(`${httpUrl}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredId: 'E2E-SIM-20' }),
      });
      expect(createRes.status).toBe(201);
      const { gameId } = (await createRes.json()) as { gameId: string };

      // 2. Connect 4 Distinct Players
      const roles: readonly RoleType[] = ['retailer', 'wholesaler', 'distributor', 'factory'];
      const players: Record<RoleType, VirtualPlayer> = {} as any;

      for (const role of roles) {
        const p = new VirtualPlayer(wsUrl);
        await p.waitForOpen();
        p.send({ type: 'JOIN_GAME', gameId, role });
        players[role] = p;
      }

      // 3. Await Consensus Start
      await Promise.all(
        roles.map((r) =>
          players[r].waitForMessage<GameStartedMessage>('GAME_STARTED', `Game start for ${r}`),
        ),
      );

      // 4. Play all 20 rounds lockstep
      for (let r = 1; r <= 20; r++) {
        // In rounds 1-4 demand is 4, in 5-20 demand is 8
        const orderAmount = r < 5 ? 4 : 8;

        // Submit orders concurrently
        for (const role of roles) {
          players[role].send({ type: 'SUBMIT_ORDER', order: orderAmount });
        }

        if (r < 20) {
          // Wait for round advance across all 4 players
          await Promise.all(
            roles.map((role) =>
              players[role].waitForMessage<RoundAdvancedMessage>(
                (m): m is RoundAdvancedMessage => m.type === 'ROUND_ADVANCED' && m.round === r + 1,
                `Round ${r + 1} advance for ${role}`,
              ),
            ),
          );
        } else {
          // At Round 20, wait for GAME_COMPLETED
          const completions = await Promise.all(
            roles.map((role) =>
              players[role].waitForMessage<GameCompletedMessage>(
                'GAME_COMPLETED',
                `Game completed for ${role}`,
              ),
            ),
          );

          expect(completions.length).toBe(4);
          const comp = completions[0]!;
          expect(comp.type).toBe('GAME_COMPLETED');
          expect(comp.totalChainCost).toBeGreaterThan(0);
        }
      }

      // Cleanup players
      for (const role of roles) {
        players[role].close();
      }
    },
    20000,
  );
});
