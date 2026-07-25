import { SCENES, MICKEY_STATES } from '../config/constants.js';
import { wait } from '../utils/typewriter.js';
import { icon } from '../components/icons.js';
import { renderChest } from '../components/chestSprite.js';

/**
 * RewardScene
 * -----------
 * The universal gift moment, shared by every adventure.
 *
 * This is the emotional core of the whole game — the brief is explicit that
 * opening the gift should feel bigger than the mini-game that earned it.
 * So the pacing here is deliberate: anticipation, a beat of silence, light,
 * and only then the gift. Nothing in this scene is rushed, and the timings
 * below are the point of it rather than an implementation detail.
 *
 *   countdown -> chest -> tap -> lid + light -> three cards -> pick
 *   -> flip -> PAUSE -> reveal -> back to the island
 */
export class RewardScene {
  /**
   * @param {HTMLElement} sceneEl
   * @param {import('../systems/SceneManager.js').SceneManager} sceneManager
   * @param {import('../systems/GiftManager.js').GiftManager} giftManager
   * @param {import('../systems/SaveManager.js').SaveManager} saveManager
   * @param {import('../components/Mickey.js').Mickey} mickey
   */
  constructor(sceneEl, sceneManager, giftManager, saveManager, mickey, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.giftManager = giftManager;
    this.saveManager = saveManager;
    this.mickey = mickey;
    this.audio = audio;

    this.countdownEl = sceneEl.querySelector('#reward-countdown');
    this.boxEl = sceneEl.querySelector('#reward-box');
    this.rewardArtEl = sceneEl.querySelector('.reward-box__art');
    this.beamEl = sceneEl.querySelector('#reward-beam');
    this.sparklesEl = sceneEl.querySelector('#reward-sparkles');
    this.cardsEl = sceneEl.querySelector('#reward-cards');
    this.revealEl = sceneEl.querySelector('#reward-reveal');
    this.revealIconEl = sceneEl.querySelector('#reward-reveal-icon');
    this.revealTitleEl = sceneEl.querySelector('#reward-reveal-title');
    this.revealMessageEl = sceneEl.querySelector('#reward-reveal-message');
    this.continueBtn = sceneEl.querySelector('#reward-continue');

    this.boxEl.addEventListener('click', () => this._openChest());
    this.continueBtn.addEventListener('click', () => this._finish());

    this._adventureId = null;

    // Guards against double-taps *within* one visit. Reset on every enter()
    // and exit(), so a sequence that gets interrupted can never leave the
    // scene permanently locked — that would look like the chest simply
    // refusing to open, with nothing on screen explaining why.
    this._isBusy = false;

    // Bumped on every enter(). A stray timer from a previous visit compares
    // its token and bows out instead of touching the new run's state.
    this._runToken = 0;
  }

  /** @param {{adventureId: string}} data */
  async enter(data = {}) {
    try {
      await this._enterInner(data);
    } catch (err) {
      console.error('RewardScene.enter() failed partway through:', err);
    }
  }

  async _enterInner(data = {}) {
    this._adventureId = data.adventureId ?? null;
    this._isBusy = false;
    const token = ++this._runToken;

    // Same chest they tapped on the island, not a generic one — the theme
    // comes straight from which adventure just finished.
    renderChest(this.rewardArtEl, this._adventureId);

    this._resetVisualState();
    await this._runCountdown();
    if (token !== this._runToken) return; // a newer visit started meanwhile

    this.boxEl.classList.add('is-visible');
    this.mickey.hush();
  }


  /** Leave nothing behind: the next adventure gets a clean scene. */
  async exit() {
    this._runToken += 1;
    this._isBusy = false;
    this._resetVisualState();
  }

  _resetVisualState() {
    this.boxEl.classList.remove('is-visible', 'is-open', 'is-gone');
    this.beamEl.classList.remove('is-shining');
    this.sparklesEl.innerHTML = '';
    this.cardsEl.classList.remove('is-visible');
    this.cardsEl.innerHTML = '';
    this.revealEl.classList.remove('is-visible');
    this.countdownEl.classList.remove('is-visible');

    // Force the browser to drop the finished animations before we re-add the
    // classes, otherwise the second chest can come back already "open".
    void this.boxEl.offsetWidth;
  }

