/**
 * TiltParallax
 * ------------
 * Turns the phone's own tilt into a small parallax shift across a few of
 * the island's layers — the far sky barely moves, the foreground palms
 * drift a little more, so the scene reads as a place with actual depth
 * rather than a flat painting. Purely a `--tilt-x`/`--tilt-y` custom
 * property on the app root; every layer that wants to react to it does
 * so in CSS with its own multiplier (see .layer--* rules), this class
 * itself has no idea which layers exist.
 *
 * iOS requires an explicit permission prompt for device orientation, and
 * that prompt can only be triggered from a real user gesture — so
 * start() is called from the same tap that unlocks audio in
 * IntroSequence, not on page load. If the person declines, or the
 * browser doesn't support it at all, the island just doesn't tilt —
 * nothing else depends on this ever succeeding.
 */
export class TiltParallax {
  /** @param {HTMLElement} rootEl - the element the --tilt-x/--tilt-y properties are set on */
  constructor(rootEl) {
    this.rootEl = rootEl;
    this._handleOrientation = this._handleOrientation.bind(this);
  }

  async start() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') return;
      }
      window.addEventListener('deviceorientation', this._handleOrientation);
    } catch (err) {
      // Permission denied, unsupported browser, desktop with no sensor —
      // any of these just mean no parallax. Not an error worth surfacing.
    }
  }

  stop() {
    window.removeEventListener('deviceorientation', this._handleOrientation);
  }

  _handleOrientation(event) {
    if (event.beta === null || event.gamma === null) return;
    // gamma: left-right tilt (-90..90). beta: front-back tilt (-180..180);
    // ~45deg is a natural angle for holding a phone, so that's treated as
    // "centered" rather than 0deg (holding a phone flat isn't natural).
    const x = Math.max(-1, Math.min(1, event.gamma / 22));
    const y = Math.max(-1, Math.min(1, (event.beta - 45) / 22));
    this.rootEl.style.setProperty('--tilt-x', x.toFixed(3));
    this.rootEl.style.setProperty('--tilt-y', y.toFixed(3));
  }
}
