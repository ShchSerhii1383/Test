/**
 * QuestionCard
 * ------------
 * The right-hand page of the journal: chapter/question counter, the
 * short story line, and the question itself. Pure rendering — it just
 * writes text into the elements it's given.
 */
export class QuestionCard {
  /**
   * @param {{counterEl: HTMLElement, storyEl: HTMLElement, questionEl: HTMLElement}} els
   */
  constructor(els) {
    this.counterEl = els.counterEl;
    this.storyEl = els.storyEl;
    this.questionEl = els.questionEl;
  }

  render(questionData, number, total) {
    this.counterEl.textContent = `Question ${number} / ${total}`;
    this.storyEl.textContent = questionData.story;
    this.questionEl.textContent = questionData.question;
  }
}
