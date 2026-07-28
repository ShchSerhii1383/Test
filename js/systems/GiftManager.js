import { GIFTS, GIFT_ANIMATIONS } from '../data/gifts.js';

/**
 * GiftManager
 * -----------
 * Decides which gift cards to show in the Reward scene. Two rules: never
 * show a gift that's already been claimed, so every reward feels new; and
 * never let a gift arrive with the same animation every time.
 */
export class GiftManager {
  /**
   * @param {import('./SaveManager.js').SaveManager} saveManager
   */
  constructor(saveManager) {
    this.saveManager = saveManager;

    /**
     * The animation dealt to each gift, decided ONCE per page load and
     * then held steady. Shuffling here rather than at pick-time matters:
     * a player who sees the same gift twice in one session should see
     * the same animation both times — it's that gift's face for this
     * visit — while a reload deals a fresh hand.
     */
    this._animationByGiftId = this._dealAnimations();
  }

  _dealAnimations() {
    const shuffled = [...GIFT_ANIMATIONS].sort(() => Math.random() - 0.5);
    const map = {};
    GIFTS.forEach((gift, i) => {
      // An explicit `animation` on the gift always wins, so a specific
      // pairing can be pinned later without touching this logic.
      map[gift.id] = gift.animation ?? shuffled[i % shuffled.length];
    });
    return map;
  }

  /** The animation filename (without extension) dealt to this gift. */
  animationFor(giftId) {
    return this._animationByGiftId[giftId] ?? null;
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
