import { describe, it, expect } from 'vitest';
import { BeerGameEngine } from '../../src/core/BeerGameEngine.js';
import {
  GameFinishedError,
  GameNotStartedError,
  InvalidOrderError,
  RoleAlreadyTakenError,
  RoundAlreadySubmittedError,
} from '../../src/core/errors.js';

describe('Domain Rules Validation & Invariants', () => {
  it('should reject invalid numbers as orders', () => {
    const engine = new BeerGameEngine('validation-test-game');
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    expect(() => engine.submitOrder('retailer', -1)).toThrow(InvalidOrderError);
    expect(() => engine.submitOrder('retailer', 4.5)).toThrow(InvalidOrderError);
    expect(() => engine.submitOrder('retailer', NaN)).toThrow(InvalidOrderError);
    expect(() => engine.submitOrder('retailer', Infinity)).toThrow(InvalidOrderError);
  });

  it('should reject double order submissions in the same round', () => {
    const engine = new BeerGameEngine('double-submission-test');
    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    engine.submitOrder('retailer', 4);
    expect(() => engine.submitOrder('retailer', 5)).toThrow(RoundAlreadySubmittedError);
  });

  it('should prevent orders when waiting or completed', () => {
    const engine = new BeerGameEngine('state-guards-test', 1);
    expect(() => engine.submitOrder('retailer', 4)).toThrow(GameNotStartedError);

    engine.claimRole('retailer');
    engine.claimRole('wholesaler');
    engine.claimRole('distributor');
    engine.claimRole('factory');

    // Complete the 1-round game
    engine.submitOrder('retailer', 4);
    engine.submitOrder('wholesaler', 4);
    engine.submitOrder('distributor', 4);
    engine.submitOrder('factory', 4);

    expect(engine.getStatus()).toBe('completed');
    expect(() => engine.submitOrder('retailer', 4)).toThrow(GameFinishedError);
  });

  it('should prevent claiming an already claimed role', () => {
    const engine = new BeerGameEngine('duplicate-role-test');
    engine.claimRole('distributor');
    expect(() => engine.claimRole('distributor')).toThrow(RoleAlreadyTakenError);
  });
});
