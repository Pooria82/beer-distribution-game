import { RoleType, RoleState, RoundRecord } from './types.js';
import { InvalidOrderError, RoleAlreadyTakenError, RoundAlreadySubmittedError } from './errors.js';

export class SupplyChainRole {
  readonly role: RoleType;
  private inventory: number;
  private backlog: number;
  private shipmentsInTransit: number[];
  private lastOrderPlaced: number;
  private roundCost: number;
  private totalCost: number;
  private history: RoundRecord[];
  private isOccupied: boolean;
  private hasSubmittedThisRound: boolean;

  constructor(
    role: RoleType,
    initialInventory = 12,
    initialBacklog = 0,
    initialInTransit: readonly number[] = [4, 4],
    initialLastOrder = 4,
    initialRoundCost = 0,
    initialTotalCost = 0,
    history: readonly RoundRecord[] = [],
    isOccupied = false,
    hasSubmittedThisRound = false,
  ) {
    this.role = role;
    this.inventory = initialInventory;
    this.backlog = initialBacklog;
    this.shipmentsInTransit = [...initialInTransit];
    this.lastOrderPlaced = initialLastOrder;
    this.roundCost = initialRoundCost;
    this.totalCost = initialTotalCost;
    this.history = [...history];
    this.isOccupied = isOccupied;
    this.hasSubmittedThisRound = hasSubmittedThisRound;
  }

  /**
   * Step 1: Arriving shipment is added to inventory.
   * Shipments take 2 rounds to arrive, represented as a FIFO queue.
   */
  receiveShipment(): number {
    const arrived = this.shipmentsInTransit.shift() ?? 0;
    this.inventory += arrived;
    return arrived;
  }

  /**
   * Step 3: Fulfill demand (backlog + incoming order) from current inventory.
   * Unfulfilled orders accumulate in the backlog.
   */
  fulfillOrders(incomingOrder: number): { shipped: number; remainingBacklog: number } {
    const totalDemand = this.backlog + incomingOrder;
    const shipped = Math.min(this.inventory, totalDemand);
    this.inventory -= shipped;
    this.backlog = totalDemand - shipped;
    return { shipped, remainingBacklog: this.backlog };
  }

  /**
   * Pushes a dispatched shipment into this role's 2-round transit pipeline.
   */
  queueIncomingShipment(amount: number): void {
    this.shipmentsInTransit.push(amount);
  }

  /**
   * Step 4: Charge costs: 0.5 per inventory unit, 1.0 per backlog unit.
   */
  assessRoundCost(): number {
    this.roundCost = 0.5 * this.inventory + 1.0 * this.backlog;
    this.totalCost += this.roundCost;
    return this.roundCost;
  }

  /**
   * Step 5: Player submits their integer order (>= 0).
   */
  placeOrder(amount: number): void {
    if (!Number.isInteger(amount) || amount < 0 || amount > 10000) {
      throw new InvalidOrderError(`Order must be an integer between 0 and 10,000 units, received: ${amount}`);
    }
    if (this.hasSubmittedThisRound) {
      throw new RoundAlreadySubmittedError(`Role ${this.role} has already placed an order for this round`);
    }
    this.lastOrderPlaced = amount;
    this.hasSubmittedThisRound = true;
  }

  recordHistory(record: RoundRecord): void {
    this.history.push(record);
  }

  resetSubmissionFlag(): void {
    this.hasSubmittedThisRound = false;
  }

  claimRole(): void {
    if (this.isOccupied) {
      throw new RoleAlreadyTakenError(this.role);
    }
    this.isOccupied = true;
  }

  releaseRole(): void {
    this.isOccupied = false;
  }

  getInventory(): number {
    return this.inventory;
  }

  getBacklog(): number {
    return this.backlog;
  }

  getLastOrderPlaced(): number {
    return this.lastOrderPlaced;
  }

  getRoundCost(): number {
    return this.roundCost;
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  getShipmentsInTransit(): readonly number[] {
    return [...this.shipmentsInTransit];
  }

  getIsOccupied(): boolean {
    return this.isOccupied;
  }

  getHasSubmittedThisRound(): boolean {
    return this.hasSubmittedThisRound;
  }

  getHistory(): readonly RoundRecord[] {
    return [...this.history];
  }

  toSnapshot(): RoleState {
    return {
      role: this.role,
      inventory: this.inventory,
      backlog: this.backlog,
      shipmentsInTransit: [...this.shipmentsInTransit],
      lastOrderPlaced: this.lastOrderPlaced,
      roundCost: this.roundCost,
      totalCost: this.totalCost,
      history: [...this.history],
      isOccupied: this.isOccupied,
      hasSubmittedThisRound: this.hasSubmittedThisRound,
    };
  }

  static fromSnapshot(state: RoleState): SupplyChainRole {
    return new SupplyChainRole(
      state.role,
      state.inventory,
      state.backlog,
      state.shipmentsInTransit,
      state.lastOrderPlaced,
      state.roundCost,
      state.totalCost,
      state.history,
      state.isOccupied,
      state.hasSubmittedThisRound,
    );
  }
}
