import { describe, it, expect } from 'vitest';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';
import { StateSanitizer } from '../../src/core/StateSanitizer.js';

describe('StateSanitizer (Fog of War)', () => {
  it('should sanitize state for a role, completely stripping opponent metrics', () => {
    const engine = new BeerGameEngine('game-san-1');
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    const state = engine.toSnapshot();
    const playerView = StateSanitizer.sanitize(state, 'retailer');

    expect(playerView.gameId).toBe('game-san-1');
    expect(playerView.myRole).toBe('retailer');
    expect(playerView.myState.inventory).toBe(12);
    expect(playerView.currentIntermediate?.shipmentArrived).toBe(4);
    expect(playerView.currentIntermediate?.incomingOrder).toBe(4);

    // Verify peers
    expect(playerView.peers.wholesaler.role).toBe('wholesaler');
    expect(playerView.peers.wholesaler.isOccupied).toBe(true);
    expect(playerView.peers.wholesaler.hasSubmittedThisRound).toBe(false);

    // Assert that opponent numbers DO NOT exist on peer summaries
    const wholesalerPeer = playerView.peers.wholesaler as unknown as Record<string, unknown>;
    expect(wholesalerPeer['inventory']).toBeUndefined();
    expect(wholesalerPeer['backlog']).toBeUndefined();
    expect(wholesalerPeer['shipmentsInTransit']).toBeUndefined();
    expect(wholesalerPeer['lastOrderPlaced']).toBeUndefined();
    expect(wholesalerPeer['roundCost']).toBeUndefined();
    expect(wholesalerPeer['totalCost']).toBeUndefined();
    expect(wholesalerPeer['history']).toBeUndefined();

    // In-progress: final scores must be undefined
    expect(playerView.finalScores).toBeUndefined();
    expect(playerView.totalChainCost).toBeUndefined();
  });

  it('should reveal final scores and total chain cost only when game is completed', () => {
    const engine = new BeerGameEngine('game-san-2', 1);
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    engine.submitOrder('retailer', 4);
    engine.submitOrder('wholesaler', 4);
    engine.submitOrder('distributor', 4);
    engine.submitOrder('factory', 4); // completed

    const state = engine.toSnapshot();
    expect(state.status).toBe('completed');

    const playerView = StateSanitizer.sanitize(state, 'distributor');
    expect(playerView.finalScores).toBeDefined();
    expect(playerView.finalScores?.retailer).toBe(6);
    expect(playerView.finalScores?.wholesaler).toBe(6);
    expect(playerView.finalScores?.distributor).toBe(6);
    expect(playerView.finalScores?.factory).toBe(6);
    expect(playerView.totalChainCost).toBe(24);
  });
});
