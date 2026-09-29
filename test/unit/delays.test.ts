import { describe, it, expect } from 'vitest';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';

describe('BeerGameEngine Delays Verification', () => {
  it('should propagate order upstream with 1-round delay and shipments downstream with 2-round delay', () => {
    const engine = new BeerGameEngine('delays-verification-game');
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    // Rounds 1-4: everyone orders 4
    for (let r = 1; r <= 4; r++) {
      engine.submitOrder('retailer', 4);
      engine.submitOrder('wholesaler', 4);
      engine.submitOrder('distributor', 4);
      engine.submitOrder('factory', 4);
    }

    expect(engine.getCurrentRound()).toBe(5);

    // In Round 5: Retailer orders 8; everyone else orders 4
    engine.submitOrder('retailer', 8);
    engine.submitOrder('wholesaler', 4);
    engine.submitOrder('distributor', 4);
    engine.submitOrder('factory', 4);

    expect(engine.getCurrentRound()).toBe(6);

    // In Round 6:
    // Wholesaler first receives an order of 8 (placed by Retailer in round 5)
    const round6Intermediates = engine.getCurrentRoundIntermediates();
    expect(round6Intermediates?.wholesaler.incomingOrder).toBe(8);

    // Retailer shipment arrived in round 6 should still be 4
    expect(round6Intermediates?.retailer.shipmentArrived).toBe(4);

    // Play Round 6: Retailer orders 8, others order 4
    engine.submitOrder('retailer', 8);
    engine.submitOrder('wholesaler', 4);
    engine.submitOrder('distributor', 4);
    engine.submitOrder('factory', 4);

    expect(engine.getCurrentRound()).toBe(7);

    // In Round 7:
    // Retailer shipment arrived in round 7 is still 4
    const round7Intermediates = engine.getCurrentRoundIntermediates();
    expect(round7Intermediates?.retailer.shipmentArrived).toBe(4);

    // Play Round 7: Retailer orders 8, others order 4
    engine.submitOrder('retailer', 8);
    engine.submitOrder('wholesaler', 4);
    engine.submitOrder('distributor', 4);
    engine.submitOrder('factory', 4);

    expect(engine.getCurrentRound()).toBe(8);

    // In Round 8:
    // Retailer first receives a shipment of 8 (shipped by Wholesaler in round 6, taking 2 rounds to arrive)
    const round8Intermediates = engine.getCurrentRoundIntermediates();
    expect(round8Intermediates?.retailer.shipmentArrived).toBe(8);
  });
});
