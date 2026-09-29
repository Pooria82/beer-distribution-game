import {
  ALL_ROLES,
  DemandProfile,
  GameState,
  GameStatus,
  RoleState,
  RoleType,
  RoundIntermediate,
  RoundRecord,
} from './types.js';
import { SupplyChainRole } from './SupplyChainRole.js';
import { StandardDemandProfile } from './DemandProfile.js';
import { GameFinishedError, GameNotStartedError } from './errors.js';

export interface AdvanceResult {
  readonly roundAdvanced: boolean;
  readonly gameCompleted: boolean;
}

export class BeerGameEngine {
  readonly id: string;
  private status: GameStatus;
  private currentRound: number;
  readonly totalRounds: number;
  private readonly roles: Record<RoleType, SupplyChainRole>;
  private readonly demandProfile: DemandProfile;
  private currentRoundIntermediates: Record<RoleType, RoundIntermediate> | null;
  private readonly createdAt: number;
  private updatedAt: number;

  constructor(
    id: string,
    totalRounds = 20,
    demandProfile: DemandProfile = new StandardDemandProfile(),
    roles?: Record<RoleType, SupplyChainRole>,
    status: GameStatus = 'waiting',
    currentRound = 0,
    currentRoundIntermediates: Record<RoleType, RoundIntermediate> | null = null,
    createdAt = Date.now(),
    updatedAt = Date.now(),
  ) {
    this.id = id;
    this.totalRounds = totalRounds;
    this.demandProfile = demandProfile;
    this.status = status;
    this.currentRound = currentRound;
    this.currentRoundIntermediates = currentRoundIntermediates;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.roles = roles ?? {
      retailer: new SupplyChainRole('retailer'),
      wholesaler: new SupplyChainRole('wholesaler'),
      distributor: new SupplyChainRole('distributor'),
      factory: new SupplyChainRole('factory'),
    };
  }

  /**
   * Assigns a human player or bot to a role.
   * If all 4 roles become occupied, the game transitions to 'in_progress' and runs round 1 steps 1–4.
   */
  claimRole(role: RoleType): boolean {
    if (this.status !== 'waiting') {
      throw new GameFinishedError('Cannot claim role: game is already in progress or completed');
    }
    this.roles[role].claimRole();
    this.updatedAt = Date.now();

    if (this.isAllOccupied()) {
      this.start();
      return true; // Game started
    }
    return false;
  }

  releaseRole(role: RoleType): void {
    if (this.status !== 'waiting') {
      return; // Cannot release after game start
    }
    this.roles[role].releaseRole();
    this.updatedAt = Date.now();
  }

  /**
   * Starts the game: transitions to round 1 and runs steps 1–4.
   */
  start(): void {
    if (!this.isAllOccupied()) {
      throw new GameNotStartedError('All 4 roles must be claimed before starting the game');
    }
    this.status = 'in_progress';
    this.currentRound = 1;
    this.executeSteps1To4();
    this.updatedAt = Date.now();
  }

  /**
   * Step 5: Player submits their integer order (>= 0).
   * Once all 4 roles submit, round advances and steps 1–4 of the next round are executed.
   */
  submitOrder(role: RoleType, order: number): AdvanceResult {
    if (this.status === 'waiting') {
      throw new GameNotStartedError();
    }
    if (this.status === 'completed') {
      throw new GameFinishedError();
    }

    // Place the order on the role entity (validates bounds and double submission)
    this.roles[role].placeOrder(order);
    this.updatedAt = Date.now();

    if (this.isRoundReadyToAdvance()) {
      return this.finalizeRoundAndAdvance();
    }

    return { roundAdvanced: false, gameCompleted: false };
  }

  /**
   * Executes Steps 1–4 for all 4 roles in lockstep:
   * 1. Shipments arrive (from 2-round transit pipeline)
   * 2. Orders arrive (customer demand for Retailer; downstream order for others)
   * 3. Ship: min(inventory, backlog + incoming) dispatched downstream
   * 4. Costs charged: 0.5 * inventory + 1.0 * backlog
   */
  private executeSteps1To4(): void {
    // 1. Shipments Arrive
    const arrivedShipment: Record<RoleType, number> = {
      retailer: this.roles.retailer.receiveShipment(),
      wholesaler: this.roles.wholesaler.receiveShipment(),
      distributor: this.roles.distributor.receiveShipment(),
      factory: this.roles.factory.receiveShipment(),
    };

    // 2. Orders Arrive
    const incomingOrder: Record<RoleType, number> = {
      retailer: this.demandProfile.getDemand(this.currentRound),
      wholesaler: this.roles.retailer.getLastOrderPlaced(),
      distributor: this.roles.wholesaler.getLastOrderPlaced(),
      factory: this.roles.distributor.getLastOrderPlaced(),
    };

    // 3. Ship (Calculate fulfillment & push shipments to downstream 2-round pipelines)
    const retailerFulfillment = this.roles.retailer.fulfillOrders(incomingOrder.retailer);
    const wholesalerFulfillment = this.roles.wholesaler.fulfillOrders(incomingOrder.wholesaler);
    const distributorFulfillment = this.roles.distributor.fulfillOrders(incomingOrder.distributor);
    const factoryFulfillment = this.roles.factory.fulfillOrders(incomingOrder.factory);

    // Shipping pipelines (goods take 2 rounds to arrive downstream)
    // Retailer ships to end-customer (leaves supply chain system)
    // Wholesaler ships to Retailer
    this.roles.retailer.queueIncomingShipment(wholesalerFulfillment.shipped);
    // Distributor ships to Wholesaler
    this.roles.wholesaler.queueIncomingShipment(distributorFulfillment.shipped);
    // Factory ships to Distributor
    this.roles.distributor.queueIncomingShipment(factoryFulfillment.shipped);
    // Factory's supplier is unlimited: always ships exactly what Factory ordered last round
    this.roles.factory.queueIncomingShipment(this.roles.factory.getLastOrderPlaced());

    // 4. Charge Costs: 0.5 * inventory + 1.0 * backlog
    for (const role of ALL_ROLES) {
      this.roles[role].assessRoundCost();
    }

    // Save intermediate round values for historical records
    this.currentRoundIntermediates = {
      retailer: {
        shipmentArrived: arrivedShipment.retailer,
        incomingOrder: incomingOrder.retailer,
        shipped: retailerFulfillment.shipped,
      },
      wholesaler: {
        shipmentArrived: arrivedShipment.wholesaler,
        incomingOrder: incomingOrder.wholesaler,
        shipped: wholesalerFulfillment.shipped,
      },
      distributor: {
        shipmentArrived: arrivedShipment.distributor,
        incomingOrder: incomingOrder.distributor,
        shipped: distributorFulfillment.shipped,
      },
      factory: {
        shipmentArrived: arrivedShipment.factory,
        incomingOrder: incomingOrder.factory,
        shipped: factoryFulfillment.shipped,
      },
    };
  }

