import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { SCENES, MICKEY_STATES } from '../config/constants.js';
import { typeText, wait } from '../utils/typewriter.js';
import { Camera } from '../systems/Camera.js';
import { debugLog } from '../utils/debugLog.js';
import { SequenceGenerator } from '../systems/SequenceGenerator.js';

/**
 * MountainScene — "Mountain of Crystals"
 * ---------------------------------------
 * An ancient stone plate of 9 unique crystals (each its own shape, color,
 * and musical tone) atop the mountain. Watch the sequence light up one
 * crystal at a time, then repeat it back. Five rounds, lengths 3 through
 * 7 — the plate and camera never change scale between rounds, only the
 * sequence gets longer, so the player's sense of "where things are"
 * never has to reset.
 *
 * Unlike every other adventure, a wrong tap here is a real reset: the
 * whole plate shakes, the sequence replays, and the round starts over —
 * a deliberate memory-game rule, not a bug. (Lagoon/Bazaar stay
 * no-penalty; this one is meant to feel like Simon Says.)
 *
 * Same shared rhythm as every adventure otherwise: reveal -> story ->
 * rules demo -> 3-2-1 -> the rounds -> hints if stuck -> celebration ->
 * Reward scene.
 */
export class MountainScene {
  /**
   * @param {HTMLElement} sceneEl
   * @param {import('../systems/SceneManager.js').SceneManager} sceneManager
   * @param {import('../components/Mickey.js').Mickey} mickey - the shared island Mickey (used only when we return)
   * @param {import('../systems/AudioManager.js').AudioManager} audio
   */
  constructor(sceneEl, sceneManager, mickey, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.mickey = mickey;
    this.audio = audio;
    this.config = ADVENTURE_CONFIG.mountain;

    this.camera = new Camera(sceneEl);
    this.inputGuardEl = sceneEl.querySelector('#mountain-input-guard');
    this.dialogEl = sceneEl.querySelector('#mountain-dialog');
    this.dialogTextEl = sceneEl.querySelector('#mountain-dialog-text');
    this.rulesEl = sceneEl.querySelector('#mountain-rules');
    this.rulesTextEl = sceneEl.querySelector('#mountain-rules-text');
    this.rulesCrystalEl = sceneEl.querySelector('#mountain-rules-crystal');
    this.rulesCrystal2El = sceneEl.querySelector('#mountain-rules-crystal-2');
    this.countdownEl = sceneEl.querySelector('#mountain-countdown');
    this.gridEl = sceneEl.querySelector('#mountain-grid');
    this.lightWaveEl = sceneEl.querySelector('#mountain-light-wave');

    // No "back to island" escape hatch on purpose — once an adventure
    // starts, the only way out is finishing it.
    //
    // State machine: INTRO -> RULES -> PLAY -> WIN -> EXIT. Only the
    // EXIT state may ever call sceneManager.goTo() — see _exit() below.
    this._runToken = 0;
    this.state = 'INTRO';
    this._hintTimer = null;
    this._pendingResolve = null;
    this._cellEls = null; // the 9 crystal elements, built once and reused across every round
  }

  /** Runs before the scene becomes visible/tappable at all — blocks
   *  input a beat earlier than enter() would get to it on its own,
   *  closing even the theoretical gap between "scene is on screen" and
   *  "input guard is active" (a real tap can't actually land in that
   *  gap — JS is single-threaded and the two happen in the same
   *  synchronous stretch — but this makes it true regardless). */
  beforeEnter() {
    this._setInputBlocked(true);
  }

  async enter() {
    try {
      await this._enterInner();
    } catch (err) {
      console.error('[Mountain] enter() FALLBACK TRIGGERED — _enterInner() threw:', err);
      debugLog('[Mountain] fallback: state =', this.state, '-> going to', this.state === 'WIN' ? 'REWARD' : 'ISLAND');
      if (this.state === 'WIN') {
        await this._exit(SCENES.REWARD, { adventureId: 'mountain' });
      } else {
        await this._exit(SCENES.ISLAND);
      }
    }
  }

  /**
   * The ONLY place in this scene allowed to call sceneManager.goTo().
   * Every other method that wants to leave the scene sets `this.state`
   * and calls this — never goTo() directly.
   */
  async _exit(targetScene, data) {
    if (this.state === 'EXIT') return;
    this.state = 'EXIT';
    await this.sceneManager.goTo(targetScene, data);
  }

  async _enterInner() {
    const token = ++this._runToken;
    this._resetState();
    this.state = 'INTRO';

    await this._stageReveal();
    if (token !== this._runToken) return;

    await this._stageStory();
    if (token !== this._runToken) return;

    this.state = 'RULES';
    await this._stageRulesDemo();
    if (token !== this._runToken) return;

    await this._runCountdown();
    if (token !== this._runToken) return;

    this.state = 'PLAY';
    this._setInputBlocked(false); // the game itself is the only tappable thing now
    this._renderPlate(); // built once — never rebuilt between rounds

    // The camera moves in once, right as play begins, and holds there
    // for the whole game — it only moves again after every round is won.
    this.camera.focus({ scale: 1.28, x: '0%', y: '2%' });
    await wait(500);

    await this._playRounds(token);
  }

