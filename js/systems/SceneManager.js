/**
 * SceneManager
 * ------------
 * The single place that decides which scene is on screen.
 * Scenes never switch themselves — they ask the manager to do it,
 * so there's only ever one source of truth for "where are we right now".
 *
 * Each registered scene may implement any of: enter(), exit().
 * Both are optional and both may be async.
 *
 * IMPORTANT lesson learned: this was briefly rewritten as a strict promise
 * queue (every goTo() chained onto the last one). That looked safer on
 * paper, but it broke the single most common call pattern in this game —
 * every adventure calls goTo(REWARD) from *inside* its own still-running
 * enter(). Queued, that call had to wait for the current transition to
 * finish, which could only happen once that same nested call resolved —
 * a genuine deadlock (A waits on B, B waits on A), not just a slow path.
 * It could look like it "worked" for one adventure and hung on another
 * depending on timing, which is exactly the confusing symptom that showed
 * up in testing.
 *
 * The actual protection against overlapping/duplicate transitions belongs
 * at the scene level, not here — each adventure already guards its own
 * back button and win-sequence with an _isFinishing flag, and the island
 * guards box taps with _isTransitioning. This class just needs a same-
 * scene no-op guard and clear logging; it does not need to force every
 * call through a single global queue.
 */
export class SceneManager {
  constructor() {
    /** @type {Map<string, {el: HTMLElement, instance: object}>} */
    this.scenes = new Map();
    this.currentSceneName = null;

    /** @type {Array<(name: string, data: object|undefined) => void>}
     * Fired synchronously right after currentSceneName flips to the new
     * scene — i.e. as early as possible, before that scene's own (possibly
     * slow) enter() runs. NavigationGuard uses this to arm/disarm the
     * back-button trap the instant we're "in" lagoon/mountain/bazaar/reward,
     * not just once their intro animations finish. */
    this._changeListeners = [];
  }

  /** Register a callback invoked on every scene switch. */
  onChange(fn) {
    this._changeListeners.push(fn);
  }

  /**
   * Register a scene so the manager can show/hide it later.
   * @param {string} name
   * @param {HTMLElement} el - the .scene element in the DOM
   * @param {object} instance - object with optional enter()/exit() methods
   */
  register(name, el, instance = {}) {
    this.scenes.set(name, { el, instance });
  }

  /**
   * Switch to a scene by name. Runs exit() on the old scene, then enter()
   * on the new one. Safe to call from within another scene's own enter()
   * chain (every adventure's win-sequence does exactly this) — it is NOT
   * safe against a *second, independent* caller firing at the same time,
   * which is why each scene guards its own triggers (buttons, taps).
   * @param {string} name
   * @param {object} [data] - optional payload passed to the next scene's enter()
   */
  async goTo(name, data) {
    if (name === this.currentSceneName) {
      // Already here — re-running exit()/enter() on the same scene would
      // just restart it pointlessly.
      return;
    }

    const next = this.scenes.get(name);
    if (!next) {
      console.warn(`SceneManager: no scene registered as "${name}"`);
      return;
    }

    const from = this.currentSceneName ?? '(none)';
    console.log(`[SceneManager] ${from} -> ${name}`, data ?? '');

    const current = this.currentSceneName
      ? this.scenes.get(this.currentSceneName)
      : null;

    if (current) {
      if (typeof current.instance.exit === 'function') {
        await current.instance.exit();
      }
      current.el.classList.remove('is-active');
    }

    next.el.classList.add('is-active');
    this.currentSceneName = name;

    for (const listener of this._changeListeners) {
      try {
        listener(name, data);
      } catch (err) {
        console.error('[SceneManager] onChange listener threw:', err);
      }
    }

    if (typeof next.instance.enter === 'function') {
      await next.instance.enter(data);
    }
  }

  get currentScene() {
    return this.currentSceneName;
  }
}
