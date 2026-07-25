import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { SCENES } from '../config/constants.js';
import { icon } from '../components/icons.js';
import { Camera } from '../systems/Camera.js';
import { typeText, wait } from '../utils/typewriter.js';

/**
 * LagoonScene
 * -----------
 * The first full adventure, rebuilt as a small cinematic location rather
 * than a quick mini-game: Mickey lost the pieces of a magic compass when a
 * wave scattered them across the beach, and the player has to find all
 * three among a wide field of decorative clutter.
 *
 * Every adventure follows the same shared rhythm (see the design brief):
 *   cinematic reveal -> Mickey's story -> rules shown by example ->
 *   3-2-1 -> the game itself -> gentle hints if stuck -> a small
 *   celebration -> handed off to the shared Reward scene.
 *
 * This scene has its own small Camera and its own dialog bubble — it does
 * NOT touch the shared Mickey component (that one only controls the
 * island's #mickey). Mickey here is a second, purely decorative copy of
 * the same artwork, standing still by the boat.
 */
export class LagoonScene {
  /**
   * @param {HTMLElement} sceneEl
   * @param {import('../systems/SceneManager.js').SceneManager} sceneManager
   * @param {import('../components/Mickey.js').Mickey} mickey - the shared island Mickey, used only to update his state when we return
   * @param {import('../systems/AudioManager.js').AudioManager} audio
   */
  constructor(sceneEl, sceneManager, mickey, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.mickey = mickey;
    this.audio = audio;
    this.config = ADVENTURE_CONFIG.lagoon;

    this.camera = new Camera(sceneEl);
    this.dialogEl = sceneEl.querySelector('#lagoon-dialog');
    this.dialogTextEl = sceneEl.querySelector('#lagoon-dialog-text');
    this.rulesEl = sceneEl.querySelector('#lagoon-rules');
    this.rulesTextEl = sceneEl.querySelector('#lagoon-rules-text');
    this.rulesDemoItemEl = sceneEl.querySelector('#lagoon-rules-demo-item');
    this.countdownEl = sceneEl.querySelector('#lagoon-countdown');
    this.fieldEl = sceneEl.querySelector('#lagoon-field');
    this.tableSlotsEl = sceneEl.querySelector('#lagoon-table-slots');
    this.compassFinalEl = sceneEl.querySelector('.lagoon-compass-final');
    this.compassRayEl = sceneEl.querySelector('.lagoon-compass-ray');
    this.backBtn = sceneEl.querySelector('#lagoon-back');

    this.backBtn.addEventListener('click', () => this.sceneManager.goTo(SCENES.ISLAND));

    /** @type {Set<string>} ids of targets found so far this visit */
    this._found = new Set();
    this._hintTimer = null;
    this._runToken = 0;
  }

  async enter() {
    try {
      await this._enterInner();
    } catch (err) {
      console.error('LagoonScene.enter() failed partway through:', err);
    }
  }

  async _enterInner() {
    const token = ++this._runToken;
    this._resetState();

    await this._stageReveal();
    if (token !== this._runToken) return;

    await this._stageStory();
    if (token !== this._runToken) return;

    await this._stageRulesDemo();
    if (token !== this._runToken) return;

    await this._runCountdown();
    if (token !== this._runToken) return;

    this._scatterField();
    this._startHintTimer();
  }


  async exit() {
    this._runToken += 1;
    clearTimeout(this._hintTimer);
  }

  _resetState() {
    this._found.clear();
    this.fieldEl.innerHTML = '';
    this.tableSlotsEl.innerHTML = '';
    this.dialogEl.classList.add('dialog--hidden');
    this.rulesEl.classList.remove('is-visible');
    this.countdownEl.classList.remove('is-visible');
    this.compassFinalEl.classList.remove('is-visible');
    this.compassRayEl.classList.remove('is-visible');
    this.camera.reset();
  }

  /** Stage 1 — a slow, quiet camera reveal of the lagoon before anything talks. */
  async _stageReveal() {
    this.camera.focus({ scale: 1.15, x: '0%', y: '4%' });
    await wait(1400);
    this.camera.reset();
    await wait(900);
  }

  /** Stage 2 — Mickey explains what happened, one typed line at a time. */
  async _stageStory() {
    for (const line of this.config.story) {
      this.dialogEl.classList.remove('dialog--hidden');
      await typeText(this.dialogTextEl, line);
      await wait(1000);
    }
    this.dialogEl.classList.add('dialog--hidden');
    await wait(300);
  }

  /**
   * Stage 3 — teach the interaction by demonstrating it, not by describing
   * it: one example item glows, then "gets tapped" on its own and vanishes.
   */
  async _stageRulesDemo() {
    this.rulesTextEl.textContent = this.config.rulesLine;
    this.rulesDemoItemEl.innerHTML = icon('shell');
    this.rulesEl.classList.add('is-visible');

    await wait(500);
    this.rulesDemoItemEl.classList.add('is-glowing');
    await wait(1400);
    this.rulesDemoItemEl.classList.remove('is-glowing');
    this.rulesDemoItemEl.classList.add('is-collected');
    await wait(600);

    this.rulesEl.classList.remove('is-visible');
    this.rulesDemoItemEl.classList.remove('is-collected');
    await wait(300);
  }

