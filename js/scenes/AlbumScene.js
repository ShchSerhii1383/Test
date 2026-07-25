import { GIFTS } from '../data/gifts.js';
import { ALBUM_INTRO, SECRET_BONUS } from '../data/dialogs.js';
import { SCENES } from '../config/constants.js';
import { icon } from '../components/icons.js';

/**
 * AlbumScene
 * ----------
 * Shows a quiet recap: the gifts claimed along the way, and — if the
 * player found the decorative secrets — a small bonus card. No new
 * mechanics here, just a warm look back before the Finale.
 */
export class AlbumScene {
  /**
   * @param {HTMLElement} sceneEl
   * @param {import('../systems/SceneManager.js').SceneManager} sceneManager
   * @param {import('../systems/SaveManager.js').SaveManager} saveManager
   */
  constructor(sceneEl, sceneManager, saveManager) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.saveManager = saveManager;

    this.introEl = sceneEl.querySelector('#album-intro');
    this.gridEl = sceneEl.querySelector('#album-grid');
    this.bonusEl = sceneEl.querySelector('#album-bonus');
    this.bonusIconEl = sceneEl.querySelector('#album-bonus-icon');
    this.bonusTitleEl = sceneEl.querySelector('#album-bonus-title');
    this.bonusMessageEl = sceneEl.querySelector('#album-bonus-message');
    this.continueBtn = sceneEl.querySelector('#album-continue');

    this.continueBtn.addEventListener('click', () => this.sceneManager.goTo(SCENES.FINALE));
  }

  async enter() {
    try {
      await this._enterInner();
    } catch (err) {
      console.error('AlbumScene.enter() failed partway through:', err);
    }
  }

  async _enterInner() {
    this.introEl.textContent = ALBUM_INTRO;
    this._renderGifts();
    this._renderBonus();
  }


  _renderGifts() {
    this.gridEl.innerHTML = '';
    const claimedIds = this.saveManager.claimedGifts;
    const claimedGifts = GIFTS.filter((g) => claimedIds.includes(g.id));

    claimedGifts.forEach((gift, i) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'album-card';
      cardEl.style.animationDelay = `${i * 0.15}s`;
      cardEl.innerHTML = `
        <div class="album-card__icon">${icon(gift.icon)}</div>
        <div class="album-card__title">${gift.title}</div>
      `;
      this.gridEl.appendChild(cardEl);
    });
  }

  _renderBonus() {
    if (!this.saveManager.hasSecretBonus) return;

    this.bonusIconEl.innerHTML = icon(SECRET_BONUS.icon);
    this.bonusTitleEl.textContent = SECRET_BONUS.title;
    this.bonusMessageEl.textContent = SECRET_BONUS.message;
    this.bonusEl.hidden = false;
  }
}
