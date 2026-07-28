import { SCENES, MICKEY_STATES } from '../config/constants.js';
import { typeText, wait } from '../utils/typewriter.js';
import { debugLog } from '../utils/debugLog.js';
import { Confetti } from '../systems/Confetti.js';

/**
 * ConstellationScene — "The Final Constellation"
 * ----------------------------------------------
 * The secret quest that closes the whole journey. Night has fallen, the
 * three chests are gone, and Mickey's compass has pointed at the sky:
 * the player traces a five-pointed constellation in one stroke to light
 * the way home.
 *
 * Deliberately the gentlest interaction in the game. There is no failure
 * message, no score, no timer — a wrong line simply dissolves and the
 * stars go quiet again so it can be retried. The whole point is the
 * calm, so nothing here is allowed to feel like a test.
 *
 * State machine: LEGEND -> WATCH -> DRAW -> LIT -> EXIT.
 * As everywhere else, `_exit()` is the only place allowed to call
 * sceneManager.goTo().
 */
export class ConstellationScene {
  /**
   * The five points of a regular pentagram, in a 0-100 square space.
   * They live in a fixed-aspect container (see .cst-figure), so these
   * plain percentages keep the star's real shape on any screen —
   * against the raw viewport they'd skew wider or taller per device.
   */
  static STARS = [
    { x: 50.0, y: 8.0 },   // 0 — top
    { x: 89.9, y: 37.0 },  // 1 — upper right
    { x: 74.7, y: 84.0 },  // 2 — lower right
    { x: 25.3, y: 84.0 },  // 3 — lower left
    { x: 10.1, y: 37.0 },  // 4 — upper left
  ];

  /**
   * The one-stroke pentagram order: top -> lower right -> upper left ->
   * upper right -> lower left -> back to top. Six entries, five lines,
   * and the last one closes the shape.
   */
  static ORDER = [0, 2, 4, 1, 3, 0];

  /** How close (in real screen pixels) counts as touching a star. */
  static TOLERANCE_PX = 30;

  constructor(sceneEl, sceneManager, mickey, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.mickey = mickey;
    this.audio = audio;

    this.worldEl = sceneEl.querySelector('#cst-world');
    this.starfieldEl = sceneEl.querySelector('#cst-starfield');
    this.starfieldBigEl = sceneEl.querySelector('#cst-starfield-big');
    this.figureEl = sceneEl.querySelector('#cst-figure');
    this.starsEl = sceneEl.querySelector('#cst-stars');
    this.drawnPathEl = sceneEl.querySelector('#cst-lines-drawn');
    this.livePathEl = sceneEl.querySelector('#cst-lines-live');
    this.glowEl = sceneEl.querySelector('#cst-glow');
    this.beamEl = sceneEl.querySelector('#cst-beam');
    this.mickeySpotEl = sceneEl.querySelector('#cst-mickey-spot');
    this.legendEl = sceneEl.querySelector('#cst-legend');
    this.legendTextEl = sceneEl.querySelector('#cst-legend-text');

    this.confetti = new Confetti(sceneEl.querySelector('#confetti-canvas'));

    this._runToken = 0;
    this.state = 'LEGEND';
    this._starEls = [];

    /** Index into ORDER of the next star the player needs to reach. */
    this._nextIndex = 0;
    this._isDrawing = false;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
  }

  /** Blocks input before the sky is actually ready to be drawn on. */
  beforeEnter() {
    this.state = 'LEGEND';
  }

  async enter() {
    try {
      await this._enterInner();
    } catch (err) {
      // Never strand the player on a half-lit sky — the journey should
      // still reach its ending even if this scene breaks.
      console.error('[Constellation] enter() FALLBACK TRIGGERED:', err);
      await this._exit(SCENES.ALBUM);
    }
  }

  /** The ONLY place allowed to call sceneManager.goTo(). */
  async _exit(targetScene, data) {
    if (this.state === 'EXIT') return;
    this.state = 'EXIT';
    await this.sceneManager.goTo(targetScene, data);
  }