  async exit() {
    this._runToken += 1;
    clearTimeout(this._hintTimer);
    this._pendingResolve?.(false);
    this._pendingResolve = null;
    this._setInputBlocked(false);
  }

  _resetState() {
    this.state = 'INTRO';
    this._setInputBlocked(true);
    this.gridEl.innerHTML = '';
    this._cellEls = null;
    this.dialogEl.classList.add('dialog--hidden');
    this.rulesEl.classList.remove('is-visible');
    this.countdownEl.classList.remove('is-visible');
    this.lightWaveEl.classList.remove('is-visible');
    this.camera.reset();
  }

  _setInputBlocked(blocked) {
    this.inputGuardEl.classList.toggle('is-active', blocked);
  }

  async _stageReveal() {
    this.camera.focus({ scale: 1.15, x: '0%', y: '3%' });
    await wait(1400);
    this.camera.reset();
    await wait(900);
  }

  async _stageStory() {
    for (const line of this.config.story) {
      this.dialogEl.classList.remove('dialog--hidden');
      await typeText(this.dialogTextEl, line);
      await wait(1000);
    }
    this.dialogEl.classList.add('dialog--hidden');
    await wait(300);
  }

  async _stageRulesDemo() {
    this.rulesTextEl.textContent = this.config.rulesLine;
    this.rulesEl.classList.add('is-visible');

    await wait(500);
    this.rulesCrystalEl.classList.add('is-glowing');
    this.rulesCrystal2El.classList.add('is-glowing');
    await wait(1400);
    this.rulesCrystalEl.classList.remove('is-glowing');
    this.rulesCrystal2El.classList.remove('is-glowing');
    this.rulesCrystalEl.classList.add('is-collected');
    this.rulesCrystal2El.classList.add('is-collected');
    await wait(600);

    this.rulesEl.classList.remove('is-visible');
    this.rulesCrystalEl.classList.remove('is-collected');
    this.rulesCrystal2El.classList.remove('is-collected');
    await wait(300);
  }

  async _runCountdown() {
    for (const step of ['3', '2', '1']) {
      this.countdownEl.textContent = step;
      this.countdownEl.classList.remove('is-visible');
      void this.countdownEl.offsetWidth;
      this.countdownEl.classList.add('is-visible');
      await wait(650);
    }
    this.countdownEl.classList.remove('is-visible');
  }

  /** Play all five rounds in order, then the finale. */
  async _playRounds(token) {
    for (let i = 0; i < this.config.rounds.length; i++) {
      debugLog(`[Mountain] starting round ${i + 1}/${this.config.rounds.length}`);

      const won = await this._playRound(this.config.rounds[i], token);
      debugLog(`[Mountain] round ${i + 1} resolved with won=${won}`);
      if (!won) return; // scene was exited mid-round

      // A light wave from the center of the plate at the end of every
      // round, not just the final one — each solved round is its own
      // small payoff.
      this.audio.tap();
      this.lightWaveEl.classList.remove('is-visible');
      void this.lightWaveEl.offsetWidth;
      this.lightWaveEl.classList.add('is-visible');

      if (i < this.config.rounds.length - 1) {
        const line = this.config.roundWinLines[i % this.config.roundWinLines.length];
        this.dialogEl.classList.remove('dialog--hidden');
        await typeText(this.dialogTextEl, line);
        await wait(900);
        this.dialogEl.classList.add('dialog--hidden');
        await wait(400);
        // Every crystal goes back to its true idle state before the next
        // round's sequence starts — not just "found this round", but
        // every highlight/effect class that could possibly still be on
        // it, so nothing carries over between rounds.
        this._cellEls.forEach((el) => {
          el.classList.remove('is-solved', 'is-correct', 'is-lit', 'is-hinting', 'is-activating', 'is-wrong');
        });
      }
    }

    if (token !== this._runToken) return;
    await this._playWinSequence();
  }