  /**
   * Finalizes the current round's history, archives records, and advances.
   */
  private finalizeRoundAndAdvance(): AdvanceResult {
    if (!this.currentRoundIntermediates) {
      throw new Error('Corrupt state: currentRoundIntermediates is missing');
    }

    // Record immutable history entry for each role
    for (const role of ALL_ROLES) {
      const roleEntity = this.roles[role];
      const inter = this.currentRoundIntermediates[role];

      const record: RoundRecord = {
        round: this.currentRound,
        shipmentArrived: inter.shipmentArrived,
        incomingOrder: inter.incomingOrder,
        shipped: inter.shipped,
        inventory: roleEntity.getInventory(),
        backlog: roleEntity.getBacklog(),
        roundCost: roleEntity.getRoundCost(),
        totalCost: roleEntity.getTotalCost(),
        orderPlaced: roleEntity.getLastOrderPlaced(),
      };

      roleEntity.recordHistory(record);
      roleEntity.resetSubmissionFlag();
    }

    // Check game completion
    if (this.currentRound >= this.totalRounds) {
      this.status = 'completed';
      this.currentRoundIntermediates = null;
      this.updatedAt = Date.now();
      return { roundAdvanced: false, gameCompleted: true };
    }

    // Advance to next round and execute steps 1–4
    this.currentRound += 1;
    this.executeSteps1To4();
    this.updatedAt = Date.now();
    return { roundAdvanced: true, gameCompleted: false };
  }

  isAllOccupied(): boolean {
    return ALL_ROLES.every((role) => this.roles[role].getIsOccupied());
  }

  isRoundReadyToAdvance(): boolean {
    return ALL_ROLES.every((role) => this.roles[role].getHasSubmittedThisRound());
  }

  getId(): string {
    return this.id;
  }

  getStatus(): GameStatus {
    return this.status;
  }

  getCurrentRound(): number {
    return this.currentRound;
  }

  getTotalRounds(): number {
    return this.totalRounds;
  }

  getRole(role: RoleType): SupplyChainRole {
    return this.roles[role];
  }

  getRoles(): Readonly<Record<RoleType, SupplyChainRole>> {
    return this.roles;
  }

  getCurrentRoundIntermediates(): Readonly<Record<RoleType, RoundIntermediate>> | null {
    return this.currentRoundIntermediates;
  }

  getTotalChainCost(): number {
    return ALL_ROLES.reduce((sum, role) => sum + this.roles[role].getTotalCost(), 0);
  }

  getFinalScores(): Record<RoleType, number> {
    return {
      retailer: this.roles.retailer.getTotalCost(),
      wholesaler: this.roles.wholesaler.getTotalCost(),
      distributor: this.roles.distributor.getTotalCost(),
      factory: this.roles.factory.getTotalCost(),
    };
  }

  toSnapshot(): GameState {
    const rolesSnapshot: Record<RoleType, RoleState> = {
      retailer: this.roles.retailer.toSnapshot(),
      wholesaler: this.roles.wholesaler.toSnapshot(),
      distributor: this.roles.distributor.toSnapshot(),
      factory: this.roles.factory.toSnapshot(),
    };

    return {
      id: this.id,
      status: this.status,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      roles: rolesSnapshot,
      currentRoundIntermediates: this.currentRoundIntermediates ?? undefined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromSnapshot(
    snapshot: GameState,
    demandProfile: DemandProfile = new StandardDemandProfile(),
  ): BeerGameEngine {
    const roles: Record<RoleType, SupplyChainRole> = {
      retailer: SupplyChainRole.fromSnapshot(snapshot.roles.retailer),
      wholesaler: SupplyChainRole.fromSnapshot(snapshot.roles.wholesaler),
      distributor: SupplyChainRole.fromSnapshot(snapshot.roles.distributor),
      factory: SupplyChainRole.fromSnapshot(snapshot.roles.factory),
    };

    return new BeerGameEngine(
      snapshot.id,
      snapshot.totalRounds,
      demandProfile,
      roles,
      snapshot.status,
      snapshot.currentRound,
      snapshot.currentRoundIntermediates ? { ...snapshot.currentRoundIntermediates } : null,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }
}
