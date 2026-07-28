import { ADVENTURE_CONFIG } from '../data/adventures.js';
import { SCENES } from '../config/constants.js';
import { icon } from '../components/icons.js';
import { Camera } from '../systems/Camera.js';
import { typeText, wait } from '../utils/typewriter.js';
import { debugLog } from '../utils/debugLog.js';

/**
 * LagoonScene — "The Explorer's Collection"
 * ------------------------------------------
 * The first adventure: Mickey's old expedition notes were scattered by
 * the wind, and the player rebuilds the collection across three rounds
 * (3, then 4, then 5 items), each a little busier and more tightly
 * packed than the last. The expedition-notes panel at the top always
 * shows exactly what's left to find for the current round — no guessing.
 *
 * Same shared rhythm as every adventure: reveal -> story -> rules demo ->
 * 3-2-1 -> the rounds -> gentle hints if stuck -> celebration -> Reward.
 */
export class LagoonScene {
  /**
   * @param {HTMLElement} sceneEl
   * @param {import('../systems/SceneManager.js').SceneManager} sceneManager
   * @param {import('../components/Mickey.js').Mickey} mickey - the shared island Mickey, used only when we return
   * @param {import('../systems/AudioManager.js').AudioManager} audio
   */
  constructor(sceneEl, sceneManager, mickey, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.mickey = mickey;
    this.audio = audio;
    this.config = ADVENTURE_CONFIG.lagoon;

    this.camera = new Camera(sceneEl);
    this.inputGuardEl = sceneEl.querySelector('#lagoon-input-guard');
    this.dialogEl = sceneEl.querySelector('#lagoon-dialog');
    this.dialogTextEl = sceneEl.querySelector('#lagoon-dialog-text');
    this.rulesEl = sceneEl.querySelector('#lagoon-rules');
    this.rulesTextEl = sceneEl.querySelector('#lagoon-rules-text');
    this.rulesDemoItemEl = sceneEl.querySelector('#lagoon-rules-demo-item');
    this.countdownEl = sceneEl.querySelector('#lagoon-countdown');
    this.fieldEl = sceneEl.querySelector('#lagoon-field');
    this.panelEl = sceneEl.querySelector('#lagoon-panel');
    this.panelCardsEl = sceneEl.querySelector('#lagoon-panel-cards');

    // No "back to island" escape hatch on purpose — once an adventure
    // starts, the only way out is finishing it: reveal -> story -> rules
    // -> countdown -> rounds -> win -> Reward -> island.
    //
    // State machine: INTRO -> RULES -> PLAY -> WIN -> EXIT. Only the
    // EXIT state may ever call sceneManager.goTo() — see _exit() below.
    // Having goTo() reachable from two independent places (the win-
    // sequence and the enter() catch fallback) was exactly the kind of
    // "more than one way out" that let the scene end early sometimes.
    this._runToken = 0;
    this.state = 'INTRO';
    this._talkHintTimer = null;
    this._shimmerHintTimer = null;
    this._pendingResolve = null;
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
      console.error('[Lagoon] enter() FALLBACK TRIGGERED — _enterInner() threw:', err);
      debugLog('[Lagoon] fallback: state =', this.state, '-> going to', this.state === 'WIN' ? 'REWARD' : 'ISLAND');
      if (this.state === 'WIN') {
        await this._exit(SCENES.REWARD, { adventureId: 'lagoon' });
      } else {
        await this._exit(SCENES.ISLAND);
      }
    }
  }

  /**
   * The ONLY place in this scene allowed to call sceneManager.goTo().
   * The state===EXIT guard makes a second call (e.g. an error right
   * after a legitimate finish) a harmless no-op instead of a second
   * competing transition.
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
    this.panelEl.classList.add('is-visible');
    await this._playRounds(token);
  }

  async exit() {
    this._runToken += 1;
    clearTimeout(this._talkHintTimer);
    clearTimeout(this._shimmerHintTimer);
    this._pendingResolve?.(false);
    this._pendingResolve = null;
    // The win-sequence leaves the input guard active (nothing should be
    // tappable during the celebration) — but if we never come back to
    // THIS scene again (the normal case, once an adventure is finished),
    // nothing else would ever clear it. Its pointer-events:auto would
    // then sit invisibly over the whole screen forever, silently
    // swallowing every tap anywhere else in the game, including on the
    // island. Always clear it the moment the scene is actually left.
    this._setInputBlocked(false);
  }

  _resetState() {
    this.state = 'INTRO';
    this._setInputBlocked(true); // stays blocked through reveal/story/rules/countdown
    this.fieldEl.innerHTML = '';
    this.panelCardsEl.innerHTML = '';
    this.panelEl.classList.remove('is-visible');
    this.dialogEl.classList.add('dialog--hidden');
    this.rulesEl.classList.remove('is-visible');
    this.countdownEl.classList.remove('is-visible');
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
    this.camera.focus({ scale: 1.15, x: '0%', y: '4%' });
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
      debugLog(`[Lagoon] starting round ${i + 1}/${this.config.rounds.length}`);

      const won = await this._playRound(this.config.rounds[i], token);
      debugLog(`[Lagoon] round ${i + 1} resolved with won=${won}`);
      if (!won) return; // scene was exited mid-round

      if (i < this.config.rounds.length - 1) {
        const line = this.config.roundWinLines[i % this.config.roundWinLines.length];
        this.dialogEl.classList.remove('dialog--hidden');
        await typeText(this.dialogTextEl, line);
        await wait(900);
        this.dialogEl.classList.add('dialog--hidden');
        await wait(500);
      }
    }

    debugLog('[Lagoon] all rounds complete, checking token before win sequence', { token, current: this._runToken });
    if (token !== this._runToken) return;

    debugLog('[Lagoon] calling _playWinSequence()');
    await this._playWinSequence();
    debugLog('[Lagoon] _playWinSequence() returned normally');
  }


  /**
   * One round: show the panel cards for this round's targets (dimmed,
   * un-found), scatter those targets plus decoy clutter across the beach,
   * and wait for every target to be tapped. Resolves true once solved,
   * false if the scene was exited early.
   */
  _playRound(round, token) {
    return new Promise((resolve) => {
      this._pendingResolve = resolve;

      const found = new Set();
      this._renderPanelCards(round.targets);
      this._scatterField(round, found, token, resolve);
    });
  }

  /** The panel cards for the current round — dimmed until found. */
  _renderPanelCards(targets) {
    this.panelCardsEl.innerHTML = '';
    targets.forEach((target, i) => {
      const card = document.createElement('div');
      card.className = 'lagoon-card';
      card.dataset.targetId = target.id;
      card.style.animationDelay = `${i * 0.1}s`;
      card.innerHTML = `${icon(target.icon)}<span class="lagoon-card__name">${target.label}</span>`;
      this.panelCardsEl.appendChild(card);
    });
  }

  _scatterField(round, found, token, resolve) {
    this.fieldEl.innerHTML = '';
    this.fieldEl.style.pointerEvents = '';

    const targets = round.targets.map((t) => ({ ...t, isTarget: true }));

    // Never let a decoy share an icon with one of this round's real
    // targets — otherwise the player sees two identical-looking shells,
    // say, and can't tell which one actually counts.
    const targetIcons = new Set(round.targets.map((t) => t.icon));
    const decoyPool = this.config.clutterTypes.filter((type) => !targetIcons.has(type));
    const decoys = Array.from({ length: round.clutterCount }, (_, i) => ({
      icon: decoyPool[i % decoyPool.length],
      isTarget: false,
    }));

    const items = this._shuffle([...targets, ...decoys]);
    const positions = this._generatePositions(items.length);

    items.forEach((item, i) => {
      const el = document.createElement('button');
      el.className = item.isTarget ? 'lagoon-item lagoon-item--subtle-pulse' : 'lagoon-item';
      el.style.left = `${positions[i].left}%`;
      el.style.top = `${positions[i].top}%`;
      // Rotation is safe on the button itself (doesn't shrink its hit
      // area) — but the visual size variance below is deliberately kept
      // OFF the button and applied to the icon graphic inside it instead.
      // CSS transform:scale() shrinks the actual tappable area along with
      // the visuals, and this scale range goes as low as 0.55 — on the
      // button itself that would leave some items with a ~24px hit box
      // well under the 44px minimum. The button stays 44x44 always; only
      // the icon inside it gets smaller or bigger.
      el.style.transform = `rotate(${positions[i].rotation}deg)`;
      el.style.animationDelay = `${Math.random() * 8}s`; // not all targets pulse in sync
      el.innerHTML = icon(item.icon);
      const scale = positions[i].scale;
      const iconEl = el.querySelector('.icon');
      if (iconEl) iconEl.style.transform = `scale(${scale})`;
      el.setAttribute('aria-label', item.isTarget ? item.label : 'Дрібниця на пляжі');

      el.addEventListener('click', () => {
        try {
          if (token !== this._runToken) return;
          this._handleTap(item, el, round, found, resolve);
        } catch (err) {
          console.error('[Lagoon] field item tap handler failed:', err);
        }
      });
      this.fieldEl.appendChild(el);
    });

    this._startHintTimers(round, found, token);
  }

  /**
   * Loose scattered layout, jittered so items don't line up neatly — later
   * rounds pack more items into the same beach area, which is exactly
   * what makes them feel "busier" and harder to scan at a glance.
   */
  /** A genuinely chaotic scatter — no columns, no rows, no fixed grid.
   *  Each item gets a fully random spot within the sand area, never on
   *  Mickey; a soft minimum-distance check keeps most items readable
   *  while still letting some sit close enough to overlap a neighbor,
   *  the way real washed-up clutter does. */
  _generatePositions(count) {
    const placed = [];
    // Mickey's own spot (left:10%, bottom:30%, 90x150px) — items keep
    // clear of this box entirely, with a little breathing room besides.
    const mickeyZone = { left: 6, right: 30, top: 44, bottom: 96 };

    const isOnMickey = (x, y) =>
      x > mickeyZone.left && x < mickeyZone.right && y > mickeyZone.top && y < mickeyZone.bottom;

    for (let i = 0; i < count; i++) {
      let best = null;
      let bestMinDist = -1;

      // A handful of random tries; keep whichever candidate ended up
      // furthest from everything already placed. This isn't a hard
      // "never overlap" rule — it just biases away from stacking
      // directly on top of another item, while still allowing the
      // occasional close, natural-looking overlap the design calls for.
      for (let attempt = 0; attempt < 10; attempt++) {
        const left = 12 + Math.random() * 76;
        // Capped at 86% (was 96%) — items placed too close to the very
        // bottom edge were reportedly disappearing off-screen on some
        // phones, likely from aspect-ratio differences eating into how
        // much of that lowest strip is actually visible.
        const top = 38 + Math.random() * 48;
        if (isOnMickey(left, top)) continue;

        const rotationMagnitude = 5 + Math.random() * 5; // exactly the requested 5-10°
        const candidate = {
          left,
          top,
          rotation: Math.random() < 0.5 ? -rotationMagnitude : rotationMagnitude,
          scale: 0.95 + Math.random() * 0.1, // a subtle 95-105%, not a dramatic size difference
        };
        const minDist = placed.reduce((min, p) => {
          const d = Math.hypot(p.left - candidate.left, (p.top - candidate.top) * 0.6);
          return Math.min(min, d);
        }, Infinity);

        if (minDist > bestMinDist) {
          bestMinDist = minDist;
          best = candidate;
        }
        if (minDist > 14) break; // good enough, stop trying
      }

      // Every attempt landed on Mickey (astronomically unlikely, but
      // never leave an item unplaced) — fall back to a safe corner.
      if (!best) best = { left: 70, top: 45, rotation: 6, scale: 1 };
      placed.push(best);
    }

    return this._shuffle(placed);
  }

  _shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  _handleTap(item, el, round, found, resolve) {
    if (item.isTarget) {
      this._collectTarget(item, el, round, found, resolve);
    } else {
      this.audio.tap();
      el.classList.remove('is-decoy-tapped');
      void el.offsetWidth;
      el.classList.add('is-decoy-tapped');
    }
  }

  /** A found item gets a quick pop, its panel card gets stamped "FOUND". */
  _collectTarget(target, el, round, found, resolve) {
    if (found.has(target.id)) return; // already collected
    found.add(target.id);
    this.audio.win();

    el.classList.add('is-collected');
    setTimeout(() => el.remove(), 400);

    const card = this.panelCardsEl.querySelector(`[data-target-id="${target.id}"]`);
    card?.classList.add('is-found');

    clearTimeout(this._talkHintTimer);
    clearTimeout(this._shimmerHintTimer);

    if (found.size === round.targets.length) {
      this.fieldEl.style.pointerEvents = 'none';
      this._pendingResolve = null;
      resolve(true);
    } else {
      this._startHintTimers(round, found, this._runToken);
    }
  }

  /**
   * Two-stage hint: a spoken nudge first, and — if the player is still
   * stuck a good while later — one of the missing items starts to
   * shimmer softly.
   */
  _startHintTimers(round, found, token) {
    clearTimeout(this._talkHintTimer);
    clearTimeout(this._shimmerHintTimer);

    this._talkHintTimer = setTimeout(async () => {
      if (token !== this._runToken || found.size === round.targets.length) return;
      const line = this.config.hintLines[Math.floor(Math.random() * this.config.hintLines.length)];
      this.dialogEl.classList.remove('dialog--hidden');
      await typeText(this.dialogTextEl, line);
      setTimeout(() => { if (token === this._runToken) this.dialogEl.classList.add('dialog--hidden'); }, 2400);
    }, this.config.hintTalkDelayMs);

    this._shimmerHintTimer = setTimeout(() => {
      if (token !== this._runToken || found.size === round.targets.length) return;
      const remaining = round.targets.filter((t) => !found.has(t.id));
      if (remaining.length === 0) return;

      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      const targetEl = Array.from(this.fieldEl.children).find(
        (el) => el.getAttribute('aria-label') === pick.label
      );
      targetEl?.classList.add('is-hinting');
      setTimeout(() => targetEl?.classList.remove('is-hinting'), 4000);
    }, this.config.hintShimmerDelayMs);
  }

  /** All three rounds solved: the panel closes, Mickey celebrates. */
  async _playWinSequence() {
    debugLog('[Lagoon] _playWinSequence: started');
    this.state = 'WIN';
    this._setInputBlocked(true); // nothing should be tappable during the celebration either
    this.panelEl.classList.remove('is-visible');
    await wait(600);
    debugLog('[Lagoon] _playWinSequence: initial wait done');

    this.audio.chest();
    this.audio.lagoonSignature();
    this.camera.focus({ scale: 1.08, x: '0%', y: '-2%' }); // a small pull-back, not a push-in

    this.dialogEl.classList.remove('dialog--hidden');
    await typeText(this.dialogTextEl, this.config.winLine);
    await wait(1400);
    debugLog('1. Win animation finished');
    debugLog('[Lagoon] _playWinSequence: win line shown, calling _exit(REWARD)');

    debugLog('2. Calling _exit(REWARD)');
    await this._exit(SCENES.REWARD, { adventureId: 'lagoon' });
    debugLog('3. _exit returned');
    debugLog('[Lagoon] _playWinSequence: _exit(REWARD) returned normally');
  }
}