  /**
   * One round: generate a fresh sequence, show it, then wait for the
   * player to repeat it. A wrong tap shakes the whole plate, replays the
   * SAME sequence, and starts the round over from the first tap — this
   * is the one adventure in the game where a mistake really does cost
   * progress, on purpose (a memory game where nothing was ever at stake
   * wouldn't be much of one). Resolves true once solved, false if the
   * scene was exited early.
   */
  _playRound(round, token) {
    return new Promise((resolve) => {
      this._pendingResolve = resolve;
      const cellEls = this._cellEls;
      const sequence = SequenceGenerator.generate(round.sequenceLength, cellEls.length);

      const attempt = () => {
        let nextIndex = 0;
        let isDisplaying = true;
        // The grid stays tappable through the whole display — an
        // impatient tap gets a clear "not yet" nudge instead of being
        // silently swallowed by a disabled button.
        this._setGridEnabled(true);

        this._showSequence(sequence, cellEls).then(() => {
          if (token !== this._runToken) return;
          isDisplaying = false;
          this._startHintTimer(sequence, () => nextIndex, cellEls, token);
        });

        const onTap = (index, el) => {
          try {
            if (token !== this._runToken) return;

            if (isDisplaying) {
              // Tapped before the sequence finished showing — a quick,
              // honest "not yet" rather than nothing happening at all.
              this.audio.nudge();
              el.classList.remove('is-wrong');
              void el.offsetWidth;
              el.classList.add('is-wrong');
              setTimeout(() => el.classList.remove('is-wrong'), 300);
              return;
            }

            if (index === sequence[nextIndex]) {
              this.audio.crystalTone(MountainScene.CRYSTALS[index].tone);
              this._activateCrystal(el);
              el.classList.add('is-solved'); // stays lit for the rest of the round
              nextIndex += 1;
              clearTimeout(this._hintTimer);

              if (nextIndex === sequence.length) {
                this._setGridEnabled(false);
                this._pendingResolve = null;
                cellEls.forEach((c) => (c.onTap = null));
                resolve(true);
              } else {
                this._startHintTimer(sequence, () => nextIndex, cellEls, token);
              }
            } else {
              // A real reset, not a gentle miss — the whole plate shakes,
              // every crystal (including ones already solved this
              // attempt) fades back to idle, and the sequence plays again
              // from the start.
              clearTimeout(this._hintTimer);
              this.audio.nudge();
              this._setGridEnabled(false);
              this.gridEl.classList.remove('is-shaking');
              void this.gridEl.offsetWidth;
              this.gridEl.classList.add('is-shaking');
              cellEls.forEach((c) => c.classList.remove('is-solved', 'is-correct', 'is-lit', 'is-hinting', 'is-activating', 'is-wrong'));

              this.dialogEl.classList.remove('dialog--hidden');
              typeText(this.dialogTextEl, this.config.missLine);
              setTimeout(() => { if (token === this._runToken) this.dialogEl.classList.add('dialog--hidden'); }, 1300);

              setTimeout(() => {
                if (token !== this._runToken) return;
                attempt();
              }, 1200);
            }
          } catch (err) {
            console.error('MountainScene: crystal tap handler failed:', err);
          }
        };

        cellEls.forEach((el) => { el.onTap = onTap; });
      };

      attempt();
    });
  }

  /** Blocks every crystal from receiving taps — used while the sequence
   *  is playing back, and the instant a round is won, so no stray tap
   *  can land during a transition. */
  _setGridEnabled(enabled) {
    this.gridEl.style.pointerEvents = enabled ? '' : 'none';
  }

  /**
   * The full activation moment for a correctly-tapped crystal: a glow
   * that flares up, a pulse, a small burst of particles in the crystal's
   * own color, and a brief beam of light.
   */
  _activateCrystal(el) {
    el.classList.add('is-correct', 'is-activating');
    this._scatterCrystalParticles(el);
    setTimeout(() => el.classList.remove('is-activating'), 900);
  }

