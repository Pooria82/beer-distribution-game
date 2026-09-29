export type RoleType = 'retailer' | 'wholesaler' | 'distributor' | 'factory';

export const ALL_ROLES: readonly RoleType[] = [
  'retailer',
  'wholesaler',
  'distributor',
  'factory',
] as const;

export type GameStatus = 'waiting' | 'in_progress' | 'completed';

export interface RoundRecord {
  readonly round: number;
  readonly shipmentArrived: number;
  readonly incomingOrder: number;
  readonly shipped: number;
  readonly inventory: number;
  readonly backlog: number;
  readonly roundCost: number;
  readonly totalCost: number;
  readonly orderPlaced: number;
}

export interface RoleState {
  readonly role: RoleType;
  readonly inventory: number;
  readonly backlog: number;
  readonly shipmentsInTransit: readonly number[];
  readonly lastOrderPlaced: number;
  readonly roundCost: number;
  readonly totalCost: number;
  readonly history: readonly RoundRecord[];
  readonly isOccupied: boolean;
  readonly hasSubmittedThisRound: boolean;
}

export interface RoundIntermediate {
  readonly shipmentArrived: number;
  readonly incomingOrder: number;
  readonly shipped: number;
}

export interface GameState {
  readonly id: string;
  readonly status: GameStatus;
  readonly currentRound: number;
  readonly totalRounds: number;
  readonly roles: Readonly<Record<RoleType, RoleState>>;
  readonly currentRoundIntermediates?: Readonly<Record<RoleType, RoundIntermediate>> | undefined;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface PeerSummary {
  readonly role: RoleType;
  readonly isOccupied: boolean;
  readonly hasSubmittedThisRound: boolean;
  readonly isConnected: boolean;
}

export interface PlayerView {
  readonly gameId: string;
  readonly status: GameStatus;
  readonly currentRound: number;
  readonly totalRounds: number;
  readonly myRole: RoleType;
  readonly myState: RoleState;
  readonly peers: Readonly<Record<RoleType, PeerSummary>>;
  readonly finalScores?: Readonly<Record<RoleType, number>> | undefined;
  readonly totalChainCost?: number | undefined;
}

export interface DemandProfile {
  getDemand(round: number): number;
}
