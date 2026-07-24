import {
  LOADING_CAPTIONS,
  INTRO_GREETING,
  INTRO_EXPLANATION,
  REGISTRATION,
  TEAM_NAME_REACTIONS,
  INTRO_FINISH,
} from '../data/dialogs.js';
import { MICKEY_STATES } from '../config/constants.js';
import { wait } from '../utils/typewriter.js';
import { Camera } from './Camera.js';

/**
 * IntroSequence
 * -------------
 * The opening ~90 seconds, played as one continuous arrival.
 *
 * Deliberately NOT a scene: it runs ON the island rather than replacing it.
 * The camera pans the real island, the real Mickey walks in, and the real
 * boxes grow out of the real sand. Building a separate intro backdrop would
 * have meant a second copy of the whole island to keep in sync.
 *
 * The sequence reads top-to-bottom in play() — each stage awaits the last,
 * so the pacing is visible in the code instead of buried in callbacks.
 */
export class IntroSequence {
  /**
   * @param {import('../components/Mickey.js').Mickey} mickey
   * @param {import('./SaveManager.js').SaveManager} saveManager
   */
  constructor(mickey, saveManager, audio) {
    this.mickey = mickey;
    this.saveManager = saveManager;
    this.audio = audio;

    this.rootEl = document.getElementById('intro');
    this.veilEl = document.getElementById('intro-veil');
    this.captionEl = document.getElementById('intro-caption');
    this.titleCardEl = document.getElementById('intro-titlecard');
    this.startBtn = document.getElementById('intro-start-btn');
    this.scrollWrapEl = document.getElementById('intro-scroll');
    this.titleEl = document.getElementById('scroll-title');
    this.inputEl = document.getElementById('team-name-input');
    this.registeredEl = document.getElementById('scroll-registered');
    this.stampEl = document.getElementById('stamp');
    this.buttonEl = document.getElementById('start-adventure');
    this.buttonLabelEl = document.getElementById('start-adventure-label');

    this.islandEl = document.getElementById('scene-island');
    this.boxesEl = this.islandEl.querySelector('.boxes');
    this.camera = new Camera(this.islandEl);

    this._fillStaticText();
  }

  _fillStaticText() {
    this.titleEl.textContent = REGISTRATION.title;
    this.inputEl.placeholder = REGISTRATION.placeholder;
    this.buttonLabelEl.textContent = REGISTRATION.button;
    this.registeredEl.textContent = REGISTRATION.registered;
    document.getElementById('stamp-text').textContent = REGISTRATION.stamp;
  }

  /** Runs the whole opening. Resolves once the island is handed over. */
  async play() {
    this._prepareStage();

    await this._stageDawn();
    await this._stageWorldBreathes();
    await this._stageMickeyArrives();
    await this._stageTitleCard();
    await this._stageGreeting();
    await this._stageRegistration();
    await this._stageTour();
    await this._stageBoxesGrow();

    this._finish();
  }

  /** Island starts empty and dark: no Mickey, no boxes, camera pulled in close. */
  _prepareStage() {
    this.boxesEl.classList.add('is-hidden');

    // Put him off-stage instantly. Without killing the transition first he'd
    // glide out of frame from his resting spot, which looks like a bug.
    this.mickey.el.style.transition = 'none';
    this.mickey.el.style.opacity = '0';
    this.mickey.el.style.left = '-15%';
    this.mickey.el.style.top = '70%';
    this.mickey.el.style.bottom = 'auto';
    void this.mickey.el.offsetWidth; // force the jump to apply now
    this.mickey.el.style.transition = '';
    this.camera.focus({ scale: 1.15, x: '0%', y: '2%' });
  }

  /**
   * Stage 1 — the world loads in.
   * Light comes up first, then the captions tick over. Not a progress bar:
   * the point is anticipation, not information.
   */
  async _stageDawn() {
    await wait(600);
    this.veilEl.classList.add('is-lifting');

    for (const caption of LOADING_CAPTIONS) {
      this.captionEl.textContent = caption;
      this.captionEl.classList.add('is-visible');
      await wait(700);
      this.captionEl.classList.remove('is-visible');
      await wait(220);
    }
  }

  /**
   * Stage 2 — nothing happens on purpose.
   * The waves, palms and clouds are already moving; this pause is what makes
   * it feel like a place you've arrived at rather than a screen that loaded.
   */
  async _stageWorldBreathes() {
    this.camera.reset();
    await wait(2600);
  }

  /** Stage 3 — Mickey walks in from the left, spots the guests, lights up. */
  async _stageMickeyArrives() {
    this.mickey.el.style.opacity = '1';
    this.mickey.play(MICKEY_STATES.RUN);
    this.mickey.el.style.left = '48%';
    await wait(1500); // matches --duration-walk in variables.css

    this.mickey.play(MICKEY_STATES.IDLE);
    await wait(600);

    // He notices them: ears up, eyes wide.
    this.mickey.play(MICKEY_STATES.SURPRISE);
    await wait(900);
  }

