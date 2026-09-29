import {
  ALL_ROLES,
  GameState,
  PeerSummary,
  PlayerView,
  RoleType,
} from './types.js';

export class StateSanitizer {
  /**
   * Transforms authoritative GameState into an individualized PlayerView for a specific role.
   * Strictly enforces the Fog of War rule: opponent inventories, backlogs, costs, and orders
   * are completely stripped until the game completes.
   */
  static sanitize(
    state: GameState,
    role: RoleType,
    connectedRoles: ReadonlySet<RoleType> = new Set(ALL_ROLES),
  ): PlayerView {
    const myState = state.roles[role];
    const myIntermediate = state.currentRoundIntermediates?.[role];

    const peers: Record<RoleType, PeerSummary> = {
      retailer: {
        role: 'retailer',
        isOccupied: state.roles.retailer.isOccupied,
        hasSubmittedThisRound: state.roles.retailer.hasSubmittedThisRound,
        isConnected: connectedRoles.has('retailer'),
      },
      wholesaler: {
        role: 'wholesaler',
        isOccupied: state.roles.wholesaler.isOccupied,
        hasSubmittedThisRound: state.roles.wholesaler.hasSubmittedThisRound,
        isConnected: connectedRoles.has('wholesaler'),
      },
      distributor: {
        role: 'distributor',
        isOccupied: state.roles.distributor.isOccupied,
        hasSubmittedThisRound: state.roles.distributor.hasSubmittedThisRound,
        isConnected: connectedRoles.has('distributor'),
      },
      factory: {
        role: 'factory',
        isOccupied: state.roles.factory.isOccupied,
        hasSubmittedThisRound: state.roles.factory.hasSubmittedThisRound,
        isConnected: connectedRoles.has('factory'),
      },
    };

    // Only reveal final full chain costs after round 20 completes
    let finalScores: Record<RoleType, number> | undefined = undefined;
    let totalChainCost: number | undefined = undefined;

    if (state.status === 'completed') {
      finalScores = {
        retailer: state.roles.retailer.totalCost,
        wholesaler: state.roles.wholesaler.totalCost,
        distributor: state.roles.distributor.totalCost,
        factory: state.roles.factory.totalCost,
      };
      totalChainCost =
        finalScores.retailer +
        finalScores.wholesaler +
        finalScores.distributor +
        finalScores.factory;
    }

    return {
      gameId: state.id,
      status: state.status,
      currentRound: state.currentRound,
      totalRounds: state.totalRounds,
      myRole: role,
      myState,
      currentIntermediate: myIntermediate,
      peers,
      finalScores,
      totalChainCost,
    };
  }
}
