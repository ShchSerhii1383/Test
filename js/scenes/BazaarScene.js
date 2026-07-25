import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { JOURNAL_QUESTIONS } from '../data/journalQuestions.js';
import { SCENES, MICKEY_STATES } from '../config/constants.js';
import { icon } from '../components/icons.js';
import { Camera } from '../systems/Camera.js';
import { QuestionManager } from '../systems/QuestionManager.js';
import { QuestionCard } from '../components/QuestionCard.js';
import { AnswerCard } from '../components/AnswerCard.js';
import { StampAnimation } from '../components/StampAnimation.js';
import { typeText, wait } from '../utils/typewriter.js';

/**
 * BazaarScene — "Explorer's Journal"
 * ------------------------------------
 * The third adventure: Mickey finds an old expedition journal. Five
 * questions are drawn at random from the bank each playthrough, no
 * repeats. This scene is the orchestrator only — it owns the flow
 * (reveal -> story -> rules -> countdown -> five questions -> key ->
 * Reward) and wires together four small, independent pieces that don't
 * know about each other:
 *
 *   QuestionManager  — which questions this run uses, and which is current
 *   QuestionCard     — renders the story/question text
 *   AnswerCard       — one wooden card, reports taps, shows correct/wrong
 *   StampAnimation   — the "CORRECT" stamp that drops on a right answer
 *
 * The question bank (data/journalQuestions.js) is deliberately a small
 * set of placeholder questions — the brief was explicit that the
 * mechanism should be built first, with the real 20-50 questions written
 * later without touching any of the logic below.
 */
export class BazaarScene {
  /**
   * @param {HTMLElement} sceneEl
   * @param {import('../systems/SceneManager.js').SceneManager} sceneManager
   * @param {import('../components/Mickey.js').Mickey} mickey - the shared island Mickey (used only when we return)
   * @param {import('../systems/AudioManager.js').AudioManager} audio
   */
  constructor(sceneEl, sceneManager, mickey, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.mickey = mickey;
    this.audio = audio;
    this.config = ADVENTURE_CONFIG.bazaar;

    this.camera = new Camera(sceneEl);
    this.dialogEl = sceneEl.querySelector('#bazaar-dialog');
    this.dialogTextEl = sceneEl.querySelector('#bazaar-dialog-text');
    this.rulesEl = sceneEl.querySelector('#bazaar-rules');
    this.rulesTextEl = sceneEl.querySelector('#bazaar-rules-text');
    this.rulesItemEl = sceneEl.querySelector('#bazaar-rules-item');
    this.countdownEl = sceneEl.querySelector('#bazaar-countdown');
    this.bookEl = sceneEl.querySelector('#journal-book');
    this.pageEl = sceneEl.querySelector('.journal-page');
    this.cardsEl = sceneEl.querySelector('#journal-cards');
    this.keyEl = sceneEl.querySelector('#atlas-key');

    this.questions = new QuestionManager(JOURNAL_QUESTIONS);
    this.questionCard = new QuestionCard({
      counterEl: sceneEl.querySelector('#journal-counter'),
      storyEl: sceneEl.querySelector('#journal-story'),
      questionEl: sceneEl.querySelector('#journal-question'),
    });
    this.stamp = new StampAnimation(sceneEl.querySelector('#journal-stamp'));

    // No "back to island" escape hatch on purpose — once an adventure
    // starts, the only way out is finishing it.
    //
    // State machine: INTRO -> RULES -> PLAY -> WIN -> EXIT. Only the
    // EXIT state may ever call sceneManager.goTo() — see _exit() below.
    this._runToken = 0;
    this.state = 'INTRO';
    this._pendingResolve = null;
  }

  async enter() {
    try {
      await this._enterInner();
    } catch (err) {
      // Never leave the player stranded on a broken scene: if the error
      // hit after they'd already won, still try to get them their reward;
      // otherwise just send them back to the island.
      console.error('[Bazaar] enter() FALLBACK TRIGGERED — _enterInner() threw:', err);
      console.log('[Bazaar] fallback: state =', this.state, '-> going to', this.state === 'WIN' ? 'REWARD' : 'ISLAND');
      if (this.state === 'WIN') {
        await this._exit(SCENES.REWARD, { adventureId: 'bazaar' });
      } else {
        await this._exit(SCENES.ISLAND);
      }
    }
  }

  /**
   * The ONLY place in this scene allowed to call sceneManager.goTo().
   * The state===EXIT guard makes a second call a harmless no-op instead
   * of a second competing transition.
   */
  async _exit(targetScene, data) {
    if (this.state === 'EXIT') return;
    this.state = 'EXIT';
    await this.sceneManager.goTo(targetScene, data);
  }

  async _enterInner() {
    const token = ++this._runToken;
    this._resetState();
    this.state = 'INTRO';

    await this._stageReveal();
    if (token !== this._runToken) return;

    await this._stageStory();
    if (token !== this._runToken) return;

    this.state = 'RULES';
    await this._stageRulesDemo();
    if (token !== this._runToken) return;

    await this._runCountdown();
    if (token !== this._runToken) return;

    this.state = 'PLAY';
    this.questions.start(5);
    await this._playQuestions(token);
  }

  async exit() {
    this._runToken += 1;
    this._pendingResolve?.(false);
    this._pendingResolve = null;
  }

