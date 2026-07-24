import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { SCENES } from '../config/constants.js';
import { icon } from '../components/icons.js';
import { Camera } from '../systems/Camera.js';
import { typeText, wait } from '../utils/typewriter.js';

/**
 * BazaarScene
 * -----------
 * The third adventure: a merchant will only hand over the last key to
 * visitors who prove their attentiveness. Across five rounds the counter
 * fills with more goods and the memory test gets a little harder —
 * round 4 shuffles the goods' positions right after showing them (so
 * spatial memory alone isn't enough), and round 5 adds a soft, non-
 * punishing time hint.
 *
 * Mechanic: a set of items on the counter briefly glows (memorize),
 * then the player taps that same set back — order doesn't matter, same
 * "watch then touch" language as every other adventure in the game.
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
    this.fieldEl = sceneEl.querySelector('#bazaar-field');
    this.roundDotEls = Array.from(sceneEl.querySelectorAll('#bazaar-round-dots .adventure-round-dot'));
    this.backBtn = sceneEl.querySelector('#bazaar-back');

    this.backBtn.addEventListener('click', () => this.sceneManager.goTo(SCENES.ISLAND));

    this._runToken = 0;
    this._hintTimer = null;
  }

  async enter() {
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

    await this._playRounds(token);
  }

  async exit() {
    this._runToken += 1;
    clearTimeout(this._hintTimer);
  }

  _resetState() {
    this.fieldEl.innerHTML = '';
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
    this.rulesItemEl.innerHTML = icon('lanternItem');
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

  async _playRounds(token) {
    for (let i = 0; i < this.config.rounds.length; i++) {
      this._updateRoundDots(i);
      const won = await this._playRound(this.config.rounds[i], token);
      if (!won) return;

      if (i < this.config.rounds.length - 1) {
        const line = this.config.roundWinLines[i % this.config.roundWinLines.length];
        this.dialogEl.classList.remove('dialog--hidden');
        await typeText(this.dialogTextEl, line);
        await wait(800);
        this.dialogEl.classList.add('dialog--hidden');
        await wait(400);
      }
    }

    if (token !== this._runToken) return;
    await this._playWinSequence();
  }

  _updateRoundDots(currentIndex) {
    this.roundDotEls.forEach((dot, i) => {
      dot.classList.toggle('is-done', i < currentIndex);
      dot.classList.toggle('is-current', i === currentIndex);
    });
  }

  /**
   * One round: scatter goods, mark some as the memorize target, flash
   * them, optionally reshuffle positions, then wait for the player to
   * tap that same set of DOM elements back (identity tracked by element
   * reference, so a reshuffle can't confuse it with a same-looking decoy).
   */
  _playRound(round, token) {
    return new Promise((resolve) => {
      this.fieldEl.innerHTML = '';

      const items = this._scatterItems(round.itemCount);
      const targets = new Set(this._pickRandom(items, round.targetCount));
      const found = new Set();

      items.forEach((entry) => {
        entry.el.addEventListener('click', () => {
          if (token !== this._runToken || found.has(entry)) return;

          if (targets.has(entry)) {
            this.audio.win();
            entry.el.classList.add('is-correct');
            found.add(entry);
            clearTimeout(this._hintTimer);

            if (found.size === targets.size) {
              resolve(true);
            } else {
              this._startHintTimer(targets, found, token);
            }
          } else {
            this.audio.nudge();
            entry.el.classList.add('is-wrong');
            setTimeout(() => entry.el.classList.remove('is-wrong'), 350);
          }
        });
      });

      this._runRoundIntro(round, items, targets, token).then(() => {
        this._startHintTimer(targets, found, token);
      });
    });
  }

  /** Memorize flash, then (for later rounds) reshuffle positions before play begins. */
  async _runRoundIntro(round, items, targets, token) {
    await wait(300);
    if (token !== this._runToken) return;

    targets.forEach((entry) => entry.el.classList.add('is-lit'));
    await wait(1400);
    targets.forEach((entry) => entry.el.classList.remove('is-lit'));

    if (round.reshuffleAfterMemorize) {
      await wait(300);
      this._repositionItems(items);
    }

    if (round.timedHint) {
      this._showTimer();
    }
  }

  _scatterItems(count) {
    const positions = this._generatePositions(count);

    return positions.map((pos, i) => {
      const goodsIcon = this.config.goods[i % this.config.goods.length];
      const el = document.createElement('button');
      el.className = 'bzr-item';
      el.style.left = `${pos.left}%`;
      el.style.top = `${pos.top}%`;
      el.style.transform = `rotate(${pos.rotation}deg) scale(${pos.scale})`;
      el.innerHTML = icon(goodsIcon);
      el.setAttribute('aria-label', 'Товар на прилавку');
      this.fieldEl.appendChild(el);
      return { el, pos };
    });
  }

  _repositionItems(items) {
    const positions = this._generatePositions(items.length);
    items.forEach((entry, i) => {
      entry.el.style.left = `${positions[i].left}%`;
      entry.el.style.top = `${positions[i].top}%`;
      entry.el.style.transform = `rotate(${positions[i].rotation}deg) scale(${positions[i].scale})`;
    });
  }

  _generatePositions(count) {
    const cols = 6;
    const rows = Math.ceil(count / cols);
    const cells = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          left: 18 + c * ((84 - 18) / (cols - 1)) + (Math.random() - 0.5) * 5,
          top: 42 + r * ((82 - 42) / Math.max(rows - 1, 1)) + (Math.random() - 0.5) * 5,
          rotation: (Math.random() - 0.5) * 30,
          scale: 0.85 + Math.random() * 0.3,
        });
      }
    }
    return this._shuffle(cells).slice(0, count);
  }

  _pickRandom(arr, count) {
    return this._shuffle(arr).slice(0, count);
  }

  _shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  /** A soft, non-punishing time hint — it just fades away, nothing resets when it's gone. */
  _showTimer() {
    if (!this.timerEl) {
      this.timerEl = document.createElement('div');
      this.timerEl.className = 'bzr-timer';
      this.timerEl.innerHTML = `
        <svg viewBox="0 0 40 40"><circle class="bzr-timer__fill" cx="20" cy="20" r="16"
          fill="none" stroke="var(--color-sun)" stroke-width="4"
          stroke-dasharray="100" stroke-dashoffset="0" pathLength="100" /></svg>
      `;
      this.sceneEl.querySelector('.bzr-layer--floor').appendChild(this.timerEl);
    }
    this.timerEl.classList.add('is-visible');
    const fillEl = this.timerEl.querySelector('.bzr-timer__fill');
    fillEl.style.strokeDashoffset = '0';
    requestAnimationFrame(() => {
      fillEl.style.transition = 'stroke-dashoffset 25s linear';
      fillEl.style.strokeDashoffset = '100';
    });
  }

  _startHintTimer(targets, found, token) {
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(async () => {
      if (token !== this._runToken) return;
      const remaining = [...targets].filter((t) => !found.has(t));
      if (remaining.length === 0) return;

      this.dialogEl.classList.remove('dialog--hidden');
      await typeText(this.dialogTextEl, this.config.hintLine);
      setTimeout(() => this.dialogEl.classList.add('dialog--hidden'), 2200);

      const hint = remaining[Math.floor(Math.random() * remaining.length)];
      hint.el.classList.add('is-hinting');
      setTimeout(() => hint.el.classList.remove('is-hinting'), 3000);

      this._startHintTimer(targets, found, token);
    }, this.config.hintDelayMs);
  }

  async _playWinSequence() {
    this._updateRoundDots(this.config.rounds.length);
    this.timerEl?.classList.remove('is-visible');
    await wait(400);

    this.audio.chest();
    this.dialogEl.classList.remove('dialog--hidden');
    await typeText(this.dialogTextEl, this.config.winLine);
    await wait(1400);

    this.sceneManager.goTo(SCENES.REWARD, { adventureId: 'bazaar' });
  }
}
