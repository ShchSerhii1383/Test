/**
 * Box
 * ---
 * A single adventure box on the island (Lagoon, Mountain, Bazaar).
 * Only responsible for its own visual state — deciding *when* a box
 * should unlock belongs to whatever manages game progress, not here.
 */
export class Box {
  /**
   * @param {HTMLElement} el - the .box button element
   */
  constructor(el) {
    this.el = el;
    this.adventureId = el.dataset.adventure;
  }

  get isLocked() {
    return this.el.classList.contains('box--locked');
  }

  enable() {
    this.el.classList.remove('box--locked');
    this.el.classList.add('box--available');
    this.el.disabled = false;
  }

  disable() {
    this.el.classList.add('box--locked');
    this.el.classList.remove('box--available');
    this.el.disabled = true;
  }

  markCompleted() {
    this.el.classList.remove('box--available');
    this.el.classList.add('box--completed');
    this.el.disabled = true;
  }

  /** Small shake to draw attention, e.g. when the player taps a locked box. */
  shake() {
    this.el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 300, easing: 'ease-in-out' }
    );
  }

  onTap(handler) {
    this.el.addEventListener('click', () => handler(this.adventureId));
  }
}
