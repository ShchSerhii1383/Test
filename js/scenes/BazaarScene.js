import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { SCENES } from '../config/constants.js';
import { icon } from '../components/icons.js';
import { Camera } from '../systems/Camera.js';
import { typeText, wait } from '../utils/typewriter.js';

/**
 * BazaarScene — "Treasure Riddles"
 * --------------------------------
 * The third adventure: Mickey finds an ancient riddle book. Five riddles,
 * easiest first, each with three beautifully drawn answer cards. A correct
 * answer turns the page; there's no penalty for a wrong one, just "try
 * again" — matches the "no punishment" feel of every adventure here.
 *
 * Replaces the earlier memory-matching version entirely: that mechanic
 * didn't stick with players, and a riddle book fits the "treasure map /
 * ancient story" feel of the island much better.
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
    this.pageEl = sceneEl.querySelector('#bazaar-book .bzr-book__page');
    this.questionEl = sceneEl.querySelector('#bazaar-question');
    this.optionsEl = sceneEl.querySelector('#bazaar-options');
    this.roundDotEls = Array.from(sceneEl.querySelectorAll('#bazaar-round-dots .adventure-round-dot'));
    this.backBtn = sceneEl.querySelector('#bazaar-back');

    this.backBtn.addEventListener('click', async () => {
      // Blocked once the win sequence has started — otherwise a fast tap
      // here races the win sequence's own goTo(REWARD) and can win,
      // dumping the player back on the island without ever seeing the
      // reward (the intermittent "finishes early" bug).
      if (this._isFinishing) return;
      await this.sceneManager.goTo(SCENES.ISLAND);
    });

    this._runToken = 0;
    this._isFinishing = false;
    this.backBtn.classList.remove('is-disabled');
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
      console.log('[Bazaar] fallback: _isFinishing =', this._isFinishing, '-> going to', this._isFinishing ? 'REWARD' : 'ISLAND');
      if (this._isFinishing) {
        await this.sceneManager.goTo(SCENES.REWARD, { adventureId: 'bazaar' });
      } else {
        await this.sceneManager.goTo(SCENES.ISLAND);
      }
    }
  }

  async _enterInner() {
    const token = ++this._runToken;
    this._resetState();

    await this._stageReveal();
    if (token !== this._runToken) return;

    await this._stageStory();
    if (token !== this._runToken) return;

    await this._stageRulesDemo();
    if (token !== this._runToken) return;

    await this._runCountdown();
    if (token !== this._runToken) return;

    await this._playRiddles(token);
  }

  async exit() {
    this._runToken += 1;
    this._pendingResolve?.(false);
    this._pendingResolve = null;
  }

  _resetState() {
    this._isFinishing = false;
    this.optionsEl.innerHTML = '';
    this.questionEl.textContent = '';
    this.dialogEl.classList.add('dialog--hidden');
    this.rulesEl.classList.remove('is-visible');
    this.countdownEl.classList.remove('is-visible');
    this.roundDotEls.forEach((dot) => dot.classList.remove('is-done', 'is-current'));
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

  /** Play all five riddles in order, then the finale. */
  async _playRiddles(token) {
    for (let i = 0; i < this.config.riddles.length; i++) {
      console.log(`[Bazaar] starting riddle ${i + 1}/${this.config.riddles.length}`);
      this._updateRoundDots(i);
      const won = await this._playRiddle(this.config.riddles[i], token);
      console.log(`[Bazaar] riddle ${i + 1} resolved with won=${won}`);
      if (!won) return; // scene was exited mid-riddle

      if (i < this.config.riddles.length - 1) {
        const line = this.config.pageWinLines[i % this.config.pageWinLines.length];
        this.dialogEl.classList.remove('dialog--hidden');
        await typeText(this.dialogTextEl, line);
        await this._turnPage();
        this.dialogEl.classList.add('dialog--hidden');
      }
    }

    console.log('[Bazaar] all riddles complete, checking token before win sequence', { token, current: this._runToken });
    if (token !== this._runToken) return;

    console.log('[Bazaar] calling _playWinSequence()');
    await this._playWinSequence();
    console.log('[Bazaar] _playWinSequence() returned normally');
  }

  _updateRoundDots(currentIndex) {
    this.roundDotEls.forEach((dot, i) => {
      dot.classList.toggle('is-done', i < currentIndex);
      dot.classList.toggle('is-current', i === currentIndex);
    });
  }

  /**
   * One riddle: show the question and three shuffled answer cards, wait
   * for a tap. Resolves true once the correct one is chosen, false if the
   * scene was exited early.
   */
  _playRiddle(riddle, token) {
    return new Promise((resolve) => {
      this._pendingResolve = resolve;

      this.questionEl.textContent = riddle.question;
      this.optionsEl.innerHTML = '';
      this.optionsEl.style.pointerEvents = '';

      const options = this._shuffle(riddle.options);
      options.forEach((option) => {
        const el = document.createElement('button');
        el.className = 'bzr-option';
        el.innerHTML = icon(option.icon);
        el.setAttribute('aria-label', option.label);

        el.addEventListener('click', () => {
          try {
            if (token !== this._runToken) return;

            if (option.correct) {
              this.audio.win();
              el.classList.add('is-correct');
              this.optionsEl.style.pointerEvents = 'none'; // block further taps while we turn the page
              this._pendingResolve = null;
              resolve(true);
            } else {
              this.audio.nudge();
              el.classList.add('is-wrong');
              setTimeout(() => el.classList.remove('is-wrong'), 350);
              this.dialogEl.classList.remove('dialog--hidden');
              typeText(this.dialogTextEl, this.config.missLine);
              setTimeout(() => this.dialogEl.classList.add('dialog--hidden'), 1300);
            }
          } catch (err) {
            console.error('[Bazaar] riddle answer tap handler failed:', err);
          }
        });

        this.optionsEl.appendChild(el);
      });
    });
  }

  _shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  /** A short page-flip animation between riddles. */
  async _turnPage() {
    this.audio.tap();
    this.pageEl.classList.add('is-turning');
    await wait(600);
    this.pageEl.classList.remove('is-turning');
  }

  async _playWinSequence() {
    console.log('[Bazaar] _playWinSequence: started');
    this._isFinishing = true;
    this.backBtn.classList.add('is-disabled');
    this._updateRoundDots(this.config.riddles.length);
    await wait(400);

    this.audio.chest();
    this.dialogEl.classList.remove('dialog--hidden');
    await typeText(this.dialogTextEl, this.config.winLine);
    await wait(1400);
    console.log('[Bazaar] _playWinSequence: win line shown, calling goTo(REWARD)');

    await this.sceneManager.goTo(SCENES.REWARD, { adventureId: 'bazaar' });
    console.log('[Bazaar] _playWinSequence: goTo(REWARD) returned normally');
  }
}
