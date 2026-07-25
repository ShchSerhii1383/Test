/**
 * NavigationGuard
 * ---------------
 * Every adventure scene (Lagoon, Mountain, Bazaar) and Reward already
 * refuse to expose any in-game "back to island" button on purpose — see
 * the comments at the top of each of those classes. But a browser or a
 * mobile OS has its own back gesture (Android back button, iOS edge-swipe,
 * a trackpad two-finger swipe) that none of that code can see or stop.
 * Left alone, that's a real escape hatch: someone could back out mid-round
 * and never see the win sequence, the reward chest, or the three cards.
 *
 * The fix is the standard SPA trick: while we're in a scene the player
 * must not be able to leave early, keep one extra dummy entry sitting on
 * top of the browser's history stack. A back gesture just pops that dummy
 * entry (popstate fires, nothing on screen changes since we never
 * navigated anywhere) and we immediately push a fresh one back on top —
 * so the trap re-arms itself and back navigation is neutralized for as
 * long as we're inside a guarded scene. The moment SceneManager moves to
 * an unguarded scene (the island, the album, the finale), the trap is
 * simply left alone and a real back press works normally again.
 */
export class NavigationGuard {
  /**
   * @param {import('./SceneManager.js').SceneManager} sceneManager
   * @param {string[]} guardedScenes - scene names that must not be
   *   reachable via back navigation once entered
   */
  constructor(sceneManager, guardedScenes) {
    this.sceneManager = sceneManager;
    this.guardedScenes = new Set(guardedScenes);
    this._armed = false;

    sceneManager.onChange((name) => this._onSceneChange(name));
    window.addEventListener('popstate', () => this._onPopState());
  }

  _onSceneChange(name) {
    if (this.guardedScenes.has(name)) {
      this._arm();
    } else {
      // Leaving to an unguarded scene (island/album/finale): let the trap
      // lapse naturally rather than actively removing it — there is no
      // clean way to "pop our own dummy entry" without also consuming a
      // real history entry, and simply not re-arming is enough: the next
      // stray popstate (if any) will find nothing here to swallow.
      this._armed = false;
    }
  }

  _arm() {
    if (this._armed) return;
    this._armed = true;
    history.pushState({ islandGuard: true }, '', location.href);
  }

  _onPopState() {
    if (!this._armed) return;
    if (!this.guardedScenes.has(this.sceneManager.currentScene)) return;

    // Swallow the back navigation by immediately restoring the trap entry.
    // Visually nothing happens — we never left the guarded scene.
    console.log('[NavigationGuard] back navigation blocked in', this.sceneManager.currentScene);
    history.pushState({ islandGuard: true }, '', location.href);
  }
}
