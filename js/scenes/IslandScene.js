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
    this.lighthouseEl.addEventListener('click', async () => {
      if (this._isTransitioning) return;
      this._isTransitioning = true;
      this.audio.tap();
      await this.sceneManager.goTo(SCENES.ALBUM);
      this._isTransitioning = false;
    });

    this.camera = new Camera(sceneEl);
    this.landEl = sceneEl.querySelector('.land');

    // Loose spots for Mickey to wander to between boxes — kept inside the
    // island's safe area. Bottom-anchored (not top): combined with his
    // percentage-based height, that guarantees he's never taller than the
    // remaining room above him, so he can't get clipped by .land's
    // overflow:hidden on any screen shape.
    this._wanderSpots = [
      { left: '30%', bottom: '8%' },
      { left: '55%', bottom: '5%' },
      { left: '65%', bottom: '14%' },
      { left: '40%', bottom: '4%' },
    ];
    this._wanderTimer = null;

    // Tracks which decorative secrets have been found this session,
    // so we know when both are found and can unlock the Album bonus.
    this._foundSecrets = new Set();
    this._bindSecrets();

    this._hasGreeted = false;
    this._justReturnedFrom = null;

    // Which boxes have actually appeared this session. A box being
    // "unlockable" per save data and a box having played its materialize
    // cinematic are different things — the second and third box must stay
    // completely invisible (not even dimmed/locked-looking) until the
    // moment they're meant to dramatically appear.
    this._materializedBoxes = new Set();

    // True while Mickey is mid-run toward a box (or the lighthouse is
    // being tapped) — blocks a second tap from firing a second, competing
    // scene transition while the first is still under way.
    this._isTransitioning = false;
  }

  /** Called by SceneManager right before this scene becomes visible. */
  async enter(data = {}) {
    try {
      await this._enterInner(data);
    } catch (err) {
      // A bug in one stage should never leave the whole island stuck and
      // silent — log it, and make sure the player can still do something.
      console.error('IslandScene.enter() failed partway through:', err);
      this._startWandering();
    }
  }

  async _enterInner(data) {
    this._isTransitioning = false;

    // Defensive safety net, same reasoning as RewardScene: an adventure's
    // own input-guard should already clear itself on exit(), but this is
    // the one place a leftover guard would be most damaging (it would
    // silently swallow every future box tap) — so clear all of them here
    // too, regardless of whether that already happened upstream.
    document.querySelectorAll('.adventure-input-guard').forEach((el) => {
      el.classList.remove('is-active');
    });

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

      this._isTransitioning = true;
      await this._revealNextBoxIfAny(data.returningFrom);
      this._isTransitioning = false;
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
    // The intro already grew Lagoon's box out of the sand itself — this
    // just tells IslandScene it doesn't need to do that again.
    this._materializedBoxes.add('lagoon');
    this._startWandering();
  }

  /**
   * Reflect completed adventures onto the box visuals. Crucially, this
   * does NOT reveal or enable a box just because its prerequisite is
   * done — that would make box 2 or 3 pop into existence the instant
   * _syncBoxesWithSave() runs, before the camera has even traveled there.
   * A not-yet-materialized box is left completely alone: invisible,
   * locked, no shadow, nothing — exactly as if it doesn't exist yet.
   */
  _syncBoxesWithSave() {
    this.boxes.forEach((box) => {
      if (this.saveManager.isCompleted(box.adventureId)) {
        box.markCompleted();
        this._materializedBoxes.add(box.adventureId);
        return;
      }

      // If this box already played its materialize cinematic earlier this
      // session (including the very first one, added in beginLife()),
      // keep it visible/enabled on every later visit — this just re-applies
      // that state, it never triggers the reveal itself.
      if (this._materializedBoxes.has(box.adventureId) && box.isLocked) {
        box.enable();
      }
    });

    this._syncGrowth();
    this._syncDayStage();

    if (this.saveManager.hasCompletedAll(ADVENTURE_ORDER)) {
      this.lighthouseEl.hidden = false;
      // Small delay so it doesn't pop in the instant the box marks complete.
      requestAnimationFrame(() => this.lighthouseEl.classList.add('is-visible'));
    }
  }

  /**
   * The island moves through the day as the adventures get finished —
   * morning at the start, afternoon after Lagoon, sunset after Mountain,
   * night once everything is done. One class on the scene root; every
   * color everywhere else already reads from CSS custom properties, so
   * this is the only place that needs to know the stage exists.
   */
  _syncDayStage() {
    const completedCount = ADVENTURE_ORDER.filter((id) => this.saveManager.isCompleted(id)).length;
    const stageNames = ['morning', 'afternoon', 'sunset', 'night'];
    const stage = stageNames[Math.min(completedCount, stageNames.length - 1)];

    stageNames.forEach((s) => this.sceneEl.classList.remove(`day-stage--${s}`));
    this.sceneEl.classList.add(`day-stage--${stage}`);
  }

  /**
   * The materialize choreography: camera travels to the next adventure's
   * spot, and only once it arrives does that box appear — light, sound,
   * a bounce out of the sand, a few sparkles. Does nothing if every
   * adventure is already unlocked, or if this box already appeared.
   */
  async _revealNextBoxIfAny(justCompletedId) {
    const index = ADVENTURE_ORDER.indexOf(justCompletedId);
    const nextId = ADVENTURE_ORDER[index + 1];
    if (!nextId || this._materializedBoxes.has(nextId)) return;

    const nextBox = this.boxes.find((b) => b.adventureId === nextId);
    if (!nextBox) return;

    // Let the "Молодці!" moment land before the camera starts moving.
    await this._wait(1400);

    const spot = this._percentOf(nextBox.el, this.sceneEl);
    this.camera.focus({
      scale: 1.3,
      x: `${(50 - spot.left) * 0.4}%`,
      y: `${(50 - spot.top) * 0.25}%`,
    });
    await this._wait(1500);

    this._materializedBoxes.add(nextId);
    await this._materializeBox(nextBox);

    await this._wait(500);
    this.camera.reset();
  }

  /** The actual "appearing out of thin air" moment: glow, sound, grow, sparkle. */
  async _materializeBox(box) {
    this.audio.chest(); // the same warm, magical chime used for opening gifts
    box.el.classList.add('is-revealing', 'is-materializing');
    await this._wait(900);
    box.el.classList.remove('is-materializing');
    box.enable(); // only tappable once it has actually finished appearing
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
    if (this._isTransitioning) return; // already on our way somewhere

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
    this._isTransitioning = true;
    clearTimeout(this._wanderTimer);

    // Two different coordinate spaces on purpose: the camera transforms the
    // whole scene, so its pan amount needs scene-relative percentages. But
    // Mickey is positioned inside .land (only the bottom slice of the
    // scene), so his walk target needs percentages relative to .land
    // instead — using the scene-relative numbers for his inline style was
    // the actual bug behind him ending up in the wrong spot.
    const sceneSpot = this._percentOf(box.el, this.sceneEl);
    const landSpot = this._percentOf(box.el, this.landEl);

    // The camera drifts in toward the box, the same way it does during the
    // intro's tour — so stepping into an adventure feels like moving
    // through the island rather than a screen being swapped out.
    this.camera.focus({
      scale: 1.2,
      x: `${(50 - sceneSpot.left) * 0.4}%`,
      y: `${(50 - sceneSpot.top) * 0.25}%`,
    });

    // Bottom-anchored, and capped: even if a box sits unusually high
    // within .land, Mickey (46% of .land's height) can never be pushed
    // past its top edge and clipped by overflow:hidden.
    const bottomTarget = Math.min(100 - landSpot.top, 50);

    this.mickey.play(MICKEY_STATES.HAPPY);
    this.mickey.el.style.left = `${landSpot.left}%`;
    this.mickey.el.style.bottom = `${bottomTarget}%`;
    this.mickey.el.style.top = 'auto';

    // Wait for his feet to actually get there. Must stay in step with
    // --duration-walk in variables.css, or he dives before he arrives.
    await this._wait(1500);

    this.mickey.el.classList.add('mickey--diving');
    await this._wait(500);

    await this.sceneManager.goTo(sceneName);
    this.camera.reset();
    this._isTransitioning = false;

    // Reset for next time we're back on the island.
    this.mickey.el.classList.remove('mickey--diving');
  }

  /**
   * Convert an element's on-screen position into percentages relative to
   * some other element's box — e.g. "where is this box, as a percentage of
   * .land's own width/height". Used both for the camera (relative to the
   * whole scene) and for Mickey's walk target (relative to .land), which
   * are two different reference frames and must not be mixed up.
   */
  _percentOf(targetEl, referenceEl) {
    const refRect = referenceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const centerX = targetRect.left + targetRect.width / 2 - refRect.left;
    const centerY = targetRect.top + targetRect.height / 2 - refRect.top;

    return {
      left: (centerX / refRect.width) * 100,
      top: (centerY / refRect.height) * 100,
    };
  }

  /**
   * Mickey wanders to a random nearby spot every so often, so the island
   * never feels frozen even when the player isn't doing anything.
   */
  _startWandering() {
    clearTimeout(this._wanderTimer);

    const wander = () => {
      this._dropFootprints(this.mickey.el.style.left, this.mickey.el.style.bottom);

      const spot = this._wanderSpots[Math.floor(Math.random() * this._wanderSpots.length)];
      this.mickey.el.style.left = spot.left;
      this.mickey.el.style.bottom = spot.bottom;
      this.mickey.el.style.top = 'auto';
      this._checkWildlifeReaction();

      this._wanderTimer = setTimeout(wander, 6000 + Math.random() * 4000);
    };

    this._wanderTimer = setTimeout(wander, 5000 + Math.random() * 3000);

    this._startIdleGestures();
  }

  /**
   * Leaves a small pair of footprints where Mickey just was, fading out
   * over about 12 seconds — long enough to notice a trail behind him,
   * short enough that it reads as the tide washing them away rather than
   * permanent marks. Purely decorative, and self-cleaning: each pair
   * removes itself from the DOM once its own fade finishes, so nothing
   * accumulates over a long idle session.
   */
  _dropFootprints(left, bottom) {
    if (!left || !bottom) return; // nowhere to drop them yet (first move)

    const footprints = document.createElement('div');
    footprints.className = 'footprints';
    footprints.style.left = left;
    footprints.style.bottom = bottom;
    footprints.innerHTML = '<span class="footprint footprint--l"></span><span class="footprint footprint--r"></span>';
    this.sceneEl.querySelector('.layer--island').appendChild(footprints);

    setTimeout(() => footprints.remove(), 12000);
  }

  /**
   * The crab notices Mickey, not just the clock — a real distance check
   * against his current on-screen position rather than another blind
   * timer, so the island reads as reacting to him being there, not just
   * looping regardless. Purely decorative: nothing here can affect the
   * boxes, the adventures, or any game state.
   */
  _checkWildlifeReaction() {
    const crabEl = this.sceneEl.querySelector('#crab');
    if (!crabEl || crabEl.classList.contains('is-startled')) return;

    const mickeyRect = this.mickey.el.getBoundingClientRect();
    const crabRect = crabEl.getBoundingClientRect();
    const dx = (crabRect.left + crabRect.width / 2) - (mickeyRect.left + mickeyRect.width / 2);
    const dy = (crabRect.top + crabRect.height / 2) - (mickeyRect.top + mickeyRect.height / 2);
    const distance = Math.hypot(dx, dy);

    if (distance < 130) {
      crabEl.classList.add('is-startled');
      setTimeout(() => crabEl.classList.remove('is-startled'), 1100);
    }
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
        const roll = Math.random();

        if (roll < 0.6) {
          // Most of the time: a quick glance to one side.
          const direction = Math.random() < 0.5 ? '-1' : '1';
          this.mickey.el.style.setProperty('--glance-dir', direction);
          this.mickey.el.classList.add('is-glancing');
          setTimeout(() => this.mickey.el.classList.remove('is-glancing'), 1400);
        } else {
          // Occasionally: he checks his map or scans the horizon with the
          // telescope, then goes back to idle on his own.
          const pose = roll < 0.8 ? MICKEY_STATES.READING : MICKEY_STATES.TELESCOPE;
          this.mickey.play(pose);
          setTimeout(() => {
            if (this.mickey.el.classList.contains(`mickey--${pose}`)) {
              this.mickey.play(MICKEY_STATES.IDLE);
            }
          }, 2600);
        }
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
