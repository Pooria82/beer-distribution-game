import { RoleType } from '../../core/types.js';
import { BeerGameEngine } from '../../core/BeerGameEngine.js';

export interface PlayerSession {
  readonly token: string;
  readonly gameId: string;
  readonly role: RoleType;
  readonly createdAt: number;
}

export interface IGameRepository {
  /**
   * Persists or updates the game aggregate state.
   */
  save(game: BeerGameEngine): void;

  /**
   * Hydrates a game aggregate by its unique room ID.
   */
  findById(id: string): BeerGameEngine | null;

  /**
   * Links a cryptographic player session token to a game role.
   */
  registerPlayer(token: string, gameId: string, role: RoleType): void;

  /**
   * Resolves a player session token to its game and role.
   */
  findPlayerByToken(token: string): PlayerSession | null;

  /**
   * Returns all active player sessions registered for a game.
   */
  findPlayersByGameId(gameId: string): readonly PlayerSession[];

  /**
   * Deletes a game and cascades player sessions.
   */
  deleteGame(id: string): void;
}
