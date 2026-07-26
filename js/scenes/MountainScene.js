import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { SCENES, MICKEY_STATES } from '../config/constants.js';
import { typeText, wait } from '../utils/typewriter.js';
import { Camera } from '../systems/Camera.js';

/**
 * MountainScene
 * -------------
 * The second adventure: an ancient mechanism atop the mountain has gone
 * dark since a storm scattered its crystals. Across three rounds the grid
 * gets bigger and the correct pattern gets bigger with it — round three
 * asks for the island's own symbol, not a random set.
 *
 * The mechanic is "watch which crystals light up, then touch that same
 * set" (order doesn't matter) rather than "repeat an exact sequence" —
 * matches "position the crystals correctly" better than a strict Simon-
 * Says order would, and stays consistent with every other adventure's
 * tap-only interaction (no dragging anywhere in the game).
 *
 * Same shared rhythm as every adventure: reveal -> story -> rules demo ->
 * 3-2-1 -> the rounds -> hints if stuck -> celebration -> Reward scene.
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
    this.roundDotEls = Array.from(sceneEl.querySelectorAll('.adventure-round-dot'));
    this.lightWaveEl = sceneEl.querySelector('#mountain-light-wave');
    // No "back to island" escape hatch on purpose — once an adventure
    // starts, the only way out is finishing it.
    //
    // State machine: INTRO -> RULES -> PLAY -> WIN -> EXIT. Only the
    // EXIT state may ever call sceneManager.goTo() — see _exit() below.
    // This scene used to have goTo() called from two independent places
    // (the win-sequence, and the enter() catch fallback), which is
    // exactly the kind of "more than one way out" that let a crystal tap
    // occasionally end the scene early: the two paths didn't know about
    // each other. Now there's one gateway, and everything else just sets
    // state and lets the gateway decide.
    this._runToken = 0;
    this.state = 'INTRO';
    this._hintTimer = null;
    this._pendingResolve = null;
  }

  async enter() {
    try {
      await this._enterInner();
    } catch (err) {
      // Never leave the player stranded on a broken scene: if the error
      // hit after they'd already won, still try to get them their reward;
      // otherwise just send them back to the island. Either way this
      // goes through the same single _exit() gateway as the normal path.
      console.error('[Mountain] enter() FALLBACK TRIGGERED — _enterInner() threw:', err);
      console.log('[Mountain] fallback: state =', this.state, '-> going to', this.state === 'WIN' ? 'REWARD' : 'ISLAND');
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
   * and calls this — never goTo() directly. The state===EXIT guard means
   * even if something calls this twice (e.g. a genuine error right after
   * a legitimate finish), the second call is a harmless no-op instead of
   * a second competing transition.
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
    await this._playRounds(token);
  }


  async exit() {
    this._runToken += 1;
    clearTimeout(this._hintTimer);
    this._pendingResolve?.(false);
    this._pendingResolve = null;
    // See LagoonScene.exit() for why this matters: left active, this
    // guard's pointer-events:auto would silently swallow every tap
    // anywhere else in the game, including on the island, forever.
    this._setInputBlocked(false);
  }

  _resetState() {
    this.state = 'INTRO';
    this._setInputBlocked(true); // stays blocked through reveal/story/rules/countdown
    this.gridEl.innerHTML = '';
    this.dialogEl.classList.add('dialog--hidden');
    this.rulesEl.classList.remove('is-visible');
    this.countdownEl.classList.remove('is-visible');
    this.lightWaveEl.classList.remove('is-visible');
    this.roundDotEls.forEach((dot) => dot.classList.remove('is-done', 'is-current'));
    this.camera.reset();
  }

  /** The one mechanism that guarantees nothing can be tapped while the
   *  player is just watching (story, rules, countdown, win-sequence) —
   *  a transparent full-scene layer that blocks every tap while active,
   *  rather than relying on each individual element being correctly
   *  disabled on its own. */
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

  /** Show two example crystals lighting up together, then vanishing — the whole rule in one silent beat. */
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

  /** Play all three rounds in order, then the finale. */
  async _playRounds(token) {
    for (let i = 0; i < this.config.rounds.length; i++) {
      console.log(`[Mountain] starting round ${i + 1}/${this.config.rounds.length}`);
      this._updateRoundDots(i);

      const won = await this._playRound(this.config.rounds[i], token);
      console.log(`[Mountain] round ${i + 1} resolved with won=${won}`);
      if (!won) return; // scene was exited mid-round

      if (i < this.config.rounds.length - 1) {
        console.log(`[Mountain] round ${i + 1} -> transition dialog`);
        const line = this.config.roundWinLines[i % this.config.roundWinLines.length];
        this.dialogEl.classList.remove('dialog--hidden');
        await typeText(this.dialogTextEl, line);
        await wait(900);
        this.dialogEl.classList.add('dialog--hidden');
        await wait(400);
        console.log(`[Mountain] round ${i + 1} transition dialog done`);
      }
    }

    console.log('[Mountain] all rounds complete, checking token before win sequence', { token, current: this._runToken });
    if (token !== this._runToken) return;

    console.log('[Mountain] calling _playWinSequence()');
    await this._playWinSequence();
    console.log('[Mountain] _playWinSequence() returned normally');
  }

  _updateRoundDots(currentIndex) {
    this.roundDotEls.forEach((dot, i) => {
      dot.classList.toggle('is-done', i < currentIndex);
      dot.classList.toggle('is-current', i === currentIndex);
    });
  }

  /**
   * One round: lay out a grid, reveal the correct cells together, hide
   * them, then wait for the player to tap that same set back (any order).
   * Resolves true once solved, false if the scene was exited early.
   */
  _playRound(round, token) {
    return new Promise((resolve) => {
      // exit() calls this if the scene is left mid-round, so the promise
      // above always settles one way or another — never hangs forever.
      this._pendingResolve = resolve;

      this.gridEl.innerHTML = '';
      this._setGridEnabled(true);
      const totalCells = round.grid * round.grid;
      const correctSet = new Set(this._pickPattern(round) ?? this._pickRandomCells(totalCells, round.revealCount));
      const found = new Set();

      const cellEls = this._renderGrid(round.grid, (index, el) => {
        try {
          if (token !== this._runToken) return;
          if (found.has(index)) return; // already solved, ignore further taps

          if (correctSet.has(index)) {
            this.audio.win();
            this._activateCrystal(el);
            found.add(index);
            clearTimeout(this._hintTimer);

            if (found.size === correctSet.size) {
              this._setGridEnabled(false); // no more taps can land while we transition to the next round
              this._pendingResolve = null;
              resolve(true);
            } else {
              this._startHintTimer(correctSet, found, cellEls, token);
            }
          } else {
            this.audio.nudge();
            el.classList.add('is-wrong');
            setTimeout(() => el.classList.remove('is-wrong'), 350);
            this.dialogEl.classList.remove('dialog--hidden');
            typeText(this.dialogTextEl, this.config.missLine);
            setTimeout(() => { if (token === this._runToken) this.dialogEl.classList.add('dialog--hidden'); }, 1300);
          }
        } catch (err) {
          // A crystal tap should never be able to take down the whole
          // round silently — log it clearly so it's easy to find if this
          // ever happens again, instead of it just looking like a crash.
          console.error('MountainScene: crystal tap handler failed:', err);
        }
      });

      this._showPattern(correctSet, cellEls).then(() => {
        this._startHintTimer(correctSet, found, cellEls, token);
      });
    });
  }

  /** Blocks every crystal in the current grid from receiving taps — used
   *  the instant a round is won, so a stray fast tap during the
   *  round-transition dialog can't do anything. */
  _setGridEnabled(enabled) {
    this.gridEl.style.pointerEvents = enabled ? '' : 'none';
  }

  /**
   * The full activation moment for a correctly-tapped crystal: a glow
   * that flares up, a pulse, a small burst of particles in the crystal's
   * own color, and a brief beam of light — instead of just swapping a
   * class. The four stages are timed to overlap slightly (real light
   * doesn't wait politely for the previous effect to finish), driven by
   * one CSS class plus a handful of short-lived particle elements.
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

  /** Pick one of several symbol shapes at random, so a round with more than
   *  one option (like round 3's "island symbol") doesn't play out the
   *  same way every single time. */
  _pickPattern(round) {
    if (round.patterns) {
      return round.patterns[Math.floor(Math.random() * round.patterns.length)];
    }
    return round.pattern;
  }

  _pickRandomCells(totalCells, count) {
    const all = Array.from({ length: totalCells }, (_, i) => i);
    return all.sort(() => Math.random() - 0.5).slice(0, count);
  }

  /** Briefly light every correct cell at once, so the player memorizes the shape. */
  async _showPattern(correctSet, cellEls) {
    await wait(300);
    correctSet.forEach((i) => cellEls[i].classList.add('is-lit'));
    await wait(1300);
    correctSet.forEach((i) => cellEls[i].classList.remove('is-lit'));
  }

  /**
   * Five crystal colors to cycle through — blue, green, purple, gold,
   * ruby — so the field reads as distinct gems instead of identical tiles.
   * Purely visual: the game logic never checks color, only grid position.
   */
  static CRYSTAL_COLORS = [
    { color: '#4FAFC4', light: '#A8E8F5' }, // blue
    { color: '#4F9A5E', light: '#A8E8B8' }, // green
    { color: '#8A5EC4', light: '#D0B8F5' }, // purple
    { color: '#D9A227', light: '#FFE9A0' }, // gold
    { color: '#C4504F', light: '#F5A8A8' }, // ruby
  ];

  _renderGrid(gridSize, onTap) {
    const positions = this._gridPositions(gridSize);
    // Crystals stay the same size in every round — the grid's own span
    // widens for a denser 4x4 layout instead (see _gridPositions), so the
    // mountain never reads as "shrinking" between rounds. Only where the
    // crystals sit changes, not how big they (or the mountain) are.
    const sizePx = 40;

    return positions.map((pos, i) => {
      const el = document.createElement('button');
      const paletteIndex = i % MountainScene.CRYSTAL_COLORS.length;
      const palette = MountainScene.CRYSTAL_COLORS[paletteIndex];
      el.className = `mtn-crystal mtn-crystal--shape-${paletteIndex}`;
      el.style.left = `${pos.x}%`;
      el.style.top = `${pos.y}%`;
      el.style.width = `${sizePx}px`;
      el.style.height = `${sizePx * 1.13}px`; // keeps the same width:height ratio as the CSS default

      el.style.setProperty('--crystal-color', palette.color);
      el.style.setProperty('--crystal-light', palette.light);

      el.innerHTML = '<span class="mtn-crystal__shape"></span><span class="mtn-crystal__glow-ring"></span><span class="mtn-crystal__beam"></span>';
      el.setAttribute('aria-label', 'Кристал');
      el.addEventListener('click', () => onTap(i, el));
      this.gridEl.appendChild(el);
      return el;
    });
  }

  /** A clean, evenly spaced grid — perfectly symmetric, so nothing can ever overlap. */
  _gridPositions(gridSize) {
    const positions = [];
    // A 4x4 round spreads across more of the scene than a 3x3 one, so
    // same-sized crystals still get comfortable room — verified safe
    // (no overlap, and no columns pushed off-screen) even on a 360px
    // narrow screen.
    const spanX = gridSize <= 3 ? 56 : 66;
    const spanY = gridSize <= 3 ? 46 : 58;
    const startX = gridSize <= 3 ? 34 : 17;
    const startY = gridSize <= 3 ? 34 : 28;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        positions.push({
          x: startX + (c / (gridSize - 1)) * spanX,
          y: startY + (r / (gridSize - 1)) * spanY,
        });
      }
    }
    return positions;
  }

  /** If the player stalls mid-round, nudge toward one still-hidden correct cell. */
  _startHintTimer(correctSet, found, cellEls, token) {
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(async () => {
      if (token !== this._runToken) return;
      const remaining = [...correctSet].filter((i) => !found.has(i));
      if (remaining.length === 0) return;

      this.dialogEl.classList.remove('dialog--hidden');
      await typeText(this.dialogTextEl, this.config.hintLine);
      setTimeout(() => { if (token === this._runToken) this.dialogEl.classList.add('dialog--hidden'); }, 2200);

      const hintIndex = remaining[Math.floor(Math.random() * remaining.length)];
      cellEls[hintIndex].classList.add('is-hinting');
      setTimeout(() => cellEls[hintIndex].classList.remove('is-hinting'), 3000);

      this._startHintTimer(correctSet, found, cellEls, token);
    }, this.config.hintDelayMs);
  }

  /** All three rounds solved: the mountain wakes up. */
  async _playWinSequence() {
    console.log('[Mountain] _playWinSequence: started');
    this.state = 'WIN';
    this._setInputBlocked(true); // nothing should be tappable during the celebration either
    this._updateRoundDots(this.config.rounds.length);
    await wait(400);
    console.log('[Mountain] _playWinSequence: initial wait done');

    this.audio.chest();
    this.lightWaveEl.classList.add('is-visible');
    console.log('[Mountain] _playWinSequence: light wave shown');

    this.dialogEl.classList.remove('dialog--hidden');
    await typeText(this.dialogTextEl, this.config.winLine);
    await wait(1400);
    console.log('1. Win animation finished');
    console.log('[Mountain] _playWinSequence: win line shown, calling _exit(REWARD)');

    console.log('2. Calling _exit(REWARD)');
    await this._exit(SCENES.REWARD, { adventureId: 'mountain' });
    console.log('3. _exit returned');
    console.log('[Mountain] _playWinSequence: _exit(REWARD) returned normally');
  }
}
