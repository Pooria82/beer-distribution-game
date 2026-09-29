import { describe, it, expect } from 'vitest';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';
import { StateSanitizer } from '../../src/core/StateSanitizer.js';
import { ALL_ROLES } from '../../src/core/types.js';

describe('Fog of War Security Boundary', () => {
  it('strictly hides all private metrics of other roles from PlayerView during active rounds', () => {
    const engine = new BeerGameEngine('fog-of-war-test');
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    // Simulate 3 rounds with varying orders
    engine.submitOrder('retailer', 6);
    engine.submitOrder('wholesaler', 5);
    engine.submitOrder('distributor', 4);
    engine.submitOrder('factory', 3);

    const snapshot = engine.toSnapshot();

    for (const perspectiveRole of ALL_ROLES) {
      const playerView = StateSanitizer.sanitize(snapshot, perspectiveRole);

      // Verify the player sees their own state
      expect(playerView.myRole).toBe(perspectiveRole);
      expect(playerView.myState.inventory).toBeDefined();
      expect(playerView.myState.backlog).toBeDefined();

      // Verify that for all other roles, only PeerSummary exists
      for (const peerRole of ALL_ROLES) {
        if (peerRole === perspectiveRole) continue;

        const peer = playerView.peers[peerRole];
        expect(peer.role).toBe(peerRole);
        expect(peer.isOccupied).toBe(true);
        expect(typeof peer.hasSubmittedThisRound).toBe('boolean');
        expect(typeof peer.isConnected).toBe('boolean');

        // Cast to raw dictionary to verify no hidden properties leaked
        const rawPeer = peer as unknown as Record<string, unknown>;
        expect(rawPeer['inventory'], `${peerRole} inventory leaked to ${perspectiveRole}`).toBeUndefined();
        expect(rawPeer['backlog'], `${peerRole} backlog leaked to ${perspectiveRole}`).toBeUndefined();
        expect(rawPeer['shipmentsInTransit'], `${peerRole} shipments leaked to ${perspectiveRole}`).toBeUndefined();
        expect(rawPeer['lastOrderPlaced'], `${peerRole} order leaked to ${perspectiveRole}`).toBeUndefined();
        expect(rawPeer['roundCost'], `${peerRole} roundCost leaked to ${perspectiveRole}`).toBeUndefined();
        expect(rawPeer['totalCost'], `${peerRole} totalCost leaked to ${perspectiveRole}`).toBeUndefined();
        expect(rawPeer['history'], `${peerRole} history leaked to ${perspectiveRole}`).toBeUndefined();
      }

      // Final scores must remain hidden while in progress
      expect(playerView.finalScores).toBeUndefined();
      expect(playerView.totalChainCost).toBeUndefined();
    }
  });
});
