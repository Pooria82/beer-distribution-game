import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';
import { ALL_ROLES } from '../../src/core/types.js';






interface ExpectedRoleRound {
  shipmentArrived: number;
  incomingOrder: number;
  shipped: number;
  inventory: number;
  backlog: number;
  roundCost: number;
  totalCost: number;
  orderPlaced: number;
}

interface FixtureData {
  rounds: Array<{
    round: number;
    retailer: ExpectedRoleRound;
    wholesaler: ExpectedRoleRound;
    distributor: ExpectedRoleRound;
    factory: ExpectedRoleRound;
  }>;
}

describe('BeerGameEngine Fixture Verification (everyone-orders-four)', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const fixturePath = path.resolve(currentDir, '../../fixtures/everyone-orders-four.json');
  const fixtureContent = fs.readFileSync(fixturePath, 'utf8');
  const fixture: FixtureData = JSON.parse(fixtureContent);

  it('should match the official reference fixture round-by-round for all 20 rounds', () => {
    const engine = new BeerGameEngine('fixture-verification-game');

    // Claim all 4 roles to start round 1
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    expect(engine.getStatus()).toBe('in_progress');
    expect(engine.getCurrentRound()).toBe(1);

    for (let r = 1; r <= 20; r++) {
      const expectedRound = fixture.rounds.find((item) => item.round === r);
      if (!expectedRound) {
        throw new Error(`Missing expected round ${r} in fixture`);
      }

      // 1. Verify state after steps 1–4, before submitting order
      const intermediates = engine.getCurrentRoundIntermediates();
      expect(intermediates).toBeDefined();

      for (const role of ALL_ROLES) {
        const expectedRoleData = expectedRound[role];
        const roleEntity = engine.getRole(role);
        const roleIntermediates = intermediates![role];

        expect(roleIntermediates.shipmentArrived, `R${r} ${role} shipmentArrived`).toBe(
          expectedRoleData.shipmentArrived,
        );
        expect(roleIntermediates.incomingOrder, `R${r} ${role} incomingOrder`).toBe(
          expectedRoleData.incomingOrder,
        );
        expect(roleIntermediates.shipped, `R${r} ${role} shipped`).toBe(expectedRoleData.shipped);

        expect(roleEntity.getInventory(), `R${r} ${role} inventory`).toBe(expectedRoleData.inventory);
        expect(roleEntity.getBacklog(), `R${r} ${role} backlog`).toBe(expectedRoleData.backlog);
        expect(roleEntity.getRoundCost(), `R${r} ${role} roundCost`).toBe(expectedRoleData.roundCost);
        expect(roleEntity.getTotalCost(), `R${r} ${role} totalCost`).toBe(expectedRoleData.totalCost);
      }

      // 2. Submit order 4 for all 4 roles
      for (const role of ALL_ROLES) {
        engine.submitOrder(role, 4);
      }

      // 3. Verify archived history record for round r
      for (const role of ALL_ROLES) {
        const history = engine.getRole(role).getHistory();
        const lastRecord = history[history.length - 1];
        expect(lastRecord).toBeDefined();
        expect(lastRecord?.round).toBe(r);
        expect(lastRecord?.orderPlaced).toBe(4);
      }
    }

    // 4. Verify game completion status and final scores
    expect(engine.getStatus()).toBe('completed');
    const finalScores = engine.getFinalScores();
    expect(finalScores.retailer).toBe(394);
    expect(finalScores.wholesaler).toBe(120);
    expect(finalScores.distributor).toBe(120);
    expect(finalScores.factory).toBe(120);
    expect(engine.getTotalChainCost()).toBe(754);
  });
});
