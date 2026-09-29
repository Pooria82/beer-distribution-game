import http from 'node:http';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { createDatabase } from './db/connection.js';
import { SqliteGameRepository } from './db/SqliteGameRepository.js';
import { GameService } from './services/GameService.js';
import { createHttpApp } from './HttpServer.js';
import { WebSocketGateway } from './WebSocketServer.js';

export interface ServerConfig {
  readonly port?: number;
  readonly host?: string;
  readonly dbPath?: string;
  readonly clientDistPath?: string;
  readonly heartbeatIntervalMs?: number;
}

export interface ApplicationServer {
  readonly server: http.Server;
  readonly gateway: WebSocketGateway;
  readonly gameService: GameService;
  readonly db: Database.Database;
  readonly port: number;
  close(): Promise<void>;
}

export async function startServer(config: ServerConfig = {}): Promise<ApplicationServer> {
  const port = config.port ?? parseInt(process.env['PORT'] ?? '3000', 10);
  const host = config.host ?? '0.0.0.0';

  // Persistence & Application Services
  const db = createDatabase({ dbPath: config.dbPath });
  const repository = new SqliteGameRepository(db);
  const gameService = new GameService(repository);

  // Express HTTP Server
  const app = createHttpApp({
    gameService,
    clientDistPath: config.clientDistPath,
  });
  const server = http.createServer(app);

  // Authoritative WebSocket Server
  const gateway = new WebSocketGateway({
    server,
    gameService,
    heartbeatIntervalMs: config.heartbeatIntervalMs,
  });

  // Start listening
  await new Promise<void>((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, host, () => {
      resolve();
    });
  });

  const address = server.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : port;

  const appServer: ApplicationServer = {
    server,
    gateway,
    gameService,
    db,
    port: actualPort,
    async close() {
      await gateway.close();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      db.close();
    },
  };

  return appServer;
}

// Auto-run if executed directly
const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectExecution) {
  startServer()
    .then((appServer) => {
      console.log(`[BeerGame] Authoritative Server running on http://localhost:${appServer.port}`);
      console.log(`[BeerGame] Health check endpoint: http://localhost:${appServer.port}/api/health`);
      console.log(`[BeerGame] WebSocket endpoint: ws://localhost:${appServer.port}`);

      const shutdown = async (signal: string) => {
        console.log(`[BeerGame] Received ${signal}. Initiating graceful shutdown...`);
        try {
          await appServer.close();
          console.log('[BeerGame] Graceful shutdown complete.');
          process.exit(0);
        } catch (err) {
          console.error('[BeerGame] Error during shutdown:', err);
          process.exit(1);
        }
      };

      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
    })
    .catch((err) => {
      console.error('[BeerGame] Failed to start server:', err);
      process.exit(1);
    });
}
