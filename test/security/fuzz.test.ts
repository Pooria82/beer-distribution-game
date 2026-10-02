import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import path from 'node:path';
import fs from 'node:fs';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';
import { SupplyChainRole } from '../../src/core/SupplyChainRole.js';
import { InvalidOrderError, RoundAlreadySubmittedError } from '../../src/core/errors.js';
import { parseClientMessage } from '../../src/server/protocol.js';
import { startServer, ApplicationServer } from '../../src/server/index.js';
import { RoleType } from '../../src/core/types.js';

describe('Security & Fuzzing Suite (Domain, Protocol & Network Boundary)', () => {
  // =========================================================================
  // 1. Domain Level Fuzzing (Pure Core Entities)
  // =========================================================================
  describe('Domain Level Fuzzing', () => {
    it('rejects invalid order numbers on SupplyChainRole entity', () => {
      const role = new SupplyChainRole('retailer');

      const invalidValues: any[] = [
        -1,
        -100,
        -0.0001,
        4.5,
        10.99,
        NaN,
        Infinity,
        -Infinity,
        10001,
        50000,
        1_000_000,
        'four',
        null,
        undefined,
        {},
        [],
      ];

      for (const val of invalidValues) {
        expect(
          () => role.placeOrder(val),
          `Expected placeOrder(${JSON.stringify(val)}) to throw InvalidOrderError`,
        ).toThrow(InvalidOrderError);
      }
    });

    it('rejects double submission for the same round on SupplyChainRole', () => {
      const role = new SupplyChainRole('retailer');
      role.placeOrder(4);
      expect(role.getHasSubmittedThisRound()).toBe(true);

      expect(() => role.placeOrder(4)).toThrow(RoundAlreadySubmittedError);
    });

    it('rejects invalid order numbers on BeerGameEngine aggregate root', () => {
      const engine = new BeerGameEngine('TEST-FUZZ-1');
      engine.claimRole('retailer');
      engine.claimRole('wholesaler');
      engine.claimRole('distributor');
      engine.claimRole('factory');
      engine.start();

      const invalidOrders = [-1, -50, 2.5, NaN, Infinity, 10001, 9999999];
      for (const badOrder of invalidOrders) {
        expect(
          () => engine.submitOrder('retailer', badOrder),
          `submitOrder with ${badOrder} should throw InvalidOrderError`,
        ).toThrow(InvalidOrderError);
      }
    });
  });

  // =========================================================================
  // 2. Protocol Parsing Fuzzing (Network Boundary Gateway)
  // =========================================================================
  describe('Protocol Parser Hardening (parseClientMessage)', () => {
    it('returns null for non-string raw payloads', () => {
      expect(parseClientMessage(null)).toBeNull();
      expect(parseClientMessage(undefined)).toBeNull();
      expect(parseClientMessage(12345)).toBeNull();
      expect(parseClientMessage({})).toBeNull();
      expect(parseClientMessage([])).toBeNull();
      expect(parseClientMessage(true)).toBeNull();
    });

    it('returns null for malformed JSON strings', () => {
      expect(parseClientMessage('')).toBeNull();
      expect(parseClientMessage('{')).toBeNull();
      expect(parseClientMessage('{"type":')).toBeNull();
      expect(parseClientMessage('NOT_JSON_STRING')).toBeNull();
      expect(parseClientMessage('{"type": "JOIN_GAME", ')).toBeNull();
    });

    it('returns null for unknown message types and payloads lacking type property', () => {
      expect(parseClientMessage(JSON.stringify({}))).toBeNull();
      expect(parseClientMessage(JSON.stringify({ type: 123 }))).toBeNull();
      expect(parseClientMessage(JSON.stringify({ type: 'UNKNOWN_ACTION' }))).toBeNull();
      expect(parseClientMessage(JSON.stringify({ type: 'DROP_TABLE' }))).toBeNull();
    });

    it('protects against Prototype Pollution payloads', () => {
      const maliciousPayload = JSON.stringify({
        type: 'JOIN_GAME',
        gameId: 'TEST-ROOM',
        role: 'retailer',
        __proto__: { isAdmin: true, polluted: true },
        constructor: { prototype: { poll: true } },
      });

      const parsed = parseClientMessage(maliciousPayload);
      expect(parsed).not.toBeNull();
      expect((parsed as any).isAdmin).toBeUndefined();
      expect((Object.prototype as any).poll).toBeUndefined();
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('strictly validates SUBMIT_ORDER payload bounds in parseClientMessage', () => {
      const invalidOrders = [
        -1,
        -100,
        3.14159,
        10001,
        1_000_000_000,
        'five',
        null,
        undefined,
        {},
        [],
      ];

      for (const order of invalidOrders) {
        const payload = JSON.stringify({ type: 'SUBMIT_ORDER', order });
        expect(
          parseClientMessage(payload),
          `parseClientMessage should reject order: ${JSON.stringify(order)}`,
        ).toBeNull();
      }

      // Valid order should pass
      const valid = parseClientMessage(JSON.stringify({ type: 'SUBMIT_ORDER', order: 8 }));
      expect(valid).toEqual({ type: 'SUBMIT_ORDER', order: 8 });
    });

    it('strictly validates JOIN_GAME and RECONNECT parameters', () => {
      // Invalid JOIN_GAME
      expect(parseClientMessage(JSON.stringify({ type: 'JOIN_GAME' }))).toBeNull();
      expect(parseClientMessage(JSON.stringify({ type: 'JOIN_GAME', gameId: 123, role: 'retailer' }))).toBeNull();
      expect(parseClientMessage(JSON.stringify({ type: 'JOIN_GAME', gameId: 'G1', role: 123 }))).toBeNull();

      // Invalid RECONNECT
      expect(parseClientMessage(JSON.stringify({ type: 'RECONNECT' }))).toBeNull();
      expect(parseClientMessage(JSON.stringify({ type: 'RECONNECT', playerToken: '' }))).toBeNull();
      expect(parseClientMessage(JSON.stringify({ type: 'RECONNECT', playerToken: '   ' }))).toBeNull();
      expect(parseClientMessage(JSON.stringify({ type: 'RECONNECT', playerToken: 999 }))).toBeNull();
    });
  });

  // =========================================================================
  // 3. Live WebSocket Gateway Fuzzing & Resilience
  // =========================================================================
  describe('Live WebSocket Network Fuzzing', () => {
    let appServer: ApplicationServer;
    let tempDbPath: string;
    let wsUrl: string;

    beforeAll(async () => {
      tempDbPath = path.resolve(process.cwd(), `test_fuzz_${Date.now()}.db`);
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

    function connectRawSocket(): Promise<WebSocket> {
      return new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        ws.once('open', () => resolve(ws));
        ws.once('error', (err) => reject(err));
      });
    }

    function sendAndAwaitMessage(ws: WebSocket, payload: string): Promise<any> {
      return new Promise((resolve) => {
        ws.once('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
        ws.send(payload);
      });
    }

    it('gracefully handles raw binary / corrupted non-JSON strings without crashing', async () => {
      const ws = await connectRawSocket();

      const corruptedInputs = [
        'GARBAGE_PAYLOAD_NOT_JSON!@#$%%^&*()',
        '{"unterminated": "string',
        '00000000',
        '<!DOCTYPE html><html><body>Error</body></html>',
        '\x00\x01\x02\xFF\xFE',
      ];

      for (const input of corruptedInputs) {
        const reply = await sendAndAwaitMessage(ws, input);
        expect(reply).toEqual({
          type: 'ERROR_ALERT',
          code: 'INVALID_PAYLOAD',
          message: 'Message payload does not conform to protocol',
        });
      }

      // Assert server is still alive and responds to ping/pong
      const pong = await sendAndAwaitMessage(ws, JSON.stringify({ type: 'PING' }));
      expect(pong).toEqual({ type: 'PONG' });

      ws.close();
    });

    it('rejects unauthorized SUBMIT_ORDER from an unassigned socket', async () => {
      const ws = await connectRawSocket();

      const reply = await sendAndAwaitMessage(
        ws,
        JSON.stringify({ type: 'SUBMIT_ORDER', order: 4 }),
      );

      expect(reply).toEqual({
        type: 'ERROR_ALERT',
        code: 'UNAUTHORIZED_PLAYER',
        message: 'Socket is not attached to an active role',
      });

      ws.close();
    });

    it('rejects JOIN_GAME for a non-existent room', async () => {
      const ws = await connectRawSocket();

      const reply = await sendAndAwaitMessage(
        ws,
        JSON.stringify({
          type: 'JOIN_GAME',
          gameId: 'NON_EXISTENT_ROOM_XYZ',
          role: 'retailer',
        }),
      );

      expect(reply).toMatchObject({
        type: 'ERROR_ALERT',
        code: 'GAME_NOT_FOUND',
      });

      ws.close();
    });

    it('rejects double order submission over WebSocket with typed ERROR_ALERT', async () => {
      // Create a game first via GameService
      const { gameId } = await appServer.gameService.createGame('FUZZ-DOUBLE-SUBMIT');

      const sockets: Record<RoleType, WebSocket> = {
        retailer: await connectRawSocket(),
        wholesaler: await connectRawSocket(),
        distributor: await connectRawSocket(),
        factory: await connectRawSocket(),
      };

      // Join all 4 roles to start game
      for (const role of ['retailer', 'wholesaler', 'distributor', 'factory'] as RoleType[]) {
        const joinMsg = JSON.stringify({
          type: 'JOIN_GAME',
          gameId,
          role,
        });
        await sendAndAwaitMessage(sockets[role], joinMsg);
      }

      // Retailer submits valid order
      sockets.retailer.send(JSON.stringify({ type: 'SUBMIT_ORDER', order: 4 }));
      // Drain the state broadcast
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Retailer submits second order in the same round
      const doubleReply = await sendAndAwaitMessage(
        sockets.retailer,
        JSON.stringify({ type: 'SUBMIT_ORDER', order: 4 }),
      );

      expect(doubleReply).toMatchObject({
        type: 'ERROR_ALERT',
        code: 'ROUND_ALREADY_SUBMITTED',
      });

      // Cleanup
      for (const ws of Object.values(sockets)) {
        ws.close();
      }
    });
  });
});
