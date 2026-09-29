import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase } from '../../src/server/db/connection.js';
import { SqliteGameRepository } from '../../src/server/db/SqliteGameRepository.js';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';
import { ALL_ROLES } from '../../src/core/types.js';

describe('SQLite Persistence & Crash Recovery Integration Test', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const testDbDir = path.resolve(currentDir, '../../data/test');
  const testDbPath = path.resolve(testDbDir, 'crash_test.sqlite');

  const cleanupDbFiles = () => {
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      if (fs.existsSync(`${testDbPath}-wal`)) fs.unlinkSync(`${testDbPath}-wal`);
      if (fs.existsSync(`${testDbPath}-shm`)) fs.unlinkSync(`${testDbPath}-shm`);
      if (fs.existsSync(testDbDir)) fs.rmdirSync(testDbDir);
    } catch {
      // Ignore cleanup error if already removed
    }
  };

  afterEach(() => {
    cleanupDbFiles();
  });

  it('survives process crash/restart with 100% zero-state loss and restores player sessions', () => {
    cleanupDbFiles();

    // 1. First Process Life: Create DB connection, Repository and Game
    let db = createDatabase({ dbPath: testDbPath });
    let repo = new SqliteGameRepository(db);

    const gameId = 'game-crash-recovery-1';
    const engine = new BeerGameEngine(gameId);

    // Register 4 player tokens
    const tokens = {
      retailer: 'token-ret-1234',
      wholesaler: 'token-who-5678',
      distributor: 'token-dis-9012',
      factory: 'token-fac-3456',
    } as const;

    // Save initial game record so foreign keys can link to games(id)
    repo.save(engine);

    for (const role of ALL_ROLES) {
      repo.registerPlayer(tokens[role], gameId, role);
      engine.claimRole(role);
    }

    // Save initial in_progress state (Round 1) after roles claimed
    repo.save(engine);


    // Simulate 3 full rounds with distinct order decisions
    const ordersPerRound = [
      { retailer: 4, wholesaler: 4, distributor: 4, factory: 4 }, // Round 1
      { retailer: 6, wholesaler: 5, distributor: 4, factory: 4 }, // Round 2
      { retailer: 8, wholesaler: 6, distributor: 5, factory: 4 }, // Round 3
    ];

    for (let r = 0; r < 3; r++) {
      const orders = ordersPerRound[r]!;
      engine.submitOrder('retailer', orders.retailer);
      engine.submitOrder('wholesaler', orders.wholesaler);
      engine.submitOrder('distributor', orders.distributor);
      engine.submitOrder('factory', orders.factory);

      // Persist state after each round progression (Write-Through Pattern)
      repo.save(engine);
    }

    // Capture memory snapshot before crash
    const preCrashSnapshot = engine.toSnapshot();
    expect(preCrashSnapshot.currentRound).toBe(4);
    expect(preCrashSnapshot.status).toBe('in_progress');
    expect(preCrashSnapshot.roles.retailer.history.length).toBe(3);

    // 2. SIMULATE HARD CRASH: Abruptly close DB connection
    db.close();

    // 3. Second Process Life: Server reboot / re-opening DB from disk
    const rebootDb = createDatabase({ dbPath: testDbPath });
    const rebootRepo = new SqliteGameRepository(rebootDb);

    // Hydrate game from SQLite
    const restoredEngine = rebootRepo.findById(gameId);
    expect(restoredEngine).not.toBeNull();

    const postCrashSnapshot = restoredEngine!.toSnapshot();

    // 4. Assert 100% exact state match between pre-crash and restored
    expect(postCrashSnapshot.id).toBe(preCrashSnapshot.id);
    expect(postCrashSnapshot.status).toBe(preCrashSnapshot.status);
    expect(postCrashSnapshot.currentRound).toBe(preCrashSnapshot.currentRound);
    expect(postCrashSnapshot.totalRounds).toBe(preCrashSnapshot.totalRounds);

    for (const role of ALL_ROLES) {
      const preRole = preCrashSnapshot.roles[role];
      const postRole = postCrashSnapshot.roles[role];

      expect(postRole.inventory, `${role} inventory`).toBe(preRole.inventory);
      expect(postRole.backlog, `${role} backlog`).toBe(preRole.backlog);
      expect(postRole.lastOrderPlaced, `${role} lastOrderPlaced`).toBe(preRole.lastOrderPlaced);
      expect(postRole.totalCost, `${role} totalCost`).toBe(preRole.totalCost);
      expect(postRole.roundCost, `${role} roundCost`).toBe(preRole.roundCost);
      expect(postRole.shipmentsInTransit, `${role} shipmentsInTransit`).toEqual(preRole.shipmentsInTransit);
      expect(postRole.history, `${role} history`).toEqual(preRole.history);
    }

    // 5. Verify player session reconnection resolution
    for (const role of ALL_ROLES) {
      const session = rebootRepo.findPlayerByToken(tokens[role]);
      expect(session).not.toBeNull();
      expect(session?.gameId).toBe(gameId);
      expect(session?.role).toBe(role);
    }

    const allSessions = rebootRepo.findPlayersByGameId(gameId);
    expect(allSessions.length).toBe(4);

    rebootDb.close();
  });
});
