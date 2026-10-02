import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser } from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import WebSocket from 'ws';
import { startServer, ApplicationServer } from '../../src/server/index.js';

const VIEWPORTS = [
  { name: 'iPhone SE (Compact Mobile 320px)', width: 320, height: 568 },
  { name: 'iPhone 8/SE2 (Standard Mobile 375px)', width: 375, height: 667 },
  { name: 'iPhone 14/15/16 Pro (Large Mobile 390px)', width: 390, height: 844 },
  { name: 'iPad 10.2 / Mini (Tablet Portrait 768px)', width: 768, height: 1024 },
  { name: 'iPad Air (Tablet Portrait 820px)', width: 820, height: 1180 },
  { name: 'iPad Pro 11 / Laptop (Tablet Landscape 1024px)', width: 1024, height: 768 },
  { name: 'iPad Pro 12.9 / Ultrabook (Large Landscape 1366px)', width: 1366, height: 768 },
] as const;

function findBrowserPath(): string {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }
  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
    (process.env.PROGRAMFILES || '') + '\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return '';
}

describe('Automated Viewport & Zero-Overflow Responsive Test Matrix (320px to 1366px)', () => {
  let appServer: ApplicationServer;
  let tempDbPath: string;
  let httpUrl: string;
  let browser: Browser | null = null;
  const browserPath = findBrowserPath();

  beforeAll(async () => {
    tempDbPath = path.resolve(process.cwd(), `test_responsive_${Date.now()}.db`);
    const distClientPath = path.resolve(process.cwd(), 'dist/client');

    appServer = await startServer({
      port: 0,
      dbPath: tempDbPath,
      clientDistPath: distClientPath,
      heartbeatIntervalMs: 60_000,
    });

    httpUrl = `http://127.0.0.1:${appServer.port}`;

    if (browserPath) {
      browser = await puppeteer.launch({
        executablePath: browserPath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
  }, 20_000);

  afterAll(async () => {
    if (browser) await browser.close();
    await appServer.close();
    if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
    const wal = `${tempDbPath}-wal`;
    const shm = `${tempDbPath}-shm`;
    if (fs.existsSync(wal)) fs.unlinkSync(wal);
    if (fs.existsSync(shm)) fs.unlinkSync(shm);
  });

  it('detects a valid browser binary for automated viewport evaluation', () => {
    expect(browserPath.length).toBeGreaterThan(0);
    expect(browser).not.toBeNull();
  });

  describe('Screen 1: Lobby Screen Zero-Overflow Verification', () => {
    for (const vp of VIEWPORTS) {
      it(`guarantees zero horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`, async () => {
        if (!browser) return;
        const page = await browser.newPage();
        try {
          await page.setViewport({ width: vp.width, height: vp.height });
          await page.goto(httpUrl, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('.scada-panel', { timeout: 5000 });

          const metrics = await page.evaluate(() => {
            const root = document.documentElement;
            const body = document.body;
            return {
              scrollWidth: root.scrollWidth,
              clientWidth: root.clientWidth,
              bodyScrollWidth: body.scrollWidth,
              innerWidth: window.innerWidth,
            };
          });

          // Strict zero overflow: scrollWidth must NEVER exceed clientWidth or innerWidth
          expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
          expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
        } finally {
          await page.close();
        }
      });
    }
  });

  describe('Screen 2: Active Gameplay Cockpit Zero-Overflow Verification', () => {
    let gameId: string;
    const wsClients: WebSocket[] = [];

    beforeAll(async () => {
      // Create a game room
      const res = await fetch(`${httpUrl}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredId: 'RESPONSIVE-ACTIVE' }),
      });
      const data = (await res.json()) as { gameId: string };
      gameId = data.gameId;

      // Connect 4 virtual clients via WebSocket to start the game
      const roles = ['retailer', 'wholesaler', 'distributor', 'factory'] as const;

      await new Promise<void>((resolve, reject) => {
        let connectedCount = 0;
        for (const role of roles) {
          const ws = new WebSocket(`ws://127.0.0.1:${appServer.port}`);
          wsClients.push(ws);
          ws.on('open', () => {
            ws.send(JSON.stringify({ type: 'JOIN_GAME', gameId, role }));
          });
          ws.on('message', (raw) => {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'STATE_SYNC') {
              connectedCount++;
              if (connectedCount === 4) {
                resolve();
              }
            }
          });
          ws.on('error', reject);
        }
      });
    }, 20_000);

    afterAll(() => {
      for (const ws of wsClients) {
        ws.close();
      }
    });

    for (const vp of VIEWPORTS) {
      it(`guarantees zero horizontal overflow on ${vp.name} (${vp.width}x${vp.height}) during active gameplay`, async () => {
        if (!browser) return;
        const page = await browser.newPage();
        try {
          await page.setViewport({ width: vp.width, height: vp.height });
          // Open game as retailer
          await page.goto(`${httpUrl}/?room=${gameId}&role=retailer`, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('[data-metric="inventory"]', { timeout: 6000 });

          const metrics = await page.evaluate(() => {
            const root = document.documentElement;
            const body = document.body;
            return {
              scrollWidth: root.scrollWidth,
              clientWidth: root.clientWidth,
              bodyScrollWidth: body.scrollWidth,
              innerWidth: window.innerWidth,
            };
          });

          expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
          expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
        } finally {
          await page.close();
        }
      });
    }
  });

  describe('Screen 3: Post-Mission Results Dashboard Zero-Overflow Verification', () => {
    let completedGameId: string;
    let retailerToken: string;

    beforeAll(async () => {
      // Deterministically create and advance a game to round 20 completion via domain service
      const { gameId } = await appServer.gameService.createGame('RESPONSIVE-RESULTS');
      completedGameId = gameId;

      const r1 = await appServer.gameService.joinGame(gameId, 'retailer');
      const r2 = await appServer.gameService.joinGame(gameId, 'wholesaler');
      const r3 = await appServer.gameService.joinGame(gameId, 'distributor');
      const r4 = await appServer.gameService.joinGame(gameId, 'factory');
      retailerToken = r1.playerToken;

      for (let round = 1; round <= 20; round++) {
        await appServer.gameService.submitOrder(gameId, 'retailer', r1.playerToken, 4);
        await appServer.gameService.submitOrder(gameId, 'wholesaler', r2.playerToken, 4);
        await appServer.gameService.submitOrder(gameId, 'distributor', r3.playerToken, 4);
        await appServer.gameService.submitOrder(gameId, 'factory', r4.playerToken, 4);
      }
    }, 15_000);

    for (const vp of VIEWPORTS) {
      it(`guarantees zero horizontal overflow on ${vp.name} (${vp.width}x${vp.height}) on Results debrief screen`, async () => {
        if (!browser) return;
        const page = await browser.newPage();
        try {
          await page.setViewport({ width: vp.width, height: vp.height });
          await page.goto(`${httpUrl}/?room=${completedGameId}&role=retailer&token=${retailerToken}`, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('[data-metric="chain-cost"]', { timeout: 8000 });

          const metrics = await page.evaluate(() => {
            const root = document.documentElement;
            const body = document.body;
            return {
              scrollWidth: root.scrollWidth,
              clientWidth: root.clientWidth,
              bodyScrollWidth: body.scrollWidth,
              innerWidth: window.innerWidth,
            };
          });

          expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
          expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
        } finally {
          await page.close();
        }
      }, 15_000);
    }
  });
});