  /** A handful of small sparks in the crystal's own color, flying outward
   *  and fading — removed once their animation finishes so they never
   *  pile up across taps. */
  _scatterCrystalParticles(el) {
    const color = el.style.getPropertyValue('--crystal-color') || '#4FAFC4';
    const count = 6;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'mtn-crystal-particle';
      const angle = (360 / count) * i + (Math.random() * 20 - 10);
      const distance = 26 + Math.random() * 14;
      particle.style.setProperty('--particle-color', color);
      particle.style.setProperty('--particle-x', `${Math.cos((angle * Math.PI) / 180) * distance}px`);
      particle.style.setProperty('--particle-y', `${Math.sin((angle * Math.PI) / 180) * distance}px`);
      el.appendChild(particle);
      setTimeout(() => particle.remove(), 700);
    }
  }

  /** Light each cell in the sequence one at a time, with its own tone —
   *  the actual order the player needs to see (and hear) and repeat. */
  async _showSequence(sequence, cellEls) {
    this.mickey.play(MICKEY_STATES.THINK); // "watching the plate"
    await wait(300);
    for (const index of sequence) {
      this.audio.crystalTone(MountainScene.CRYSTALS[index].tone);
      cellEls[index].classList.add('is-lit');
      await wait(500);
      cellEls[index].classList.remove('is-lit');
      await wait(220);
    }
    this.mickey.play(MICKEY_STATES.IDLE);
  }

  /**
   * Nine unique crystals — each its own shape, color, and musical tone
   * (an ascending scale, C4 through D5) — fixed to a specific position
   * on the plate. The player memorizes place, shape, color, and sound
   * together. Purely presentational: game logic only ever checks grid
   * position, never which of these a cell happens to be.
   */
  static CRYSTALS = [
    { shape: 0, color: '#C4504F', light: '#F5A8A8', tone: 261.63 }, // red rhombus
    { shape: 1, color: '#4FAFC4', light: '#A8E8F5', tone: 293.66 }, // blue hexagon
    { shape: 2, color: '#4F9A5E', light: '#A8E8B8', tone: 329.63 }, // green triangle
    { shape: 3, color: '#8A5EC4', light: '#D0B8F5', tone: 349.23 }, // purple star
    { shape: 4, color: '#D9A227', light: '#FFE9A0', tone: 392.00 }, // gold circle
    { shape: 5, color: '#2FA0AE', light: '#8FE8E8', tone: 440.00 }, // turquoise gem
    { shape: 6, color: '#C9752E', light: '#FFC98A', tone: 493.88 }, // amber prism
    { shape: 7, color: '#C9C4B8', light: '#FFFDF5', tone: 523.25 }, // white quartz
    { shape: 8, color: '#2E4C9A', light: '#A8C0F5', tone: 587.33 }, // sapphire
  ];

  /** Builds the 9 crystals once, in fixed shape/color, and never rebuilds
   *  them between rounds — only the sequence changes, never the plate. */
  _renderPlate() {
    this.gridEl.innerHTML = '';
    const positions = this._gridPositions();
    const sizePx = 74; // large, comfortable tap target — see the size doc's iPhone guidance

    this._cellEls = positions.map((pos, i) => {
      const el = document.createElement('button');
      const crystal = MountainScene.CRYSTALS[i];
      el.className = `mtn-crystal mtn-crystal--shape-${crystal.shape}`;
      el.style.left = `${pos.x}%`;
      el.style.top = `${pos.y}%`;
      el.style.width = `${sizePx}px`;
      el.style.height = `${sizePx * 1.13}px`;

      el.style.setProperty('--crystal-color', crystal.color);
      el.style.setProperty('--crystal-light', crystal.light);

      el.innerHTML = '<span class="mtn-crystal__shape"></span><span class="mtn-crystal__glow-ring"></span><span class="mtn-crystal__beam"></span>';
      el.setAttribute('aria-label', 'Кристал');
      el.addEventListener('click', () => el.onTap?.(i, el));
      this.gridEl.appendChild(el);
      return el;
    });
  }

  /** A clean, evenly spaced 3x3 grid on the stone altar — perfectly
   *  symmetric, so nothing can ever overlap, well clear of Mickey's spot
   *  and everything else in the scene. */
  _gridPositions() {
    const positions = [];
    const spanX = 52;
    const spanY = 36;
    const startX = 24;
    const startY = 38;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        positions.push({
          x: startX + (c / 2) * spanX,
          y: startY + (r / 2) * spanY,
        });
      }
    }
    return positions;
  }

  /** If the player stalls mid-round, nudge toward the next required tap
   *  in the sequence. */
  _startHintTimer(sequence, getNextIndex, cellEls, token) {
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(async () => {
      if (token !== this._runToken) return;
      const nextIndex = getNextIndex();
      if (nextIndex >= sequence.length) return;

      this.dialogEl.classList.remove('dialog--hidden');
      await typeText(this.dialogTextEl, this.config.hintLine);
      setTimeout(() => { if (token === this._runToken) this.dialogEl.classList.add('dialog--hidden'); }, 2200);

      const hintIndex = sequence[nextIndex];
      cellEls[hintIndex].classList.add('is-hinting');
      setTimeout(() => cellEls[hintIndex].classList.remove('is-hinting'), 3000);

      this._startHintTimer(sequence, getNextIndex, cellEls, token);
    }, this.config.hintDelayMs);
  }

  /** All five rounds solved: the mountain wakes up, the camera pulls back. */
  async _playWinSequence() {
    debugLog('[Mountain] _playWinSequence: started');
    this.state = 'WIN';
    this._setInputBlocked(true);
    this.mickey.play(MICKEY_STATES.CELEBRATE);
    await wait(400);

    this.audio.chest();
    this.audio.mountainSignature();
    this.lightWaveEl.classList.remove('is-visible');
    void this.lightWaveEl.offsetWidth;
    this.lightWaveEl.classList.add('is-visible');

    this.camera.reset(); // pulls back out, the one camera move after victory

    this.dialogEl.classList.remove('dialog--hidden');
    await typeText(this.dialogTextEl, this.config.winLine);
    await wait(1400);

    await this._exit(SCENES.REWARD, { adventureId: 'mountain' });
  }

}
