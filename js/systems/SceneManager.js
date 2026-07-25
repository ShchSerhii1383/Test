/**
 * SceneManager
 * ------------
 * The single place that decides which scene is on screen.
 * Scenes never switch themselves — they ask the manager to do it,
 * so there's only ever one source of truth for "where are we right now".
 *
 * Each registered scene may implement any of: enter(), exit().
 * Both are optional and both may be async.
 */
export class SceneManager {
  constructor() {
    /** @type {Map<string, {el: HTMLElement, instance: object}>} */
    this.scenes = new Map();
    this.currentSceneName = null;

    // Bumped on every goTo() call. If a second goTo() fires while the
    // first is still mid-transition (e.g. a double-tap that survived
    // whatever guard the calling scene had), the first call notices its
    // token is stale after its next await and quietly stops — instead of
    // its exit()/enter() interleaving with the second call's and leaving
    // currentSceneName pointing at the wrong thing.
    this._runToken = 0;
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
   * Switch to a scene by name. Runs exit() on the old scene,
   * then enter() on the new one, after the fade-out finishes.
   * @param {string} name
   * @param {object} [data] - optional payload passed to the next scene's enter()
   */
  async goTo(name, data) {
    const next = this.scenes.get(name);
    if (!next) {
      console.warn(`SceneManager: no scene registered as "${name}"`);
      return;
    }

    const token = ++this._runToken;
    const current = this.currentSceneName
      ? this.scenes.get(this.currentSceneName)
      : null;

    if (current) {
      if (typeof current.instance.exit === 'function') {
        await current.instance.exit();
      }
      if (token !== this._runToken) return; // a newer goTo() took over while we were exiting
      current.el.classList.remove('is-active');
    }

    if (token !== this._runToken) return;
    next.el.classList.add('is-active');
    this.currentSceneName = name;

    if (typeof next.instance.enter === 'function') {
      await next.instance.enter(data);
    }
  }

  get currentScene() {
    return this.currentSceneName;
  }
}
