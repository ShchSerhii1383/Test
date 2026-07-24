/**
 * Camera.js
 * ---------
 * A small, reusable camera for the island — pan/zoom via CSS transform, on
 * whichever element the game hands it. Not a new global system: it's the
 * pan/zoom logic that used to live only inside IntroSequence, pulled out so
 * IslandScene can reuse it for the same warm zoom-toward-a-box effect
 * outside the intro too.
 *
 * The element must define --cam-x/--cam-y/--cam-scale and read them in its
 * transform (see .scene--island in scenes.css) — this class only sets those
 * three custom properties, it doesn't touch layout.
 */
export class Camera {
  /** @param {HTMLElement} el */
  constructor(el) {
    this.el = el;
  }

  /**
   * Move/zoom the camera. Whatever isn't passed keeps its current value,
   * so callers can zoom without also having to restate the pan.
   * @param {{x?: string, y?: string, scale?: number}} params
   */
  focus({ x, y, scale } = {}) {
    if (x !== undefined) this.el.style.setProperty('--cam-x', x);
    if (y !== undefined) this.el.style.setProperty('--cam-y', y);
    if (scale !== undefined) this.el.style.setProperty('--cam-scale', scale);
  }

  /** Back to a plain, centered view — the resting state between moments. */
  reset() {
    this.focus({ x: '0%', y: '0%', scale: 1 });
  }
}
