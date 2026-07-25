import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { ATLAS_PUZZLES } from '../data/atlasPuzzles.js';
import { SCENES, MICKEY_STATES } from '../config/constants.js';
import { icon } from '../components/icons.js';
import { Camera } from '../systems/Camera.js';
import { typeText, wait } from '../utils/typewriter.js';

/**
 * BazaarScene — "Explorer's Atlas"
 * ---------------------------------
 * The third adventure: Mickey finds an ancient atlas guarded by a lock
 * that only opens to whoever looks closely at the world. Five trials are
 * drawn at random from a bank of twenty (five categories: logical route,
 * find the error, sequence, odd one out, matching) — so no two
 * playthroughs land on quite the same five.
 *
 * Every puzzle's answer is meant to be readable straight off its own
 * illustration rather than a memorized geography fact — see the design
 * notes in data/atlasPuzzles.js before adding or editing any of them.
 *
 * Replaces the earlier riddle-book version entirely: same "no penalty,
 * just try again" feel, same shared adventure rhythm (reveal -> story ->
 * rules demo -> 3-2-1 -> the trials -> celebration -> Reward), but with
 * real visual-reasoning puzzles instead of a fixed set of five riddles.
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
    this.counterEl = sceneEl.querySelector('#atlas-counter');
    this.bookEl = sceneEl.querySelector('#atlas-book');
    this.pageLeftEl = sceneEl.querySelector('.atlas-book__page--left');
    this.illustrationEl = sceneEl.querySelector('#atlas-illustration');
    this.questionEl = sceneEl.querySelector('#atlas-question');
    this.optionsEl = sceneEl.querySelector('#atlas-options');
    this.keyEl = sceneEl.querySelector('#atlas-key');

    // No "back to island" escape hatch on purpose — once an adventure
    // starts, the only way out is finishing it.
    this._runToken = 0;
    this._isFinishing = false;
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

    const trials = this._pickTrials(5);
    await this._playTrials(trials, token);
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
    this.illustrationEl.innerHTML = '';
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

  /** Draw `count` distinct puzzles from the 20-puzzle bank. */
  _pickTrials(count) {
    return [...ATLAS_PUZZLES].sort(() => Math.random() - 0.5).slice(0, count);
  }

  /** Play all five trials in order, then the finale. */
  async _playTrials(trials, token) {
    for (let i = 0; i < trials.length; i++) {
      console.log(`[Bazaar] starting trial ${i + 1}/${trials.length} (puzzle #${trials[i].id}, ${trials[i].category})`);
      this.counterEl.textContent = `${i + 1} / ${trials.length}`;
      const won = await this._playTrial(trials[i], token);
      console.log(`[Bazaar] trial ${i + 1} resolved with won=${won}`);
      if (!won) return; // scene was exited mid-trial
    }

    console.log('[Bazaar] all trials complete, checking token before win sequence', { token, current: this._runToken });
    if (token !== this._runToken) return;

    console.log('[Bazaar] calling _playWinSequence()');
    await this._playWinSequence();
    console.log('[Bazaar] _playWinSequence() returned normally');
  }

  /**
   * One trial: show the illustration and question, render the four
   * (shuffled) answer cards, wait for the correct one to be tapped.
   * A wrong tap gets a shake and a brief cooldown, never a penalty.
   * Resolves true once solved, false if the scene was exited early.
   */
  _playTrial(puzzle, token) {
    return new Promise((resolve) => {
      this._pendingResolve = resolve;

      this.illustrationEl.innerHTML = puzzle.illustration;
      this.questionEl.textContent = puzzle.question;
      this.optionsEl.innerHTML = '';

      const options = [...puzzle.options].sort(() => Math.random() - 0.5);
      options.forEach((option) => {
        const el = document.createElement('button');
        el.className = 'atlas-option';
        el.textContent = option.label;

        el.addEventListener('click', () => {
          try {
            if (token !== this._runToken) return;

            if (option.correct) {
              this.audio.win();
              el.classList.add('is-correct');
              this.optionsEl.style.pointerEvents = 'none';
              this._pendingResolve = null;
              this._turnPage().then(() => resolve(true));
            } else {
              this.audio.nudge();
              el.classList.add('is-wrong');
              this.optionsEl.style.pointerEvents = 'none'; // one-second cooldown before trying again
              setTimeout(() => {
                el.classList.remove('is-wrong');
                this.optionsEl.style.pointerEvents = '';
              }, 1000);
            }
          } catch (err) {
            console.error('[Bazaar] atlas answer tap handler failed:', err);
          }
        });

        this.optionsEl.appendChild(el);
      });
    });
  }

  /** A short page-flip on the left page between trials. */
  async _turnPage() {
    this.audio.tap();
    await wait(500); // let the CORRECT stamp actually be seen first
    this.pageLeftEl.classList.add('is-turning');
    await wait(600);
    this.pageLeftEl.classList.remove('is-turning');
  }

  async _playWinSequence() {
    console.log('[Bazaar] _playWinSequence: started');
    this._isFinishing = true;
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
    console.log('[Bazaar] _playWinSequence: win line shown, calling goTo(REWARD)');

    await this.sceneManager.goTo(SCENES.REWARD, { adventureId: 'bazaar' });
    console.log('[Bazaar] _playWinSequence: goTo(REWARD) returned normally');
  }
}
