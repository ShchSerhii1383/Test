import { CONFIG } from '../config/config.js';

/**
 * debugLog
 * --------
 * A drop-in replacement for the console.log calls scattered through the
 * scenes, tracing each step of a scene's flow (countdown, chest, cards,
 * transitions...). Those were essential while chasing the intermittent
 * Reward-skip/Mountain-exit bugs, but they're noise for a normal
 * playthrough — this only prints when CONFIG.DEBUG is true.
 *
 * console.error calls are left as plain console.error everywhere — those
 * only fire on a genuine caught exception, which is worth seeing
 * regardless of the debug flag.
 */
export function debugLog(...args) {
  if (CONFIG.DEBUG) {
    console.log(...args);
  }
}
