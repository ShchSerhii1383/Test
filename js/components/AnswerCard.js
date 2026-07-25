/**
 * AnswerCard
 * ----------
 * One wooden answer card. Owns its own DOM element and visual states
 * (idle / correct / wrong) — nothing about which answer is right lives
 * here, that's the caller's job. Just: render the text, report taps,
 * show correct/wrong when told to.
 */
export class AnswerCard {
  /**
   * @param {string} text
   * @param {(card: AnswerCard) => void} onTap
   */
  constructor(text, onTap) {
    this.el = document.createElement('button');
    this.el.type = 'button';
    this.el.className = 'journal-card';
    this.el.textContent = text;
    this.el.addEventListener('click', () => onTap(this));
  }

  markCorrect() {
    this.el.classList.add('is-correct');
  }

  markWrong() {
    this.el.classList.remove('is-wrong');
    void this.el.offsetWidth; // restart the shake if tapped wrong twice in a row
    this.el.classList.add('is-wrong');
  }

  clearWrong() {
    this.el.classList.remove('is-wrong');
  }

  setDisabled(disabled) {
    this.el.style.pointerEvents = disabled ? 'none' : '';
  }
}
