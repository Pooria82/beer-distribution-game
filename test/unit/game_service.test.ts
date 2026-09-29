import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '../../src/server/services/GameService.js';
import { IGameRepository, PlayerSession } from '../../src/server/ports/IGameRepository.js';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';
import { RoleType } from '../../src/core/types.js';
import { UnauthorizedPlayerError } from '../../src/core/errors.js';

class InMemoryGameRepository implements IGameRepository {
  private games = new Map<string, BeerGameEngine>();
  private players = new Map<string, PlayerSession>();

  save(game: BeerGameEngine): void {
    // Clone via snapshot to ensure clean in-memory persistence simulation
    this.games.set(game.getId(), BeerGameEngine.fromSnapshot(game.toSnapshot()));
  }

  findById(id: string): BeerGameEngine | null {
    const game = this.games.get(id);
    return game ? BeerGameEngine.fromSnapshot(game.toSnapshot()) : null;
  }

  registerPlayer(token: string, gameId: string, role: RoleType): void {
    this.players.set(token, {
      token,
      gameId,
      role,
      createdAt: Date.now(),
    });
  }

  findPlayerByToken(token: string): PlayerSession | null {
    return this.players.get(token) ?? null;
  }

  findPlayersByGameId(gameId: string): readonly PlayerSession[] {
    return Array.from(this.players.values()).filter((p) => p.gameId === gameId);
  }

  deleteGame(id: string): void {
    this.games.delete(id);
  }
}

describe('GameService & Room Mutex', () => {
  let repo: InMemoryGameRepository;
  let service: GameService;

  beforeEach(() => {
    repo = new InMemoryGameRepository();
    service = new GameService(repo);
  });

  it('creates games, manages role claiming and auto-starts when 4th joins', async () => {
    const { gameId, game } = await service.createGame('TEST-ROOM');
    expect(gameId).toBe('TEST-ROOM');
    expect(game.getStatus()).toBe('waiting');

    const p1 = await service.joinGame(gameId, 'retailer');
    expect(p1.started).toBe(false);

    await service.joinGame(gameId, 'wholesaler');
    await service.joinGame(gameId, 'distributor');
    const p4 = await service.joinGame(gameId, 'factory');

    expect(p4.started).toBe(true);
    expect(service.getGame(gameId).getStatus()).toBe('in_progress');
    expect(service.getGame(gameId).getCurrentRound()).toBe(1);

    // Verify token registration
    expect(repo.findPlayerByToken(p1.playerToken)?.role).toBe('retailer');
    expect(repo.findPlayerByToken(p4.playerToken)?.role).toBe('factory');
  });

  it('handles concurrent order submissions atomically without race conditions', async () => {
    const { gameId } = await service.createGame('CONCURRENCY-ROOM');
    const p1 = await service.joinGame(gameId, 'retailer');
    const p2 = await service.joinGame(gameId, 'wholesaler');
    const p3 = await service.joinGame(gameId, 'distributor');
    const p4 = await service.joinGame(gameId, 'factory');

    // Simulate 4 concurrent promises dispatched at the exact same millisecond
    const [r1, r2, r3, r4] = await Promise.all([
      service.submitOrder(gameId, 'retailer', p1.playerToken, 4),
      service.submitOrder(gameId, 'wholesaler', p2.playerToken, 4),
      service.submitOrder(gameId, 'distributor', p3.playerToken, 4),
      service.submitOrder(gameId, 'factory', p4.playerToken, 4),
    ]);

    // Exactly one of the four calls advanced the round
    const advancedCount = [r1, r2, r3, r4].filter((r) => r.advanceResult.roundAdvanced).length;
    expect(advancedCount).toBe(1);

    // Round advanced to 2 atomically
    const game = service.getGame(gameId);
    expect(game.getCurrentRound()).toBe(2);
  });

  it('enforces token authorization guards', async () => {
    const { gameId } = await service.createGame('AUTH-ROOM');
    const p1 = await service.joinGame(gameId, 'retailer');
    await service.joinGame(gameId, 'wholesaler');
    await service.joinGame(gameId, 'distributor');
    await service.joinGame(gameId, 'factory');

    // Invalid token
    await expect(service.submitOrder(gameId, 'retailer', 'bogus-token', 4)).rejects.toThrow(
      UnauthorizedPlayerError,
    );

    // Token used for wrong role
    await expect(service.submitOrder(gameId, 'wholesaler', p1.playerToken, 4)).rejects.toThrow(
      UnauthorizedPlayerError,
    );
  });

  it('reconnects players using valid tokens', async () => {
    const { gameId } = await service.createGame('RECONNECT-ROOM');
    const p1 = await service.joinGame(gameId, 'retailer');

    const reconnected = service.reconnectPlayer(p1.playerToken);
    expect(reconnected.session.gameId).toBe(gameId);
    expect(reconnected.session.role).toBe('retailer');
    expect(reconnected.game.getId()).toBe(gameId);

    expect(() => service.reconnectPlayer('non-existent-token')).toThrow(UnauthorizedPlayerError);
  });
});
