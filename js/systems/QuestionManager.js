/**
 * QuestionManager
 * ---------------
 * Owns exactly one thing: which questions this playthrough uses, and
 * which one is current. Draws `count` distinct questions at random from
 * the bank when started — no repeats within a run. Nothing in here knows
 * about the book, cards, stamps, or Reward; it only tracks position in a
 * list.
 */
export class QuestionManager {
  /** @param {Array<object>} bank - the full question pool (see data/journalQuestions.js) */
  constructor(bank) {
    this.bank = bank;
    this.selected = [];
    this.index = 0;
  }

  /** Draw `count` distinct questions and reset to the first one. */
  start(count) {
    this.selected = [...this.bank].sort(() => Math.random() - 0.5).slice(0, count);
    this.index = 0;
    return this.current();
  }

  current() {
    return this.selected[this.index] ?? null;
  }

  currentNumber() {
    return this.index + 1;
  }

  total() {
    return this.selected.length;
  }

  hasNext() {
    return this.index < this.selected.length - 1;
  }

  /** Move to the next question. Returns it, or null if this was the last one. */
  advance() {
    if (!this.hasNext()) {
      this.index = this.selected.length; // past the end — isComplete() becomes true
      return null;
    }
    this.index += 1;
    return this.current();
  }

  isComplete() {
    return this.index >= this.selected.length;
  }
}