  async _enterInner() {
    const token = ++this._runToken;
    this._resetVisualState();

    // Mickey comes along, standing on the island below the sky.
    this.mickeySpotEl.appendChild(this.mickey.el);
    this.mickey.play(MICKEY_STATES.IDLE);

    this._scatterBackgroundStars(30);
    this._renderConstellationStars();

    // The camera rise: the whole world drifts upward, so the sky takes
    // over most of the screen while Mickey stays visible at the bottom.
    await wait(600);
    if (token !== this._runToken) return;
    this.worldEl.classList.add('is-risen');

    this.legendEl.classList.remove('dialog--hidden');
    await typeText(this.legendTextEl, 'Хвиля, гора, пам\'ять... три знаки вказували не на місце. Вони вказували на небо. З\'єднай їх — і шлях додому засвітиться.');
    if (token !== this._runToken) return;
    await wait(2200);
    if (token !== this._runToken) return;
    this.legendEl.classList.add('dialog--hidden');

    this.mickey.play(MICKEY_STATES.TELESCOPE); // looking up at the sky
    await wait(700);
    if (token !== this._runToken) return;

    // The five that matter announce themselves one at a time, so it's
    // obvious which stars are part of this without a word of explanation.
    this.state = 'WATCH';
    await this._twinkleTheFiveInTurn(token);
    if (token !== this._runToken) return;

    this.state = 'DRAW';
    this._armDrawing();
    debugLog('[Constellation] ready for input');
  }

  async exit() {
    this._runToken += 1;
    this._disarmDrawing();
  }

  _resetVisualState() {
    this.state = 'LEGEND';
    this._nextIndex = 0;
    this._isDrawing = false;
    this.worldEl.classList.remove('is-risen', 'is-lowering');
    this.starfieldEl.innerHTML = '';
    this.starfieldBigEl.innerHTML = '';
    this.starsEl.innerHTML = '';
    this.drawnPathEl.setAttribute('d', '');
    this.livePathEl.setAttribute('d', '');
    this.figureEl.classList.remove('is-complete', 'is-dissolving', 'is-alive');
    this.drawnPathEl.classList.remove('is-pulsing');
    this.glowEl.classList.remove('is-visible');
    this.beamEl.classList.remove('is-visible');
    this.legendEl.classList.add('dialog--hidden');
    this.legendTextEl.textContent = '';
  }

