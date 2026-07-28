import { AFTER_CREDITS_LINE } from '../data/dialogs.js';
import { wait } from '../utils/typewriter.js';
import { debugLog } from '../utils/debugLog.js';

/**
 * FinaleScene — the little scene after the screen has gone dark
 * -------------------------------------------------------------
 * The game is, as far as the player can tell, already over: the journal
 * closed, the camera pulled back, everything faded out. Then the island
 * comes back one last time, very small and far away, Mickey turns and
 * waves, and the constellation they drew themselves flares once
 * overhead before everything settles into the sound of the sea.
 *
 * No button, no prompt, nothing to do. This beat only asks to be
 * watched, which is exactly why it's worth having.
 */
export class FinaleScene {
  /** @param {HTMLElement} sceneEl */
  constructor(sceneEl, audio) {
    this.sceneEl = sceneEl;
    this.audio = audio;

    this.worldEl = sceneEl.querySelector('#finale-world');
    this.starfieldEl = sceneEl.querySelector('#finale-starfield');
    this.constellationEl = sceneEl.querySelector('#finale-constellation');
    this.lastLineEl = sceneEl.querySelector('#finale-last-line');
    this.mickeyEl = sceneEl.querySelector('#finale-mickey');

    this._runToken = 0;
  }

  async enter() {
    try {
      await this._enterInner();
    } catch (err) {
      // Nothing follows this scene, so a failure here can't strand the
      // player anywhere — but it should still be visible in the console
      // rather than vanishing as an unhandled rejection.
      console.error('FinaleScene.enter() failed partway through:', err);
    }
  }

  async _enterInner() {
    const token = ++this._runToken;
    this._resetVisualState();
    this._scatterStars(60);

    // A moment of genuine darkness first — the player should believe it
    // really has ended before it comes back.
    await wait(1800);
    if (token !== this._runToken) return;

    this.worldEl.classList.add('is-visible');
    await wait(2200);
    if (token !== this._runToken) return;

    // Mickey turns and waves from the horizon.
    this.mickeyEl.classList.add('is-waving');
    await wait(1200);
    if (token !== this._runToken) return;

    // The constellation they drew flares overhead.
    this.constellationEl.classList.add('is-visible');
    this.audio.islandChord();
    await wait(1600);
    if (token !== this._runToken) return;

    this.lastLineEl.textContent = AFTER_CREDITS_LINE;
    this.lastLineEl.classList.add('is-visible');
    await wait(4500);
    if (token !== this._runToken) return;

    // The constellation and the words fade — but the island itself
    // stays. No menu, no button, no prompt: the player is simply left
    // in the world for as long as they want it, with the waves moving,
    // the stars twinkling and Mickey there on the horizon. Ending on
    // something still alive is the whole point; a fade to black would
    // close the door on exactly the feeling the game spent 15 minutes
    // building.
    this.constellationEl.classList.remove('is-visible');
    this.lastLineEl.classList.remove('is-visible');
    await wait(2600);
    if (token !== this._runToken) return;

    this.mickeyEl.classList.add('is-waving');
    debugLog('[Finale] the island is now the player\'s to sit with');
  }

  async exit() {
    this._runToken += 1;
  }

  _resetVisualState() {
    this.worldEl.classList.remove('is-visible');
    this.constellationEl.classList.remove('is-visible');
    this.lastLineEl.classList.remove('is-visible');
    this.lastLineEl.textContent = '';
    this.mickeyEl.classList.remove('is-waving');
    this.starfieldEl.innerHTML = '';
  }

  _scatterStars(count) {
    this.starfieldEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'finale-star';
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 70}%`;
      el.style.animationDelay = `${Math.random() * 5}s`;
      el.style.animationDuration = `${3 + Math.random() * 4}s`;
      this.starfieldEl.appendChild(el);
    }
  }
}
