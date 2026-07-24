import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { SCENES, MICKEY_STATES } from '../config/constants.js';

/**
 * MountainScene
 * -------------
 * "Remember the path" mini-game. Mickey lights up a short sequence of
 * stepping stones, then the player taps them back in the same order.
 * Not a memory test in spirit — the sequence is short and a wrong tap
 * just replays the sequence again, no penalty, no timer.
 *
 * On success, hands off to RewardScene via SceneManager.
 */
export class MountainScene {
  /**
   * @param {HTMLElement} sceneEl
   * @param {import('../systems/SceneManager.js').SceneManager} sceneManager
   * @param {import('../components/Mickey.js').Mickey} mickey - shared Mickey instance
   */
  constructor(sceneEl, sceneManager, mickey, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.mickey = mickey;
    this.audio = audio;
    this.config = ADVENTURE_CONFIG.mountain;

    this.introEl = sceneEl.querySelector('#mountain-intro');
    this.introTextEl = sceneEl.querySelector('#mountain-intro-text');
    this.stonesContainerEl = sceneEl.querySelector('#mountain-stones');
    this.backBtn = sceneEl.querySelector('#mountain-back');

    this.backBtn.addEventListener('click', () => this.sceneManager.goTo(SCENES.ISLAND));

    /** @type {number[]} the sequence of stone indices to remember */
    this.sequence = [];
    /** @type {number[]} what the player has tapped so far this round */
    this.playerProgress = [];
    this.isReplaying = false;
  }

  /** Called by SceneManager right before this scene becomes visible. */
  async enter() {
    this.introTextEl.textContent = this.config.intro;
    this.introEl.classList.remove('is-hidden');

    this._renderStones();
    this._generateSequence();

    setTimeout(() => {
      this.introEl.classList.add('is-hidden');
      this._playSequence();
    }, 1800);
  }

  async exit() {
    this.stonesContainerEl.innerHTML = '';
  }

  _renderStones() {
    this.stonesContainerEl.innerHTML = '';
    const positions = this._generatePositions(this.config.stoneCount);

    this.stoneEls = positions.map((pos, i) => {
      const stoneEl = document.createElement('button');
      stoneEl.className = 'mountain-stone';
      stoneEl.style.left = `${pos.x}%`;
      stoneEl.style.top = `${pos.y}%`;
      stoneEl.setAttribute('aria-label', `Камінь ${i + 1}`);
      stoneEl.addEventListener('click', () => this._handleTap(i, stoneEl));
      this.stonesContainerEl.appendChild(stoneEl);
      return stoneEl;
    });
  }

  /** Loose scattered layout, kept away from edges for easy one-handed taps. */
  _generatePositions(count) {
    const positions = [];
    const cols = 2;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jitterX = (Math.random() - 0.5) * 8;
      const jitterY = (Math.random() - 0.5) * 8;

      positions.push({
        x: 32 + col * 36 + jitterX,
        y: 35 + row * 26 + jitterY,
      });
    }
    return positions;
  }

  _generateSequence() {
    this.sequence = [];
    const stoneIndices = [...Array(this.config.stoneCount).keys()];

    for (let i = 0; i < this.config.sequenceLength; i++) {
      const randomIndex = stoneIndices[Math.floor(Math.random() * stoneIndices.length)];
      this.sequence.push(randomIndex);
    }
    this.playerProgress = [];
  }

  /** Light up each stone in order so the player can watch and remember. */
  async _playSequence() {
    this.isReplaying = true;
    this.mickey.play(MICKEY_STATES.THINK);

    for (const stoneIndex of this.sequence) {
      await this._wait(280);
      this.stoneEls[stoneIndex].classList.add('is-lit');
      await this._wait(500);
      this.stoneEls[stoneIndex].classList.remove('is-lit');
    }

    this.isReplaying = false;
    this.mickey.play(MICKEY_STATES.IDLE);
  }

  _handleTap(stoneIndex, stoneEl) {
    if (this.isReplaying) return; // ignore taps while the sequence is playing

    const expectedIndex = this.sequence[this.playerProgress.length];

    if (stoneIndex === expectedIndex) {
      stoneEl.classList.add('is-correct');
      setTimeout(() => stoneEl.classList.remove('is-correct'), 400);
      this.playerProgress.push(stoneIndex);

      if (this.playerProgress.length === this.sequence.length) {
        this._handleWin();
      }
    } else {
      this.audio.nudge();
      stoneEl.classList.add('is-wrong');
      setTimeout(() => stoneEl.classList.remove('is-wrong'), 350);
      this.mickey.say(this.config.missLine, 1300);
      this.playerProgress = [];
      setTimeout(() => this._playSequence(), 700);
    }
  }

  _handleWin() {
    this.audio.win();
    this.mickey.play(MICKEY_STATES.HAPPY);
    this.mickey.say(this.config.winLine);
    setTimeout(() => {
      this.sceneManager.goTo(SCENES.REWARD, { adventureId: 'mountain' });
    }, 900);
  }

  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