  /** 3-2-1. Short on purpose: anticipation, not a wait. */
  async _runCountdown() {
    for (const step of ['3', '2', '1']) {
      this.countdownEl.textContent = step;
      this.countdownEl.classList.remove('is-visible');
      void this.countdownEl.offsetWidth; // restart the animation each time
      this.countdownEl.classList.add('is-visible');
      await wait(650);
    }
    this.countdownEl.classList.remove('is-visible');
  }

  /** The lid swings open, light pours out, sparkles scatter. */
  async _openChest() {
    if (this._isBusy) return; // ignore double-taps
    this._isBusy = true;
    const token = this._runToken;

    try {
      this.audio.chest();
      this.boxEl.classList.add('is-open');
      await wait(260);
      if (token !== this._runToken) return;

      this.beamEl.classList.add('is-shining');
      this._scatterSparkles(14);
      await wait(900);
      if (token !== this._runToken) return;

      this.boxEl.classList.add('is-gone');
      await wait(400);
      if (token !== this._runToken) return;

      this._renderCards();
      this.cardsEl.classList.add('is-visible');
    } finally {
      // Whatever happened above, the scene stays usable.
      this._isBusy = false;
    }
  }

  /**
   * Sparkles are made here rather than in the markup so their positions
   * differ every time — repeating the exact same burst reads as canned.
   */
  _scatterSparkles(count) {
    this.sparklesEl.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const sparkEl = document.createElement('span');
      sparkEl.className = 'sparkle';
      sparkEl.style.left = `${20 + Math.random() * 60}%`;
      sparkEl.style.setProperty('--drift', `${(Math.random() - 0.5) * 90}px`);
      sparkEl.style.setProperty('--rise', `${70 + Math.random() * 80}px`);
      sparkEl.style.animationDelay = `${Math.random() * 0.5}s`;
      this.sparklesEl.appendChild(sparkEl);
    }
  }

  /** Three face-down cards. What's on them stays hidden until one is picked. */
  _renderCards() {
    const gifts = this.giftManager.pickGifts(3);
    this.cardsEl.innerHTML = '';

    gifts.forEach((gift, i) => {
      const cardEl = document.createElement('button');
      cardEl.className = 'reward-card';
      cardEl.style.animationDelay = `${i * 0.12}s`;
      cardEl.setAttribute('aria-label', 'Обрати картку');
      cardEl.innerHTML = `
        <span class="reward-card__inner">
          <span class="reward-card__face reward-card__back">?</span>
          <span class="reward-card__face reward-card__front">${icon(gift.icon)}</span>
        </span>
      `;
      cardEl.addEventListener('click', () => this._chooseGift(gift, cardEl));
      this.cardsEl.appendChild(cardEl);
    });
  }

  /**
   * The chosen card flips, the others bow out, and then — nothing, for a
   * moment. That silence before the gift appears is doing more work than
   * any animation in this scene.
   */
  async _chooseGift(gift, cardEl) {
    if (this._isBusy) return;
    this._isBusy = true;
    const token = this._runToken;

    try {
      this.giftManager.claim(gift.id);

      this.cardsEl.querySelectorAll('.reward-card').forEach((el) => {
        if (el !== cardEl) el.classList.add('is-dismissed');
      });

      this.audio.tap();
      cardEl.classList.add('is-chosen');
      await wait(700); // let the flip land
      if (token !== this._runToken) return;

      this.cardsEl.classList.remove('is-visible');
      await wait(900); // the cinematic pause
      if (token !== this._runToken) return;

      this.revealIconEl.innerHTML = icon(gift.icon);
      this.revealTitleEl.textContent = gift.title;
      this.revealMessageEl.textContent = gift.message;
      this.revealEl.classList.add('is-visible');
      this.mickey.play(MICKEY_STATES.CELEBRATE);
    } finally {
      this._isBusy = false;
    }
  }

  _finish() {
    const finishedAdventure = this._adventureId;
    if (finishedAdventure) {
      this.saveManager.markCompleted(finishedAdventure);
    }
    return this.sceneManager.goTo(SCENES.ISLAND, { returningFrom: finishedAdventure });
  }
}
