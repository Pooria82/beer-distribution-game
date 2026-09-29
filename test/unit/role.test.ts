import { describe, it, expect } from 'vitest';
import { SupplyChainRole } from '../../src/core/SupplyChainRole.js';
import { InvalidOrderError, RoundAlreadySubmittedError } from '../../src/core/errors.js';

describe('SupplyChainRole Entity', () => {
  it('should initialize with standard invariants', () => {
    const role = new SupplyChainRole('retailer');
    expect(role.getInventory()).toBe(12);
    expect(role.getBacklog()).toBe(0);
    expect(role.getShipmentsInTransit()).toEqual([4, 4]);
    expect(role.getLastOrderPlaced()).toBe(4);
    expect(role.getTotalCost()).toBe(0);
  });

  it('should process step 1 shipment arrival and update inventory', () => {
    const role = new SupplyChainRole('wholesaler');
    const arrived = role.receiveShipment();
    expect(arrived).toBe(4);
    expect(role.getInventory()).toBe(16);
    expect(role.getShipmentsInTransit()).toEqual([4]);
  });

  it('should fulfill demand when inventory is sufficient', () => {
    const role = new SupplyChainRole('distributor');
    role.receiveShipment(); // inv = 16
    const { shipped, remainingBacklog } = role.fulfillOrders(4);
    expect(shipped).toBe(4);
    expect(remainingBacklog).toBe(0);
    expect(role.getInventory()).toBe(12);
    expect(role.getBacklog()).toBe(0);
  });

  it('should accumulate backlog when demand exceeds inventory', () => {
    const role = new SupplyChainRole('retailer');
    // inventory = 12
    const { shipped, remainingBacklog } = role.fulfillOrders(18);
    expect(shipped).toBe(12);
    expect(remainingBacklog).toBe(6);
    expect(role.getInventory()).toBe(0);
    expect(role.getBacklog()).toBe(6);
  });

  it('should calculate cost based on 0.5 * inv + 1.0 * backlog', () => {
    const role = new SupplyChainRole('factory');
    // inv = 12, backlog = 0 -> cost = 6
    const cost = role.assessRoundCost();
    expect(cost).toBe(6);
    expect(role.getTotalCost()).toBe(6);
  });

  it('should reject invalid or duplicate orders', () => {
    const role = new SupplyChainRole('retailer');
    expect(() => role.placeOrder(-1)).toThrow(InvalidOrderError);
    expect(() => role.placeOrder(2.5)).toThrow(InvalidOrderError);
    role.placeOrder(4);
    expect(role.getHasSubmittedThisRound()).toBe(true);
    expect(() => role.placeOrder(4)).toThrow(RoundAlreadySubmittedError);
  });
});
