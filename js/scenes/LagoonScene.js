import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { SCENES } from '../config/constants.js';

/**
 * LagoonScene
 * -----------
 * The treasure-hunt mini-game. Not a test of skill — just a small,
 * quick "win" moment. Player taps circles on the water until they find
 * the one hiding the treasure; every miss gets a friendly nudge.
 *
 * On success, hands off to RewardScene via SceneManager.
 */
export class LagoonScene {
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
    this.config = ADVENTURE_CONFIG.lagoon;

    this.introEl = sceneEl.querySelector('#lagoon-intro');
    this.introTextEl = sceneEl.querySelector('#lagoon-intro-text');
    this.spotsContainerEl = sceneEl.querySelector('#lagoon-spots');
    this.backBtn = sceneEl.querySelector('#lagoon-back');

    this.backBtn.addEventListener('click', () => this.sceneManager.goTo(SCENES.ISLAND));
  }

  /** Called by SceneManager right before this scene becomes visible. */
  async enter() {
    this.introTextEl.textContent = this.config.intro;
    this.introEl.classList.remove('is-hidden');

    this._renderSpots();

    // Give the player a moment to read the intro before it fades.
    setTimeout(() => {
      this.introEl.classList.add('is-hidden');
    }, 2200);
  }

  async exit() {
    this.spotsContainerEl.innerHTML = '';
  }

  _renderSpots() {
    this.spotsContainerEl.innerHTML = '';
    const winnerIndex = Math.floor(Math.random() * this.config.spotCount);

    // Positions kept away from the very edges so spots are easy to tap
    // one-handed on a small phone.
    const positions = this._generatePositions(this.config.spotCount);

    positions.forEach((pos, i) => {
      const spotEl = document.createElement('button');
      spotEl.className = 'lagoon-spot';
      spotEl.style.left = `${pos.x}%`;
      spotEl.style.top = `${pos.y}%`;
      spotEl.setAttribute('aria-label', 'Копай тут');

      spotEl.addEventListener('click', () => this._handleTap(i === winnerIndex, spotEl));
      this.spotsContainerEl.appendChild(spotEl);
    });
  }

  /** Scatter spots in a loose grid with randomness, avoiding screen edges. */
  _generatePositions(count) {
    const positions = [];
    const cols = 3;
    const rows = Math.ceil(count / cols);

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jitterX = (Math.random() - 0.5) * 10;
      const jitterY = (Math.random() - 0.5) * 8;

      positions.push({
        x: 20 + col * 30 + jitterX,
        y: 30 + row * 22 + jitterY,
      });
    }
    return positions;
  }

  _handleTap(isWinner, spotEl) {
    if (isWinner) {
      spotEl.classList.add('is-found');
      this.audio.win();
      this.mickey.say(this.config.winLine);
      // Small pause so the win animation/line registers before leaving.
      setTimeout(() => {
        this.sceneManager.goTo(SCENES.REWARD, { adventureId: 'lagoon' });
      }, 900);
    } else {
      this.audio.nudge();
      const lines = this.config.missLines;
      this.mickey.say(lines[Math.floor(Math.random() * lines.length)], 1200);
      spotEl.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)' },
          { transform: 'translate(-50%, -50%) scale(0.85)' },
          { transform: 'translate(-50%, -50%) scale(1)' },
        ],
        { duration: 250, easing: 'ease-in-out' }
      );
    }
  }
}
