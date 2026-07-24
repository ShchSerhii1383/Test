import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { SCENES, MICKEY_STATES } from '../config/constants.js';
import { icon } from '../components/icons.js';

/**
 * BazaarScene
 * -----------
 * "Find the best discount" mini-game. A few stalls each show an original
 * and discounted price; the player taps the one with the biggest discount.
 * The math is simple on purpose — this isn't a test, just a quick,
 * readable little win.
 *
 * On success, hands off to RewardScene via SceneManager.
 */
export class BazaarScene {
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
    this.config = ADVENTURE_CONFIG.bazaar;

    this.introEl = sceneEl.querySelector('#bazaar-intro');
    this.introTextEl = sceneEl.querySelector('#bazaar-intro-text');
    this.stallsContainerEl = sceneEl.querySelector('#bazaar-stalls');
    this.backBtn = sceneEl.querySelector('#bazaar-back');

    this.backBtn.addEventListener('click', () => this.sceneManager.goTo(SCENES.ISLAND));
  }

  /** Called by SceneManager right before this scene becomes visible. */
  async enter() {
    this.introTextEl.textContent = this.config.intro;
    this.introEl.classList.remove('is-hidden');

    this._renderStalls();

    setTimeout(() => {
      this.introEl.classList.add('is-hidden');
    }, 2000);
  }

  async exit() {
    this.stallsContainerEl.innerHTML = '';
  }

  _renderStalls() {
    this.stallsContainerEl.innerHTML = '';

    const bestIndex = this._findBestDiscountIndex();

    this.config.stalls.forEach((stall, i) => {
      const stallEl = document.createElement('button');
      stallEl.className = 'bazaar-stall';
      stallEl.setAttribute('aria-label', `${stall.name}, знижена ціна ${stall.discounted}`);

      stallEl.innerHTML = `
        <div class="bazaar-stall__icon">${icon(stall.icon)}</div>
        <div class="bazaar-stall__name">${stall.name}</div>
        <div class="bazaar-stall__price">
          <span class="bazaar-stall__original">${stall.original}</span>${stall.discounted}
        </div>
      `;

      stallEl.addEventListener('click', () => this._handleTap(i === bestIndex, stallEl));
      this.stallsContainerEl.appendChild(stallEl);
    });
  }

  /** The stall with the largest percentage discount is the correct answer. */
  _findBestDiscountIndex() {
    let bestIndex = 0;
    let bestDiscountRatio = -Infinity;

    this.config.stalls.forEach((stall, i) => {
      const discountRatio = (stall.original - stall.discounted) / stall.original;
      if (discountRatio > bestDiscountRatio) {
        bestDiscountRatio = discountRatio;
        bestIndex = i;
      }
    });

    return bestIndex;
  }

  _handleTap(isCorrect, stallEl) {
    if (isCorrect) {
      this.audio.win();
      stallEl.classList.add('is-correct');
      this.mickey.play(MICKEY_STATES.HAPPY);
      this.mickey.say(this.config.winLine);
      setTimeout(() => {
        this.sceneManager.goTo(SCENES.REWARD, { adventureId: 'bazaar' });
      }, 900);
    } else {
      this.audio.nudge();
      stallEl.classList.add('is-wrong');
      setTimeout(() => stallEl.classList.remove('is-wrong'), 350);
      this.mickey.say(this.config.missLine, 1300);
    }
  }
}
