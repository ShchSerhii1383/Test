/**
 * StampAnimation
 * --------------
 * The big round "CORRECT" stamp that drops onto the page with a little
 * impact after a right answer. Owns one DOM element and one job: play.
 */
export class StampAnimation {
  /** @param {HTMLElement} el - the stamp element already in the DOM, hidden by default */
  constructor(el) {
    this.el = el;
  }

  /** Plays the drop-and-land animation. Resolves once it's fully landed. */
  play(text = 'CORRECT') {
    this.el.textContent = text;
    this.el.classList.remove('is-visible');
    void this.el.offsetWidth; // restart the animation if played twice
    this.el.classList.add('is-visible');
    return new Promise((resolve) => setTimeout(resolve, 700));
  }

  reset() {
    this.el.classList.remove('is-visible');
  }
}
