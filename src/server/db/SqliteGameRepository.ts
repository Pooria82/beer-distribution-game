import Database from 'better-sqlite3';
import { IGameRepository, PlayerSession } from '../ports/IGameRepository.js';
import { BeerGameEngine } from '../../core/BeerGameEngine.js';
import { GameState, RoleType } from '../../core/types.js';

interface GameRow {
  readonly state_json: string;
}

interface PlayerRow {
  readonly token: string;
  readonly gameId: string;
  readonly role: string;
  readonly createdAt: number;
}

export class SqliteGameRepository implements IGameRepository {
  private readonly db: Database.Database;
  private readonly stmtSaveGame: Database.Statement;
  private readonly stmtFindById: Database.Statement;
  private readonly stmtRegisterPlayer: Database.Statement;
  private readonly stmtFindPlayerByToken: Database.Statement;
  private readonly stmtFindPlayersByGameId: Database.Statement;
  private readonly stmtDeleteGame: Database.Statement;

  constructor(db: Database.Database) {
    this.db = db;

    this.stmtSaveGame = this.db.prepare(`
      INSERT INTO games (id, status, current_round, state_json, created_at, updated_at)
      VALUES (@id, @status, @currentRound, @stateJson, @createdAt, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        current_round = excluded.current_round,
        state_json = excluded.state_json,
        updated_at = excluded.updated_at
    `);

    this.stmtFindById = this.db.prepare(`
      SELECT state_json FROM games WHERE id = ?
    `);

    this.stmtRegisterPlayer = this.db.prepare(`
      INSERT INTO players (token, game_id, role, created_at)
      VALUES (@token, @gameId, @role, @createdAt)
      ON CONFLICT(token) DO UPDATE SET
        game_id = excluded.game_id,
        role = excluded.role
    `);

    this.stmtFindPlayerByToken = this.db.prepare(`
      SELECT token, game_id AS gameId, role, created_at AS createdAt
      FROM players
      WHERE token = ?
    `);

    this.stmtFindPlayersByGameId = this.db.prepare(`
      SELECT token, game_id AS gameId, role, created_at AS createdAt
      FROM players
      WHERE game_id = ?
    `);

    this.stmtDeleteGame = this.db.prepare(`
      DELETE FROM games WHERE id = ?
    `);
  }

  save(game: BeerGameEngine): void {
    const snapshot = game.toSnapshot();
    const stateJson = JSON.stringify(snapshot);

    this.stmtSaveGame.run({
      id: snapshot.id,
      status: snapshot.status,
      currentRound: snapshot.currentRound,
      stateJson,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }

  findById(id: string): BeerGameEngine | null {
    const row = this.stmtFindById.get(id) as GameRow | undefined;
    if (!row) {
      return null;
    }

    const snapshot = JSON.parse(row.state_json) as GameState;
    return BeerGameEngine.fromSnapshot(snapshot);
  }

  registerPlayer(token: string, gameId: string, role: RoleType): void {
    this.stmtRegisterPlayer.run({
      token,
      gameId,
      role,
      createdAt: Date.now(),
    });
  }

  findPlayerByToken(token: string): PlayerSession | null {
    const row = this.stmtFindPlayerByToken.get(token) as PlayerRow | undefined;
    if (!row) {
      return null;
    }

    return {
      token: row.token,
      gameId: row.gameId,
      role: row.role as RoleType,
      createdAt: row.createdAt,
    };
  }

  findPlayersByGameId(gameId: string): readonly PlayerSession[] {
    const rows = this.stmtFindPlayersByGameId.all(gameId) as PlayerRow[];
    return rows.map((row) => ({
      token: row.token,
      gameId: row.gameId,
      role: row.role as RoleType,
      createdAt: row.createdAt,
    }));
  }

  deleteGame(id: string): void {
    this.stmtDeleteGame.run(id);
  }
}
