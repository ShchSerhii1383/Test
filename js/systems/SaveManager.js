import { CONFIG } from '../config/config.js';

/**
 * SaveManager
 * -----------
 * The only place that reads/writes persisted state. Everything else in
 * the app should ask SaveManager instead of touching localStorage directly,
 * so there's never a second copy of "the truth" lying around.
 *
 * Shape of the saved state:
 * {
 *   teamName: string,
 *   completed: string[],      // adventure ids finished, e.g. ['lagoon']
 *   claimedGifts: string[],   // gift ids already given out (no repeats)
 *   secretBonus: boolean
 * }
 */

const STORAGE_KEY = 'secret-island-save';

const DEFAULT_STATE = {
  teamName: '',
  completed: [],
  claimedGifts: [],
  secretBonus: false,
  boxesSunk: false,
};

export class SaveManager {
  constructor() {
    if (CONFIG.RESET_PROGRESS_ON_LOAD) {
      // Wipe anything left from a previous visit before reading, so every
      // page load starts the adventure over from the beginning.
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn('SaveManager: could not clear previous save.', err);
      }
    }

    this.state = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    } catch (err) {
      console.warn('SaveManager: could not read save, starting fresh.', err);
      return { ...DEFAULT_STATE };
    }
  }

  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.warn('SaveManager: could not persist save.', err);
    }
  }

  setTeamName(name) {
    this.state.teamName = name;
    this._persist();
  }

  markCompleted(adventureId) {
    if (!this.state.completed.includes(adventureId)) {
      this.state.completed.push(adventureId);
      this._persist();
    }
  }

  isCompleted(adventureId) {
    return this.state.completed.includes(adventureId);
  }

  addClaimedGift(giftId) {
    if (!this.state.claimedGifts.includes(giftId)) {
      this.state.claimedGifts.push(giftId);
      this._persist();
    }
  }

  get claimedGifts() {
    return this.state.claimedGifts;
  }

  get completedCount() {
    return this.state.completed.length;
  }

  get hasSecretBonus() {
    return this.state.secretBonus;
  }

  /** Whether the boxes have already sunk back into the sand for the
   *  night stage — persisted, not just an in-memory flag, so reloading
   *  the page after reaching night doesn't replay that animation. */
  get boxesSunk() {
    return this.state.boxesSunk;
  }

  setBoxesSunk(value) {
    this.state.boxesSunk = value;
    this._persist();
  }

  /** True once every adventure in the given list has been completed. */
  hasCompletedAll(adventureIds) {
    return adventureIds.every((id) => this.isCompleted(id));
  }

  setSecretBonus(value) {
    this.state.secretBonus = value;
    this._persist();
  }
}
