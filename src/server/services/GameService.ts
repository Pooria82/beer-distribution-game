import { nanoid } from 'nanoid';
import { BeerGameEngine, AdvanceResult } from '../../core/BeerGameEngine.js';
import { RoleType } from '../../core/types.js';
import { IGameRepository, PlayerSession } from '../ports/IGameRepository.js';
import { GameNotFoundError, UnauthorizedPlayerError } from '../../core/errors.js';

export class AsyncMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const run = () => {
        this.locked = true;
        resolve(() => this.release());
      };

      if (!this.locked) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }

  private release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }

  async runExclusive<T>(fn: () => T | Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export interface JoinGameResult {
  readonly playerToken: string;
  readonly game: BeerGameEngine;
  readonly started: boolean;
}

export interface SubmitOrderResult {
  readonly advanceResult: AdvanceResult;
  readonly game: BeerGameEngine;
}

export class GameService {
  private readonly repository: IGameRepository;
  private readonly activeGames = new Map<string, BeerGameEngine>();
  private readonly roomMutexes = new Map<string, AsyncMutex>();

  constructor(repository: IGameRepository) {
    this.repository = repository;
  }

  private getRoomMutex(gameId: string): AsyncMutex {
    let mutex = this.roomMutexes.get(gameId);
    if (!mutex) {
      mutex = new AsyncMutex();
      this.roomMutexes.set(gameId, mutex);
    }
    return mutex;
  }

  /**
   * Retrieves active game from memory or hydrates from SQLite.
   */
  getGame(gameId: string): BeerGameEngine {
    let game = this.activeGames.get(gameId);
    if (!game) {
      const persisted = this.repository.findById(gameId);
      if (!persisted) {
        throw new GameNotFoundError(gameId);
      }
      game = persisted;
      this.activeGames.set(gameId, game);
    }
    return game;
  }

  /**
   * Creates a new game room and persists initial state.
   */
  async createGame(preferredId?: string): Promise<{ gameId: string; game: BeerGameEngine }> {
    const gameId = preferredId ? preferredId.toUpperCase().trim() : `GAME-${nanoid(6).toUpperCase()}`;
    const mutex = this.getRoomMutex(gameId);

    return mutex.runExclusive(() => {
      const game = new BeerGameEngine(gameId);
      this.activeGames.set(gameId, game);
      this.repository.save(game);
      return { gameId, game };
    });
  }

  /**
   * Joins a player into a role.
   * If existingToken is provided and valid for this role, reuses it. Otherwise generates a new cryptographic token.
   */
  async joinGame(gameId: string, role: RoleType, existingToken?: string): Promise<JoinGameResult> {
    const mutex = this.getRoomMutex(gameId);

    return mutex.runExclusive(() => {
      const game = this.getGame(gameId);

      // Verify if player is reconnecting with an existing valid session token for this role
      if (existingToken) {
        const session = this.repository.findPlayerByToken(existingToken);
        if (session && session.gameId === gameId && session.role === role) {
          return {
            playerToken: existingToken,
            game,
            started: false,
          };
        }
      }

      // Generate new token if not provided
      const playerToken = existingToken ?? `tok_${nanoid(16)}`;

      // Claim role on domain engine
      const started = game.claimRole(role);

      // Register session in repository
      this.repository.registerPlayer(playerToken, gameId, role);

      // Write-Through persistence
      this.repository.save(game);

      return {
        playerToken,
        game,
        started,
      };
    });
  }

  /**
   * Releases a role if game is in pre-game waiting state.
   */
  async leaveRole(gameId: string, role: RoleType): Promise<BeerGameEngine> {
    const mutex = this.getRoomMutex(gameId);

    return mutex.runExclusive(() => {
      const game = this.getGame(gameId);
      game.releaseRole(role);
      this.repository.save(game);
      return game;
    });
  }

  /**
   * Resolves a player session from their token and loads the game state.
   */
  reconnectPlayer(token: string): { session: PlayerSession; game: BeerGameEngine } {
    const session = this.repository.findPlayerByToken(token);
    if (!session) {
      throw new UnauthorizedPlayerError('Session token not found or expired');
    }

    const game = this.getGame(session.gameId);
    return { session, game };
  }

  /**
   * Submits an integer order for a role with atomic Mutex protection.
   * Guarantees race-condition-free 4th order advancement and double submission locks.
   */
  async submitOrder(
    gameId: string,
    role: RoleType,
    token: string,
    order: number,
  ): Promise<SubmitOrderResult> {
    const mutex = this.getRoomMutex(gameId);

    return mutex.runExclusive(() => {
      // Validate session authorization
      const session = this.repository.findPlayerByToken(token);
      if (!session || session.gameId !== gameId || session.role !== role) {
        throw new UnauthorizedPlayerError('Token does not match assigned role for this game');
      }

      const game = this.getGame(gameId);

      // Atomically submit order on domain aggregate
      const advanceResult = game.submitOrder(role, order);

      // Write-Through persistence
      this.repository.save(game);

      return {
        advanceResult,
        game,
      };
    });
  }

  /**
   * Reviewer / Bot Helper: Auto-fills orders for remaining roles that have not submitted yet.
   */
  async simulateRound(gameId: string, defaultOrder = 4): Promise<SubmitOrderResult> {
    const mutex = this.getRoomMutex(gameId);

    return mutex.runExclusive(() => {
      const game = this.getGame(gameId);

      if (game.getStatus() === 'waiting') {
        const ALL_ROLES: RoleType[] = ['retailer', 'wholesaler', 'distributor', 'factory'];
        for (const role of ALL_ROLES) {
          if (!game.getRoles()[role].getIsOccupied()) {
            game.claimRole(role);
          }
        }
      }

      const roles = game.getRoles();
      let lastResult: AdvanceResult = { roundAdvanced: false, gameCompleted: false };

      for (const [roleName, roleEntity] of Object.entries(roles)) {
        if (!roleEntity.getHasSubmittedThisRound()) {
          lastResult = game.submitOrder(roleName as RoleType, defaultOrder);
        }
      }

      // Write-Through persistence
      this.repository.save(game);

      return {
        advanceResult: lastResult,
        game,
      };
    });
  }
}
