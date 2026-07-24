import { FINALE_WISH } from '../data/dialogs.js';
import { Confetti } from '../systems/Confetti.js';
import { wait } from '../utils/typewriter.js';

/**
 * FinaleScene
 * -----------
 * The closing moment: sunset, Mickey celebrating, a warm wish, confetti.
 *
 * Only ever reached through the Album, once every adventure is done — so
 * this scene doesn't check anything, it just plays the ending.
 */
export class FinaleScene {
  /** @param {HTMLElement} sceneEl */
  constructor(sceneEl, audio) {
    this.sceneEl = sceneEl;
    this.audio = audio;
    this.titleEl = sceneEl.querySelector('#finale-title');
    this.messageEl = sceneEl.querySelector('#finale-message');
    this.cardEl = sceneEl.querySelector('.finale-card');

    this.confetti = new Confetti(sceneEl.querySelector('#confetti-canvas'));
    this._hasPlayed = false;
  }

  async enter() {
    this.titleEl.textContent = FINALE_WISH.title;
    this.messageEl.textContent = FINALE_WISH.message;

    if (this._hasPlayed) return;
    this._hasPlayed = true;

    // A beat of just the sunset before anything happens — the same instinct
    // as the island's moment of silence. Let the ending land before the party.
    await wait(900);
    this.audio.fanfare();
    this.confetti.burst(90);

    await wait(700);
    this.confetti.burst(50, 0.4);
  }
}
