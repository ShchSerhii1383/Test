import { Box } from '../components/Box.js';
import { Camera } from '../systems/Camera.js';
import { MICKEY_STATES, SCENES } from '../config/constants.js';

const ADVENTURE_ORDER = ['lagoon', 'mountain', 'bazaar'];

/**
 * IslandScene
 * -----------
 * The central hub. Responsible only for:
 * - the background (handled entirely by CSS, nothing to do here)
 * - Mickey (including his wandering around the island)
 * - the adventure boxes
 * - decorative secrets (shell, coconut — no effect on the game, but
 *   finding both quietly unlocks a small bonus shown later in the Album)
 * - the lighthouse, which appears once every adventure is done and leads
 *   onward to the Album
 * - launching adventures when a box is tapped
 *
 * It does NOT know how mini-games work internally — it just asks the
 * SceneManager to go somewhere else when a box or the lighthouse is tapped.
 */
export class IslandScene {
  /**
   * @param {HTMLElement} sceneEl
   * @param {import('../systems/SceneManager.js').SceneManager} sceneManager
   * @param {import('../components/Mickey.js').Mickey} mickey
   * @param {import('../systems/SaveManager.js').SaveManager} saveManager
   */
  constructor(sceneEl, sceneManager, mickey, saveManager, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.mickey = mickey;
    this.saveManager = saveManager;
    this.audio = audio;

    this.boxes = Array.from(sceneEl.querySelectorAll('.box')).map((el) => {
      const box = new Box(el);
      box.onTap((adventureId) => this.handleBoxTap(adventureId, box));
      return box;
    });

    // Plants that appear one by one as adventures are completed
    this.growthEls = Array.from(sceneEl.querySelectorAll('.growth'));

    this.lighthouseEl = sceneEl.querySelector('#lighthouse');
    this.lighthouseEl.addEventListener('click', () => {
      this.audio.tap();
      this.sceneManager.goTo(SCENES.ALBUM);
    });

    this.camera = new Camera(sceneEl);

    // Loose spots for Mickey to wander to between boxes — kept inside the
    // island's safe area, away from the very edges of the screen.
    this._wanderSpots = [
      { left: '30%', top: '68%' },
      { left: '55%', top: '72%' },
      { left: '65%', top: '60%' },
      { left: '40%', top: '75%' },
    ];
    this._wanderTimer = null;

    // Tracks which decorative secrets have been found this session,
    // so we know when both are found and can unlock the Album bonus.
    this._foundSecrets = new Set();
    this._bindSecrets();

    this._hasGreeted = false;
    this._justReturnedFrom = null;
  }

  /** Called by SceneManager right before this scene becomes visible. */
  async enter(data = {}) {
    this._syncBoxesWithSave();

    if (data.fromIntro) {
      // The opening sequence is about to play on this island. It handles
      // Mickey and the boxes itself, so we stay out of its way and wait
      // for beginLife() to be called when it's finished.
      this._hasGreeted = true;
      return;
    }

    if (data.returningFrom) {
      // Coming back from a finished adventure: Mickey runs over and cheers,
      // rather than just silently being back where he was.
      this._justReturnedFrom = data.returningFrom;
      this.mickey.play(MICKEY_STATES.RUN);
      this.mickey.say('Молодці!', 1800);
      setTimeout(() => this.mickey.play(MICKEY_STATES.IDLE), 1200);
      this._startWandering();
      return;
    }

    if (!this._hasGreeted) {
      this._hasGreeted = true;
      // The "moment of silence": nothing happens for a couple of seconds.
      // Just the ambient island — waves, palms, Mickey looking around.
      // Only after that does he wave and say hello.
      await this._wait(2400);
      this.mickey.play(MICKEY_STATES.WAVE);
      this.mickey.say('Ласкаво просимо на Secret Island!', 3000);
      setTimeout(() => this.mickey.play(MICKEY_STATES.IDLE), 1400);
    } else {
      this.mickey.play(MICKEY_STATES.IDLE);
    }

    this._startWandering();
  }

  async exit() {
    clearTimeout(this._wanderTimer);
    clearTimeout(this._gestureTimer);
  }

  /**
   * Called once the opening sequence has finished and the island is the
   * player's to explore. Everything the intro suppressed starts here.
   */
  beginLife() {
    this._startWandering();
  }

  /** Reflect completed adventures from SaveManager onto the box visuals. */
  _syncBoxesWithSave() {
    this.boxes.forEach((box) => {
      if (this.saveManager.isCompleted(box.adventureId)) {
        box.markCompleted();
        return;
      }

      const orderIndex = ADVENTURE_ORDER.indexOf(box.adventureId);
      const previousId = ADVENTURE_ORDER[orderIndex - 1];
      const isFirst = orderIndex === 0;
      const previousDone = !previousId || this.saveManager.isCompleted(previousId);

      if ((isFirst || previousDone) && box.isLocked) {
        box.enable();
      }
    });

    this._syncGrowth();

    if (this.saveManager.hasCompletedAll(ADVENTURE_ORDER)) {
      this.lighthouseEl.hidden = false;
      // Small delay so it doesn't pop in the instant the box marks complete.
      requestAnimationFrame(() => this.lighthouseEl.classList.add('is-visible'));
    }
  }

