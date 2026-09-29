import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface DatabaseOptions {
  readonly dbPath?: string | undefined;
  readonly verbose?: boolean | undefined;
}

export function createDatabase(options: DatabaseOptions = {}): Database.Database {
  const defaultPath = path.resolve(process.cwd(), 'data/beer.sqlite');
  const dbPath = options.dbPath ?? defaultPath;

  // Auto-provision directory if not using in-memory SQLite
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath, {
    verbose: options.verbose ? console.log : undefined,
  });

  // Enterprise resilience & concurrency pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  // Initialize schema
  initSchema(db);

  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      current_round INTEGER NOT NULL,
      state_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      token TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_players_game_role ON players(game_id, role);
  `);
}
