import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { GameService } from './services/GameService.js';
import { DomainError } from '../core/errors.js';

export interface HttpServerOptions {
  readonly gameService: GameService;
  readonly clientDistPath?: string | undefined;
}

export function createHttpApp(options: HttpServerOptions): Express {
  const { gameService } = options;
  const app = express();

  // Basic CORS & JSON headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json());

  // Liveness / Readiness health probe
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  // Create game room
  app.post('/api/games', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const preferredId = typeof req.body?.preferredId === 'string' ? req.body.preferredId : undefined;
      const { gameId, game } = await gameService.createGame(preferredId);
      res.status(201).json({
        gameId,
        status: game.getStatus(),
        currentRound: game.getCurrentRound(),
      });
    } catch (err) {
      next(err);
    }
  });

  // Query game status
  app.get('/api/games/:gameId', (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawGameId = req.params['gameId'];
      const gameId = typeof rawGameId === 'string' ? rawGameId : undefined;
      if (!gameId) {
        res.status(400).json({ error: 'Game ID required' });
        return;
      }
      const game = gameService.getGame(gameId);
      const state = game.toSnapshot();
      res.status(200).json({
        gameId: state.id,
        status: state.status,
        currentRound: state.currentRound,
        roles: Object.fromEntries(
          Object.entries(state.roles).map(([role, r]) => [
            role,
            {
              isOccupied: r.isOccupied,
              ready: r.hasSubmittedThisRound,
            },
          ]),
        ),
      });
    } catch (err) {
      next(err);
    }
  });

  // Static serving for production bundle
  const defaultDist = path.resolve(process.cwd(), 'dist/client');
  const distPath = options.clientDistPath ?? defaultDist;

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'Endpoint not found' });
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Domain error handling middleware
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof DomainError) {
      res.status(err.statusCode).json({
        code: err.code,
        message: err.message,
      });
      return;
    }

    const message = err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    });
  });

  return app;
}