  /**
   * One more plant for each adventure finished. Called on every entry, so
   * a plant that appeared earlier simply stays — only the newest one
   * animates in, which is what makes it feel like the island responding.
   */
  _syncGrowth() {
    const finished = this.saveManager.completedCount;
    this.growthEls.forEach((el, i) => {
      el.classList.toggle('is-grown', i < finished);
    });
  }

  handleBoxTap(adventureId, box) {
    if (box.isLocked) {
      this.audio.nudge();
      box.shake();
      this.mickey.say('Спочатку інші пригоди!');
      return;
    }

    if (box.el.classList.contains('box--completed')) {
      this.audio.tap();
      this.mickey.say('Цю пригоду вже пройдено!');
      return;
    }

    // Every real adventure now has its own scene.
    const adventureScenes = {
      lagoon: SCENES.LAGOON,
      mountain: SCENES.MOUNTAIN,
      bazaar: SCENES.BAZAAR,
    };

    this.audio.tap();
    this._runToBoxThenGo(box, adventureScenes[adventureId]);
  }

  /**
   * The warm transition into an adventure: Mickey stops wandering, runs
   * over to the tapped box, "dives in", and only then do we fade to the
   * next scene. Keeps the island feeling like one continuous place rather
   * than a level-select screen that just swaps out.
   */
  async _runToBoxThenGo(box, sceneName) {
    clearTimeout(this._wanderTimer);

    const spot = this._positionRelativeToIsland(box.el);

    // The camera drifts in toward the box, the same way it does during the
    // intro's tour — so stepping into an adventure feels like moving
    // through the island rather than a screen being swapped out.
    this.camera.focus({
      scale: 1.2,
      x: `${(50 - spot.left) * 0.4}%`,
      y: `${(50 - spot.top) * 0.25}%`,
    });

    this.mickey.play(MICKEY_STATES.HAPPY);
    this.mickey.el.style.left = `${spot.left}%`;
    this.mickey.el.style.top = `${spot.top}%`;
    this.mickey.el.style.bottom = 'auto';

    // Wait for his feet to actually get there. Must stay in step with
    // --duration-walk in variables.css, or he dives before he arrives.
    await this._wait(1500);

    this.mickey.el.classList.add('mickey--diving');
    await this._wait(500);

    this.sceneManager.goTo(sceneName);
    this.camera.reset();

    // Reset for next time we're back on the island.
    this.mickey.el.classList.remove('mickey--diving');
  }

  /** Convert a box's pixel position into percentages relative to the island layer, for Mickey to walk to. */
  _positionRelativeToIsland(boxEl) {
    const islandRect = this.sceneEl.getBoundingClientRect();
    const boxRect = boxEl.getBoundingClientRect();

    const centerX = boxRect.left + boxRect.width / 2 - islandRect.left;
    const centerY = boxRect.top + boxRect.height / 2 - islandRect.top;

    return {
      left: (centerX / islandRect.width) * 100,
      top: (centerY / islandRect.height) * 100,
    };
  }

  /**
   * Mickey wanders to a random nearby spot every so often, so the island
   * never feels frozen even when the player isn't doing anything.
   */
  _startWandering() {
    clearTimeout(this._wanderTimer);

    const wander = () => {
      const spot = this._wanderSpots[Math.floor(Math.random() * this._wanderSpots.length)];
      this.mickey.el.style.left = spot.left;
      this.mickey.el.style.top = spot.top;
      this.mickey.el.style.bottom = 'auto';

      this._wanderTimer = setTimeout(wander, 6000 + Math.random() * 4000);
    };

    this._wanderTimer = setTimeout(wander, 5000 + Math.random() * 3000);

    this._startIdleGestures();
  }

  /**
   * Small, purely decorative gestures — a glance to one side, a hat nudge —
   * layered on top of idle so standing still never reads as frozen. These
   * never fire outside the idle state, so they can't collide with a real
   * animation like running or celebrating.
   */
  _startIdleGestures() {
    clearTimeout(this._gestureTimer);

    const gesture = () => {
      if (this.mickey.el.classList.contains('mickey--idle')) {
        const direction = Math.random() < 0.5 ? '-1' : '1';
        this.mickey.el.style.setProperty('--glance-dir', direction);
        this.mickey.el.classList.add('is-glancing');
        setTimeout(() => this.mickey.el.classList.remove('is-glancing'), 1400);
      }

      this._gestureTimer = setTimeout(gesture, 4000 + Math.random() * 5000);
    };

    this._gestureTimer = setTimeout(gesture, 3000 + Math.random() * 3000);
  }

  /** Decorative secrets: shell sings, coconut wobbles. No effect on progress — */
  /** except that finding both quietly unlocks a small bonus shown in the Album. */
  _bindSecrets() {
    const shell = this.sceneEl.querySelector('#secret-shell');
    const coconut = this.sceneEl.querySelector('#secret-coconut');

    shell?.addEventListener('click', () => this._triggerSecret(shell, 'shell'));
    coconut?.addEventListener('click', () => this._triggerSecret(coconut, 'coconut'));
  }

  _triggerSecret(el, secretId) {
    this.audio.tap();
    el.classList.remove('is-triggered');
    void el.offsetWidth; // restart animation if tapped again quickly
    el.classList.add('is-triggered');

    this._foundSecrets.add(secretId);
    if (this._foundSecrets.size === 2 && !this.saveManager.hasSecretBonus) {
      this.saveManager.setSecretBonus(true);
    }
  }

  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
