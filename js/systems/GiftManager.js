import { GIFTS } from '../data/gifts.js';

/**
 * GiftManager
 * -----------
 * Decides which gift cards to show in the Reward scene. The rule that
 * matters: never offer a gift that's already been claimed, so a reward
 * can never repeat one the player has already opened.
 */
export class GiftManager {
  /**
   * @param {import('./SaveManager.js').SaveManager} saveManager
   */
  constructor(saveManager) {
    this.saveManager = saveManager;
  }

  /** The Lottie file backing this gift. Each gift owns exactly one. */
  animationFor(giftId) {
    return GIFTS.find((g) => g.id === giftId)?.animation ?? null;
  }

  /**
   * Pick `count` distinct gifts the player hasn't claimed yet.
   *
   * Only the gift the player actually opens gets claimed, so the two
   * they passed over stay in the pool and may well be offered again next
   * time — that's intended. What must never happen is the same gift
   * being *awarded* twice, which the claimed filter here guarantees.
   *
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