  /** Stage 4 — 3-2-1, same rhythm as every other countdown in the game. */
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

  /**
   * Stage 5 — scatter the clutter and the three hidden targets across the
   * beach. Positions come from a loose grid with jitter (not a strict
   * grid) so nothing lines up in neat rows, matching the brief's "natural,
   * partly overlapping, slightly tilted" look.
   */
  _scatterField() {
    this.fieldEl.innerHTML = '';
    this.fieldEl.style.pointerEvents = '';

    const targets = this.config.targets.map((t) => ({ ...t, isTarget: true }));
    const decoys = Array.from({ length: this.config.clutterCount }, (_, i) => ({
      icon: this.config.clutterTypes[i % this.config.clutterTypes.length],
      isTarget: false,
    }));

    const items = this._shuffle([...targets, ...decoys]);
    const positions = this._generatePositions(items.length);

    items.forEach((item, i) => {
      const el = document.createElement('button');
      el.className = 'lagoon-item';
      el.style.left = `${positions[i].left}%`;
      el.style.top = `${positions[i].top}%`;
      el.style.transform = `rotate(${positions[i].rotation}deg) scale(${positions[i].scale})`;
      el.innerHTML = icon(item.icon);
      el.setAttribute('aria-label', item.isTarget ? item.label : 'Дрібниця на пляжі');

      el.addEventListener('click', () => this._handleTap(item, el));
      this.fieldEl.appendChild(el);
    });
  }

  /** Loose scattered grid, jittered so items don't line up neatly. */
  _generatePositions(count) {
    const cols = 6;
    const rows = Math.ceil(count / cols);
    const cells = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          left: 20 + c * ((85 - 20) / (cols - 1)) + (Math.random() - 0.5) * 6,
          top: 46 + r * ((90 - 46) / Math.max(rows - 1, 1)) + (Math.random() - 0.5) * 5,
          rotation: (Math.random() - 0.5) * 40,
          scale: 0.85 + Math.random() * 0.35,
        });
      }
    }

    return this._shuffle(cells).slice(0, count);
  }

  _shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  _handleTap(item, el) {
    if (item.isTarget) {
      this._collectTarget(item, el);
    } else {
      this.audio.tap();
      el.classList.remove('is-decoy-tapped');
      void el.offsetWidth;
      el.classList.add('is-decoy-tapped');
    }
  }

  /** A found piece flies from where it sits to the table, then is removed. */
  _collectTarget(target, el) {
    if (this._found.has(target.id)) return; // already collected
    this._found.add(target.id);
    this.audio.win();

    const itemRect = el.getBoundingClientRect();
    const tableRect = this.tableSlotsEl.getBoundingClientRect();
    const dx = (tableRect.left + tableRect.width / 2) - (itemRect.left + itemRect.width / 2);
    const dy = (tableRect.top + tableRect.height / 2) - (itemRect.top + itemRect.height / 2);

    el.style.setProperty('--target-x', `${dx}px`);
    el.style.setProperty('--target-y', `${dy}px`);
    el.classList.add('is-collected');

    setTimeout(() => {
      const slotIcon = document.createElement('span');
      slotIcon.innerHTML = icon(target.icon);
      slotIcon.className = 'is-placed';
      this.tableSlotsEl.appendChild(slotIcon);
      requestAnimationFrame(() => slotIcon.querySelector('.icon')?.classList.add('is-placed'));
      el.remove();
    }, 650);

    // Any hint currently showing is no longer needed — a piece was just found.
    clearTimeout(this._hintTimer);

    if (this._found.size === this.config.targets.length) {
      this.fieldEl.style.pointerEvents = 'none';
      this._playWinSequence();
    } else {
      this._startHintTimer();
    }
  }

  /** If nothing's been found in a while, Mickey nudges toward one target. */
  _startHintTimer() {
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => this._giveHint(), this.config.hintDelayMs);
  }

  async _giveHint() {
    const remaining = this.config.targets.filter((t) => !this._found.has(t.id));
    if (remaining.length === 0) return;

    const line = this.config.hintLines[Math.floor(Math.random() * this.config.hintLines.length)];
    this.dialogEl.classList.remove('dialog--hidden');
    await typeText(this.dialogTextEl, line);

    // Softly point at one still-hidden target rather than all of them.
    const targetId = remaining[Math.floor(Math.random() * remaining.length)].id;
    const targetEl = Array.from(this.fieldEl.children).find(
      (el) => el.getAttribute('aria-label') === remaining.find((t) => t.id === targetId)?.label
    );
    targetEl?.classList.add('is-hinting');

    setTimeout(() => {
      this.dialogEl.classList.add('dialog--hidden');
      targetEl?.classList.remove('is-hinting');
    }, 4000);

    this._startHintTimer();
  }

  /** All three pieces found: the compass assembles, and we head to the reward. */
  async _playWinSequence() {
    await wait(500);

    this.compassFinalEl.innerHTML = icon('compassBody');
    this.compassRayEl.classList.add('is-visible');
    this.compassFinalEl.classList.add('is-visible');
    this.audio.chest();

    this.dialogEl.classList.remove('dialog--hidden');
    await typeText(this.dialogTextEl, this.config.winLine);
    await wait(1400);

    this.sceneManager.goTo(SCENES.REWARD, { adventureId: 'lagoon' });
  }
}
