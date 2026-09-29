import { DemandProfile } from './types.js';

/**
 * Standard customer demand curve for the Beer Game:
 * Rounds 1–4: 4 units per round
 * Rounds 5–20: 8 units per round
 */
export class StandardDemandProfile implements DemandProfile {
  getDemand(round: number): number {
    return round >= 5 ? 8 : 4;
  }
}