  /**
   * Stage 3.5 — the title card. A proper "movie title" beat: the game's
   * name over the island, held until the player taps to begin. That tap is
   * also the first real user gesture on the page, so it's the natural place
   * to unlock audio — cleaner than reacting to just any tap anywhere.
   */
  async _stageTitleCard() {
    this.mickey.play(MICKEY_STATES.IDLE);
    this.titleCardEl.classList.add('is-visible');

    await this._waitForStart();

    this.audio.unlock();
    this.titleCardEl.classList.remove('is-visible');
    await wait(500);
  }

  /** Resolves once the player taps the title card's start button. */
  _waitForStart() {
    return new Promise((resolve) => {
      this.startBtn.addEventListener('click', () => resolve(), { once: true });
    });
  }

  /** Stage 4 & 5 — he says hello, then explains, one typed line at a time. */
  async _stageGreeting() {
    this.mickey.play(MICKEY_STATES.HAPPY);

    for (const line of INTRO_GREETING) {
      await this.mickey.sayTyped(line);
    }

    this.mickey.play(MICKEY_STATES.IDLE);

    for (const line of INTRO_EXPLANATION) {
      await this.mickey.sayTyped(line);
    }

    this.mickey.hush();
    await wait(400);
  }

  /**
   * Stage 6 — the scroll. The button only appears once there's a name, so
   * nobody can skip past the part that makes them a team.
   */
  async _stageRegistration() {
    this.scrollWrapEl.classList.add('is-visible');
    await wait(700);
    this.inputEl.focus();

    await this._waitForTeamName();

    const teamName = this.inputEl.value.trim();
    this.saveManager.setTeamName(teamName);

    // He reads it back, so it feels like he actually looked at the scroll.
    const reaction = TEAM_NAME_REACTIONS[Math.floor(Math.random() * TEAM_NAME_REACTIONS.length)];
    await this.mickey.sayTyped(`«${teamName}»?`, 600);
    await this.mickey.sayTyped(reaction, 900);
    this.mickey.hush();

    // Stamped and official.
    this.inputEl.blur();
    this.inputEl.disabled = true;
    this.registeredEl.classList.add('is-visible');
    await wait(400);
    this.audio.stamp();
    this.stampEl.classList.add('is-stamped');
    await wait(1200);

    this.scrollWrapEl.classList.remove('is-visible');
    await wait(700);
  }

  /**
   * Resolves when the player has typed a name and pressed the wooden button.
   * The button stays hidden until the field has something in it.
   */
  _waitForTeamName() {
    return new Promise((resolve) => {
      const refreshButton = () => {
        const hasName = this.inputEl.value.trim().length > 0;
        this.buttonEl.classList.toggle('is-visible', hasName);
      };

      const submit = () => {
        if (this.inputEl.value.trim().length === 0) return;
        this.inputEl.removeEventListener('input', refreshButton);
        this.buttonEl.removeEventListener('click', submit);
        this.buttonEl.classList.remove('is-visible');
        resolve();
      };

      this.inputEl.addEventListener('input', refreshButton);
      this.buttonEl.addEventListener('click', submit);
      this.inputEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') submit();
      });
    });
  }

  /**
   * Stage 7 — the tour. Mickey points, and the camera drifts across the
   * island: lagoon on the left, mountain in the middle, bazaar on the right.
   */
  async _stageTour() {
    this.mickey.play(MICKEY_STATES.POINT);
    await wait(500);

    this.camera.focus({ scale: 1.35, x: '16%', y: '-4%' }); // lagoon side
    await wait(2000);

    this.camera.focus({ scale: 1.35, x: '0%', y: '-8%' }); // the mountain path
    await wait(2000);

    this.camera.focus({ scale: 1.35, x: '-16%', y: '-4%' }); // bazaar side
    await wait(2000);

    this.camera.reset(); // back to the clearing
    await wait(1800);
  }

  /** Stage 8 — the boxes push up out of the sand, one after another. */
  async _stageBoxesGrow() {
    this.mickey.play(MICKEY_STATES.HAPPY);
    this.boxesEl.classList.remove('is-hidden');
    this.boxesEl.classList.add('is-revealing');

    await this.mickey.sayTyped(INTRO_FINISH, 1200);
    this.mickey.hush();
    this.mickey.play(MICKEY_STATES.IDLE);
  }

  /** Hand the island over: overlay out of the way, Mickey back to normal. */
  _finish() {
    this.rootEl.classList.add('is-done');
    this.mickey.el.style.opacity = '';
    this.boxesEl.classList.remove('is-revealing');
  }

}
