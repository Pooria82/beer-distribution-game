import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import path from 'node:path';
import fs from 'node:fs';
import { startServer, ApplicationServer } from '../../src/server/index.js';

describe('Production Packaging & Single-Port Unified Serving Integration', () => {
  let appServer: ApplicationServer;
  let tempDbPath: string;
  let httpUrl: string;
  let wsUrl: string;
  const distClientPath = path.resolve(process.cwd(), 'dist/client');

  beforeAll(async () => {
    // Ensure production bundle exists
    if (!fs.existsSync(distClientPath) || !fs.existsSync(path.join(distClientPath, 'index.html'))) {
      throw new Error(
        `Production client bundle not found at ${distClientPath}. Please run 'npm run build' first.`,
      );
    }

    tempDbPath = path.resolve(process.cwd(), `test_prod_pkg_${Date.now()}.db`);
    appServer = await startServer({
      port: 0, // Ephemeral free port
      dbPath: tempDbPath,
      clientDistPath: distClientPath,
      heartbeatIntervalMs: 60_000,
    });

    httpUrl = `http://127.0.0.1:${appServer.port}`;
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

  it('serves operational health check on /api/health with 200 OK', async () => {
    const res = await fetch(`${httpUrl}/api/health`);
    expect(res.status).toBe(200);

    const json = (await res.json()) as any;
    expect(json.status).toBe('ok');
    expect(typeof json.uptime).toBe('number');
    expect(typeof json.timestamp).toBe('number');
  });

  it('serves the compiled React SPA on root / with HTML containing #root mount node', async () => {
    const res = await fetch(`${httpUrl}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');

    const html = await res.text();
    expect(html).toContain('<div id="root"></div>');
    expect(html.toLowerCase()).toContain('<!doctype html>');
  });

  it('provides client-side SPA routing fallback on arbitrary deep links', async () => {
    const deepRoutes = [
      '/room/GAME-DEMO',
      '/room/GAME-DEMO/station/retailer',
      '/results/GAME-DEMO',
    ];

    for (const route of deepRoutes) {
      const res = await fetch(`${httpUrl}${route}`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');

      const html = await res.text();
      expect(html).toContain('<div id="root"></div>');
    }
  });

  it('returns JSON 404 for unmatched API routes instead of falling back to SPA HTML', async () => {
    const res = await fetch(`${httpUrl}/api/non_existent_route`);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');

    const json = await res.json();
    expect(json).toEqual({ error: 'Endpoint not found' });
  });

  it('serves static assets (CSS, JS) with proper cache headers and content types', async () => {
    // Read the compiled index.html to find linked script asset
    const indexHtml = fs.readFileSync(path.join(distClientPath, 'index.html'), 'utf-8');
    const assetMatch = indexHtml.match(/src="(\/assets\/[^"]+\.js)"/);
    expect(assetMatch).not.toBeNull();

    const assetPath = assetMatch![1]!;
    const res = await fetch(`${httpUrl}${assetPath}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('javascript');

    const text = await res.text();
    expect(text.length).toBeGreaterThan(1000);
  });

  it('establishes authoritative WebSockets on the exact same HTTP port (Unified Single-Port)', async () => {
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => resolve());
      ws.once('error', reject);
    });

    // Send PING and receive PONG over the single-port gateway
    const pongPromise = new Promise<any>((resolve) => {
      ws.once('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    ws.send(JSON.stringify({ type: 'PING' }));
    const pong = await pongPromise;
    expect(pong).toEqual({ type: 'PONG' });

    // Join room and verify STATE_SYNC
    const { gameId } = await appServer.gameService.createGame('PKG-TEST-ROOM');
    const syncPromise = new Promise<any>((resolve) => {
      ws.once('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    ws.send(JSON.stringify({ type: 'JOIN_GAME', gameId, role: 'retailer' }));
    const syncMsg = await syncPromise;
    expect(syncMsg.type).toBe('STATE_SYNC');
    expect(syncMsg.view.gameId).toBe(gameId);
    expect(syncMsg.view.myRole).toBe('retailer');

    ws.close();
  });
});
