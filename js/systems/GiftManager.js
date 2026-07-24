import { GIFTS } from '../data/gifts.js';

/**
 * GiftManager
 * -----------
 * Decides which gift cards to show in the Reward scene. Rule: never show
 * a gift that's already been claimed, so every reward feels new.
 */
export class GiftManager {
  /**
   * @param {import('./SaveManager.js').SaveManager} saveManager
   */
  constructor(saveManager) {
    this.saveManager = saveManager;
  }

  /**
   * Pick `count` distinct gifts the player hasn't claimed yet.
   * Falls back to allowing repeats only if the pool is exhausted,
   * so the game never breaks even if every gift has been seen.
   * @param {number} count
   */
  pickGifts(count = 3) {
    const claimed = this.saveManager.claimedGifts;
    let pool = GIFTS.filter((g) => !claimed.includes(g.id));

    if (pool.length < count) {
      pool = GIFTS; // exhausted the fresh pool — allow repeats rather than crash
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  claim(giftId) {
    this.saveManager.addClaimedGift(giftId);
  }
}
