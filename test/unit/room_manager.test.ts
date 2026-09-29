import { describe, it, expect } from 'vitest';
import { parseClientMessage } from '../../src/server/protocol.js';
import { ISocket, RoomManager } from '../../src/server/RoomManager.js';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';

class MockSocket implements ISocket {
  sent: string[] = [];
  closed = false;
  closeCode: number | null = null;
  closeReason: string | null = null;
  readyState = 1; // 1 = OPEN

  send(data: string): void {
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.closed = true;
    if (code !== undefined) this.closeCode = code;
    if (reason !== undefined) this.closeReason = reason;
    this.readyState = 3; // 3 = CLOSED
  }
}

describe('WebSocket Protocol & RoomManager', () => {
  it('should parse valid client messages and reject malformed ones', () => {
    expect(parseClientMessage(JSON.stringify({ type: 'JOIN_GAME', gameId: 'g1', role: 'retailer' }))).toEqual({
      type: 'JOIN_GAME',
      gameId: 'g1',
      role: 'retailer',
      playerToken: undefined,
    });

    expect(parseClientMessage(JSON.stringify({ type: 'SUBMIT_ORDER', order: 8 }))).toEqual({
      type: 'SUBMIT_ORDER',
      order: 8,
    });

    // Reject decimals
    expect(parseClientMessage(JSON.stringify({ type: 'SUBMIT_ORDER', order: 4.5 }))).toBeNull();
    // Reject negative numbers
    expect(parseClientMessage(JSON.stringify({ type: 'SUBMIT_ORDER', order: -1 }))).toBeNull();
    // Reject invalid JSON
    expect(parseClientMessage('{invalid-json')).toBeNull();
  });

  it('should manage room sockets and gracefully supersede duplicate role connections', () => {
    const manager = new RoomManager();
    const socket1 = new MockSocket();
    const socket2 = new MockSocket();

    // 1. First tab opens retailer
    manager.registerConnection('game-1', 'retailer', 'tok-1', socket1);
    const room = manager.getRoom('game-1');
    expect(room).toBeDefined();
    expect(room?.getConnectedRoles().has('retailer')).toBe(true);

    // 2. Second tab opens retailer (duplicate takeover)
    manager.registerConnection('game-1', 'retailer', 'tok-1', socket2);

    // Socket 1 must have received SUPERSEDED and been closed
    expect(socket1.closed).toBe(true);
    expect(socket1.closeCode).toBe(4001);
    const lastMsgSocket1 = JSON.parse(socket1.sent[0] ?? '{}');
    expect(lastMsgSocket1.type).toBe('SUPERSEDED');

    // Socket 2 is now the active socket
    expect(room?.getSocketForRole('retailer')).toBe(socket2);
    expect(socket2.closed).toBe(false);
  });

  it('should broadcast sanitized PlayerViews so each socket only receives its own numbers', () => {
    const manager = new RoomManager();
    const engine = new BeerGameEngine('game-broadcast');
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    const retSocket = new MockSocket();
    const whoSocket = new MockSocket();

    manager.registerConnection('game-broadcast', 'retailer', 'token-ret', retSocket);
    manager.registerConnection('game-broadcast', 'wholesaler', 'token-who', whoSocket);

    const room = manager.getRoom('game-broadcast')!;
    room.broadcastSanitizedState(engine.toSnapshot());

    // Retailer message
    expect(retSocket.sent.length).toBe(1);
    const retPayload = JSON.parse(retSocket.sent[0]!);
    expect(retPayload.type).toBe('STATE_SYNC');
    expect(retPayload.view.myRole).toBe('retailer');
    expect(retPayload.view.myState.inventory).toBe(12);

    // Wholesaler message
    expect(whoSocket.sent.length).toBe(1);
    const whoPayload = JSON.parse(whoSocket.sent[0]!);
    expect(whoPayload.type).toBe('STATE_SYNC');
    expect(whoPayload.view.myRole).toBe('wholesaler');
    expect(whoPayload.view.myState.inventory).toBe(12);

    // Verify Fog of War: Retailer payload does not contain Wholesaler's inventory
    expect(retPayload.view.peers.wholesaler.inventory).toBeUndefined();
  });
});
