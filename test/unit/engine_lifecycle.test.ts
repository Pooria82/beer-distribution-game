import { describe, it, expect } from 'vitest';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';
import { GameFinishedError, GameNotStartedError, RoleAlreadyTakenError } from '../../src/core/errors.js';

describe('BeerGameEngine Lifecycle & Pipeline', () => {
  it('should start in waiting status and allow role claiming', () => {
    const engine = new BeerGameEngine('game-1');
    expect(engine.getStatus()).toBe('waiting');
    expect(engine.getCurrentRound()).toBe(0);

    engine.claimRole('retailer');
    expect(engine.getRole('retailer').getIsOccupied()).toBe(true);

    expect(() => engine.claimRole('retailer')).toThrow(RoleAlreadyTakenError);
    expect(() => engine.submitOrder('retailer', 4)).toThrow(GameNotStartedError);
  });

  it('should auto-start when all 4 roles are occupied and run round 1 steps 1–4', () => {
    const engine = new BeerGameEngine('game-2');
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    const started = engine.claimRole('factory');

    expect(started).toBe(true);
    expect(engine.getStatus()).toBe('in_progress');
    expect(engine.getCurrentRound()).toBe(1);

    // Verify round 1 steps 1–4 executed for all roles
    const retailer = engine.getRole('retailer');
    expect(retailer.getInventory()).toBe(12);
    expect(retailer.getBacklog()).toBe(0);
    expect(retailer.getRoundCost()).toBe(6);
    expect(retailer.getTotalCost()).toBe(6);

    const intermediates = engine.getCurrentRoundIntermediates();
    expect(intermediates?.retailer.shipmentArrived).toBe(4);
    expect(intermediates?.retailer.incomingOrder).toBe(4);
    expect(intermediates?.retailer.shipped).toBe(4);
  });

  it('should advance round only after all 4 roles submit orders', () => {
    const engine = new BeerGameEngine('game-3');
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    // 3 submit
    expect(engine.submitOrder('retailer', 4)).toEqual({ roundAdvanced: false, gameCompleted: false });
    expect(engine.submitOrder('wholesaler', 4)).toEqual({ roundAdvanced: false, gameCompleted: false });
    expect(engine.submitOrder('distributor', 4)).toEqual({ roundAdvanced: false, gameCompleted: false });
    expect(engine.getCurrentRound()).toBe(1);

    // 4th submits -> advances to round 2
    const result = engine.submitOrder('factory', 4);
    expect(result).toEqual({ roundAdvanced: true, gameCompleted: false });
    expect(engine.getCurrentRound()).toBe(2);

    // History for round 1 recorded
    const history = engine.getRole('retailer').getHistory();
    expect(history.length).toBe(1);
    expect(history[0]?.round).toBe(1);
    expect(history[0]?.orderPlaced).toBe(4);
  });

  it('should complete game after totalRounds and prevent further submissions', () => {
    const engine = new BeerGameEngine('game-fast', 1);
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    engine.submitOrder('retailer', 4);
    engine.submitOrder('wholesaler', 4);
    engine.submitOrder('distributor', 4);
    const result = engine.submitOrder('factory', 4);

    expect(result).toEqual({ roundAdvanced: false, gameCompleted: true });
    expect(engine.getStatus()).toBe('completed');
    expect(() => engine.submitOrder('retailer', 4)).toThrow(GameFinishedError);
  });

  it('should serialize to snapshot and reconstitute identically', () => {
    const engine = new BeerGameEngine('game-4');
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');
    engine.submitOrder('retailer', 4);
    engine.submitOrder('wholesaler', 4);
    engine.submitOrder('distributor', 4);
    engine.submitOrder('factory', 4); // round 2

    const snapshot = engine.toSnapshot();
    const restored = BeerGameEngine.fromSnapshot(snapshot);

    expect(restored.getId()).toBe('game-4');
    expect(restored.getStatus()).toBe('in_progress');
    expect(restored.getCurrentRound()).toBe(2);
    expect(restored.getRole('retailer').getInventory()).toBe(12);
    expect(restored.getRole('retailer').getTotalCost()).toBe(12);
    expect(restored.getRole('retailer').getHistory().length).toBe(1);
  });
});