  _resetState() {
    this.state = 'INTRO';
    this.cardsEl.innerHTML = '';
    this.stamp.reset();
    this.dialogEl.classList.add('dialog--hidden');
    this.rulesEl.classList.remove('is-visible');
    this.countdownEl.classList.remove('is-visible');
    this.keyEl.classList.remove('is-visible');
    this.bookEl.style.opacity = '';
    this.bookEl.style.transform = '';
    this.camera.reset();
  }

  async _stageReveal() {
    this.camera.focus({ scale: 1.15, x: '0%', y: '3%' });
    await wait(1400);
    this.camera.reset();
    await wait(900);
  }

  async _stageStory() {
    for (const line of this.config.story) {
      this.dialogEl.classList.remove('dialog--hidden');
      await typeText(this.dialogTextEl, line);
      await wait(1000);
    }
    this.dialogEl.classList.add('dialog--hidden');
    await wait(300);
  }

  async _stageRulesDemo() {
    this.rulesTextEl.textContent = this.config.rulesLine;
    this.rulesItemEl.innerHTML = icon('compassBody');
    this.rulesEl.classList.add('is-visible');

    await wait(500);
    this.rulesItemEl.classList.add('is-glowing');
    await wait(1400);
    this.rulesItemEl.classList.remove('is-glowing');
    this.rulesItemEl.classList.add('is-collected');
    await wait(600);

    this.rulesEl.classList.remove('is-visible');
    this.rulesItemEl.classList.remove('is-collected');
    await wait(300);
  }

  async _runCountdown() {
    for (const step of ['3', '2', '1']) {
      this.countdownEl.textContent = step;
      this.countdownEl.classList.remove('is-visible');
      void this.countdownEl.offsetWidth;
      this.countdownEl.classList.add('is-visible');
      await wait(650);
    }
    this.countdownEl.classList.remove('is-visible');
  }

  /** Play all five questions in order, then the finale. */
  async _playQuestions(token) {
    let question = this.questions.current();
    while (question) {
      console.log(`[Bazaar] question ${this.questions.currentNumber()}/${this.questions.total()}`);
      const won = await this._playQuestion(question, token);
      console.log(`[Bazaar] question ${this.questions.currentNumber()} resolved with won=${won}`);
      if (!won) return; // scene was exited mid-question

      question = this.questions.advance();
    }

    console.log('[Bazaar] all questions complete, checking token before win sequence', { token, current: this._runToken });
    if (token !== this._runToken) return;

    console.log('[Bazaar] calling _playWinSequence()');
    await this._playWinSequence();
    console.log('[Bazaar] _playWinSequence() returned normally');
  }

  /**
   * One question: render it via QuestionCard, build four AnswerCards
   * (shuffled), wait for the correct one. A wrong tap shakes and clears
   * itself — no penalty, answer again any time. Resolves true once
   * solved, false if the scene was exited early.
   */
  _playQuestion(question, token) {
    return new Promise((resolve) => {
      this._pendingResolve = resolve;

      this.questionCard.render(question, this.questions.currentNumber(), this.questions.total());
      this.cardsEl.innerHTML = '';

      const order = question.answers.map((text, i) => ({ text, isCorrect: i === question.correct }));
      this._shuffle(order).forEach((entry) => {
        const card = new AnswerCard(entry.text, (tappedCard) => {
          try {
            if (token !== this._runToken) return;
            this._handleAnswerTap(entry, tappedCard, resolve);
          } catch (err) {
            console.error('[Bazaar] journal answer tap handler failed:', err);
          }
        });
        this.cardsEl.appendChild(card.el);
      });
    });
  }

  _handleAnswerTap(entry, tappedCard, resolve) {
    if (entry.isCorrect) {
      this.audio.win();
      tappedCard.markCorrect();
      this._pendingResolve = null;
      this._onCorrectAnswer().then(() => resolve(true));
    } else {
      this.audio.nudge();
      tappedCard.markWrong();
      setTimeout(() => tappedCard.clearWrong(), 400);
    }
  }

  /** Stamp falls, then the page turns — same beat every time an answer lands. */
  async _onCorrectAnswer() {
    await this.stamp.play('CORRECT');
    this.audio.tap();
    this.pageEl.classList.add('is-turning');
    await wait(600);
    this.pageEl.classList.remove('is-turning');
    this.stamp.reset();
  }

  _shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  /** All five questions solved: the journal closes, the key appears. */
  async _playWinSequence() {
    console.log('[Bazaar] _playWinSequence: started');
    this.state = 'WIN';
    await wait(400);

    this.bookEl.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    this.bookEl.style.opacity = '0.3';
    this.bookEl.style.transform = 'scale(0.9)';

    this.audio.chest();
    this.keyEl.classList.add('is-visible');
    this.mickey.play(MICKEY_STATES.CELEBRATE);

    this.dialogEl.classList.remove('dialog--hidden');
    await typeText(this.dialogTextEl, this.config.winLine);
    await wait(1400);
    console.log('[Bazaar] _playWinSequence: win line shown, calling _exit(REWARD)');

    await this._exit(SCENES.REWARD, { adventureId: 'bazaar' });
    console.log('[Bazaar] _playWinSequence: _exit(REWARD) returned normally');
  }
}