  /**
   * The ordinary background stars — all identical, none of them part of
   * the puzzle. They exist so the five that matter have somewhere to
   * hide until they start blinking.
   */
  _scatterBackgroundStars(count) {
    this.starfieldEl.innerHTML = '';
    this.starfieldBigEl.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'cst-bg-star';
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 78}%`;
      el.style.animationDelay = `${Math.random() * 4}s`;
      el.style.animationDuration = `${3 + Math.random() * 3}s`;
      this.starfieldEl.appendChild(el);
    }

    // A sparser layer of larger, brighter stars in front of the rest —
    // depth comes from the difference between the two, not from either
    // one on its own.
    for (let i = 0; i < Math.ceil(count / 5); i++) {
      const el = document.createElement('span');
      el.className = 'cst-bg-star cst-bg-star--big';
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 74}%`;
      el.style.animationDelay = `${Math.random() * 5}s`;
      el.style.animationDuration = `${4 + Math.random() * 4}s`;
      this.starfieldBigEl.appendChild(el);
    }
  }

  /** The five puzzle stars, at their exact pentagram positions. */
  _renderConstellationStars() {
    this.starsEl.innerHTML = '';
    this._starEls = ConstellationScene.STARS.map((star, i) => {
      const el = document.createElement('span');
      el.className = 'cst-star';
      el.style.left = `${star.x}%`;
      el.style.top = `${star.y}%`;
      // Staggered so the five never breathe in unison — in sync they'd
      // read as a deliberate signal, which is exactly what the later
      // one-at-a-time hint blink is supposed to be.
      el.style.animationDelay = `${(i * 0.7).toFixed(2)}s`;
      el.style.animationDuration = `${(3.6 + i * 0.35).toFixed(2)}s`;
      el.dataset.starIndex = String(i);
      this.starsEl.appendChild(el);
      return el;
    });
  }

  /** Each of the five blinks in turn — never all at once. */
  async _twinkleTheFiveInTurn(token) {
    for (const orderIndex of ConstellationScene.ORDER.slice(0, 5)) {
      if (token !== this._runToken) return;
      const el = this._starEls[orderIndex];
      el.classList.add('is-hinting');
      this.audio.crystalTone(392 + orderIndex * 40);
      await wait(520);
      el.classList.remove('is-hinting');
      await wait(140);
    }
  }

  _armDrawing() {
    // `passive: false` on every one of these is what actually makes
    // preventDefault() legal. Without it iOS Safari treats the listener
    // as passive, ignores the call, and pans the whole page while the
    // player is trying to draw — `touch-action: none` alone does NOT
    // stop that on Safari the way it does in other browsers.
    //
    // These also live on the figure rather than window now, because
    // _onPointerDown captures the pointer: with capture, every later
    // move/up is routed to the capturing element, so window listeners
    // would be both redundant and a double-fire risk.
    const opts = { passive: false };
    this.figureEl.addEventListener('pointerdown', this._onPointerDown, opts);
    this.figureEl.addEventListener('pointermove', this._onPointerMove, opts);
    this.figureEl.addEventListener('pointerup', this._onPointerUp, opts);
    this.figureEl.addEventListener('pointercancel', this._onPointerUp, opts);

    // Belt and suspenders for Safari specifically: even with all of the
    // above, a raw touchmove can still scroll the page, so it's
    // swallowed outright while a stroke is in progress.
    this.sceneEl.addEventListener('touchmove', this._onTouchMove, opts);
  }

  /** Stops the page itself from moving under the finger mid-stroke. */
  _onTouchMove(event) {
    if (this._isDrawing && event.cancelable) event.preventDefault();
  }

  _disarmDrawing() {
    this.figureEl.removeEventListener('pointerdown', this._onPointerDown);
    this.figureEl.removeEventListener('pointermove', this._onPointerMove);
    this.figureEl.removeEventListener('pointerup', this._onPointerUp);
    this.figureEl.removeEventListener('pointercancel', this._onPointerUp);
    this.sceneEl.removeEventListener('touchmove', this._onTouchMove);
  }

  /** Converts a real pointer event into this figure's 0-100 space. */
  _toFigureSpace(event) {
    const rect = this.figureEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      // The 30px tolerance is specified in real screen pixels, so it has
      // to be converted per-frame rather than hard-coded in figure units
      // (the figure is a different pixel size on every device).
      tolerance: (ConstellationScene.TOLERANCE_PX / rect.width) * 100,
    };
  }

  _distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /** Which star (if any) this position is close enough to count as. */
  _starNear(point) {
    for (let i = 0; i < ConstellationScene.STARS.length; i++) {
      if (this._distance(point, ConstellationScene.STARS[i]) <= point.tolerance) {
        return i;
      }
    }
    return -1;
  }

  _onPointerDown(event) {
    if (this.state !== 'DRAW' || this._isDrawing) return;
    const point = this._toFigureSpace(event);
    if (!point) return;

    const firstStar = ConstellationScene.ORDER[0];
    if (this._starNear(point) !== firstStar) return; // must start at the first star

    // Only now that we know this is a real stroke on the first star do
    // we claim the gesture — preventing default on every stray tap would
    // needlessly fight the browser elsewhere in the scene.
    if (event.cancelable) event.preventDefault();
    // Capture binds the whole stroke to this element: the finger can
    // wander outside the figure (and it will — the star at the top sits
    // near its edge) without the browser reassigning the pointer or
    // dropping the rest of the gesture.
    try {
      this.figureEl.setPointerCapture(event.pointerId);
    } catch {
      // Older Safari can refuse; the listeners still work without it.
    }

    this._isDrawing = true;
    this._nextIndex = 1;
    this._igniteStar(this._starEls[firstStar]);
    this.audio.crystalTone(523);
    this._redrawDrawnPath();
  }

  _onPointerMove(event) {
    if (!this._isDrawing) return;
    // The single most important line for iOS Safari: without it the
    // page pans under the finger and the stroke is impossible to draw.
    if (event.cancelable) event.preventDefault();
    const point = this._toFigureSpace(event);
    if (!point) return;

    // The live line follows the finger from the last connected star.
    const from = ConstellationScene.STARS[ConstellationScene.ORDER[this._nextIndex - 1]];
    this.livePathEl.setAttribute('d', `M ${from.x} ${from.y} L ${point.x} ${point.y}`);

    const near = this._starNear(point);
    if (near === -1) return;

    const expected = ConstellationScene.ORDER[this._nextIndex];
    if (near === expected) {
      this._connectNext();
    } else if (near !== ConstellationScene.ORDER[this._nextIndex - 1]) {
      // Touched a star that isn't the next one — and isn't just the one
      // we're currently leaving. The line dissolves, quietly.
      this._dissolve();
    }
  }

  _onPointerUp(event) {
    try {
      if (event?.pointerId !== undefined && this.figureEl.hasPointerCapture?.(event.pointerId)) {
        this.figureEl.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Nothing to release, or the browser already did it.
    }
    if (!this._isDrawing) return;
    // Let go before finishing: same gentle dissolve, no scolding.
    if (this.state === 'DRAW') this._dissolve();
  }

  _connectNext() {
    const starIndex = ConstellationScene.ORDER[this._nextIndex];
    this._igniteStar(this._starEls[starIndex]);
    this.audio.crystalTone(523 + this._nextIndex * 60);
    this._nextIndex += 1;
    this._redrawDrawnPath();
    this.livePathEl.setAttribute('d', '');

    if (this._nextIndex >= ConstellationScene.ORDER.length) {
      this._isDrawing = false;
      this._onComplete();
    }
  }

  /**
   * A star catching light: a quick flare ring expands out of it, then it
   * settles into its permanent gold. Deliberately more than flipping a
   * class — this is the single most-repeated moment of the scene, so it
   * gets a real beat each time.
   */
  _igniteStar(el) {
    el.classList.add('is-lit');
    el.classList.remove('is-igniting');
    void el.offsetWidth;
    el.classList.add('is-igniting');
    setTimeout(() => el.classList.remove('is-igniting'), 700);
  }

  /** Rebuilds the permanent line from every star connected so far. */
  _redrawDrawnPath() {
    const points = ConstellationScene.ORDER.slice(0, this._nextIndex)
      .map((i) => ConstellationScene.STARS[i]);
    if (points.length < 2) {
      this.drawnPathEl.setAttribute('d', '');
      return;
    }
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
    this.drawnPathEl.setAttribute('d', d);
  }

  /** A wrong move: everything fades back to white, and it can be retried. */
  _dissolve() {
    this._isDrawing = false;
    this.figureEl.classList.add('is-dissolving');
    this.livePathEl.setAttribute('d', '');
    this.audio.nudge();

    setTimeout(() => {
      this._nextIndex = 0;
      this.drawnPathEl.setAttribute('d', '');
      this._starEls.forEach((el) => el.classList.remove('is-lit'));
      this.figureEl.classList.remove('is-dissolving');
    }, 900);
  }

  /**
   * The constellation is lit. This is the ending, so it is allowed to
   * take its time: a flash, the sky filling with new stars, then a
   * full second of nothing at all — just the sea and Mickey looking up
   * — before the beam finally comes down.
   */
  async _onComplete() {
    if (this.state !== 'DRAW') return;
    this.state = 'LIT';
    this._disarmDrawing();
    const token = this._runToken;
    debugLog('[Constellation] complete');

    try {
      await this._playCompletionSequence(token);
    } catch (err) {
      // This runs from a pointer handler, not from the enter() chain
      // that has its own try/catch — so without this, any failure here
      // (canvas, timing, a missing element) would vanish as an
      // unhandled rejection and the ending would simply never arrive,
      // leaving the player on a lit but frozen sky. Log it and still
      // get them to the ending they earned.
      console.error('[Constellation] completion sequence failed:', err);
      await this._exit(SCENES.ALBUM);
    }
  }

  /** The actual celebration, kept separate so _onComplete can guard it. */
  async _playCompletionSequence(token) {
    this.audio.islandChord();
    this.figureEl.classList.add('is-complete');
    await wait(700);
    if (token !== this._runToken) return;

    // The finished line stops being a line and becomes alive: it settles
    // into a slow breath, and a pulse of light travels the whole shape.
    this.figureEl.classList.add('is-alive');
    this.drawnPathEl.classList.remove('is-pulsing');
    void this.drawnPathEl.getBoundingClientRect();
    this.drawnPathEl.classList.add('is-pulsing');
    await wait(600);
    if (token !== this._runToken) return;

    // The rest of the sky wakes up too.
    this._scatterBackgroundStars(90);
    this.glowEl.classList.add('is-visible');
    this.confetti.burst(70);
    await wait(900);
    if (token !== this._runToken) return;

    // The deliberate pause: nothing moves, nothing is announced.
    await wait(1100);
    if (token !== this._runToken) return;

    this.beamEl.classList.add('is-visible');
    this.mickey.play(MICKEY_STATES.HAPPY); // compass closed, looking back at the player
    await wait(1800);
    if (token !== this._runToken) return;

    // The light disperses and the camera comes back down to Mickey,
    // rather than cutting straight to the next scene.
    this.worldEl.classList.remove('is-risen');
    this.worldEl.classList.add('is-lowering');
    this.beamEl.classList.remove('is-visible');
    this.glowEl.classList.remove('is-visible');
    await wait(2000);
    if (token !== this._runToken) return;

    await this._exit(SCENES.ALBUM);
  }
}
