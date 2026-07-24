import { MICKEY_STATES } from '../config/constants.js';
import { typeText, wait } from '../utils/typewriter.js';

/**
 * Mickey
 * ------
 * Controls the main character: his visual state (idle, wave, happy, ...)
 * and his short spoken lines. Mickey never carries game logic himself —
 * scenes tell him what to do, he just does it.
 */
export class Mickey {
  /**
   * @param {HTMLElement} rootEl - the #mickey element
   * @param {HTMLElement} dialogEl - the speech bubble container
   * @param {HTMLElement} dialogTextEl - the <p> inside the bubble
   */
  constructor(rootEl, dialogEl, dialogTextEl) {
    this.el = rootEl;
    this.dialogEl = dialogEl;
    this.dialogTextEl = dialogTextEl;
    this.dialogTimeout = null;

    this.play(MICKEY_STATES.IDLE);
  }

  /** Switch Mickey's visual state. Removes any previous state class first. */
  play(state) {
    Object.values(MICKEY_STATES).forEach((s) => {
      this.el.classList.remove(`mickey--${s}`);
    });
    this.el.classList.add(`mickey--${state}`);
  }

  /**
   * Show a short line in Mickey's speech bubble.
   * Lines should stay brief — this isn't a dialogue system, it's a wink.
   * @param {string} text
   * @param {number} durationMs - how long the bubble stays visible
   */
  say(text, durationMs = 2600) {
    clearTimeout(this.dialogTimeout);
    this.dialogTextEl.textContent = text;
    this.dialogEl.classList.remove('dialog--hidden');

    this.dialogTimeout = setTimeout(() => {
      this.dialogEl.classList.add('dialog--hidden');
    }, durationMs);
  }

  /**
   * Same as say(), but the line is typed out character by character and the
   * bubble stays until told otherwise. Used in the opening sequence, where
   * watching him "talk" matters more than reading fast.
   * @param {string} text
   * @param {number} holdMs - how long to keep the finished line on screen
   */
  async sayTyped(text, holdMs = 900) {
    clearTimeout(this.dialogTimeout);
    this.dialogEl.classList.remove('dialog--hidden');
    await typeText(this.dialogTextEl, text);
    await wait(holdMs);
  }

  /** Hide the speech bubble right away. */
  hush() {
    clearTimeout(this.dialogTimeout);
    this.dialogEl.classList.add('dialog--hidden');
  }

  show() {
    this.el.style.display = '';
  }

  hide() {
    this.el.style.display = 'none';
  }
}
