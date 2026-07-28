import { SCENES, MICKEY_STATES } from '../config/constants.js';
import { wait } from '../utils/typewriter.js';
import { icon } from '../components/icons.js';
import { renderChest } from '../components/chestSprite.js';
import { debugLog } from '../utils/debugLog.js';
import { ANCIENT_SYMBOLS } from '../data/dialogs.js';

/**
 * RewardScene
 * -----------
 * The universal gift moment, shared by every adventure.
 *
 * This is the emotional core of the whole game — the brief is explicit that
 * opening the gift should feel bigger than the mini-game that earned it.
 * So the pacing here is deliberate: anticipation, a beat of silence, light,
 * and only then the gift. Nothing in this scene is rushed, and the timings
 * below are the point of it rather than an implementation detail.
 *
 *   countdown -> chest -> tap -> lid + light -> three cards -> pick
 *   -> flip -> PAUSE -> reveal -> back to the island
 */
export class RewardScene {
  /**
   * @param {HTMLElement} sceneEl
   * @param {import('../systems/SceneManager.js').SceneManager} sceneManager
   * @param {import('../systems/GiftManager.js').GiftManager} giftManager
   * @param {import('../systems/SaveManager.js').SaveManager} saveManager
   * @param {import('../components/Mickey.js').Mickey} mickey
   */
  constructor(sceneEl, sceneManager, giftManager, saveManager, mickey, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.giftManager = giftManager;
    this.saveManager = saveManager;
    this.mickey = mickey;
    this.audio = audio;

    this.countdownEl = sceneEl.querySelector('#reward-countdown');
    this.symbolEl = sceneEl.querySelector('#reward-symbol');
    this.symbolPathEl = sceneEl.querySelector('#reward-symbol-path');
    this.symbolNameEl = sceneEl.querySelector('#reward-symbol-name');
    this.focusOverlayEl = sceneEl.querySelector('.reward-focus-overlay');
    this.ambientParticlesEl = sceneEl.querySelector('#reward-ambient-particles');
    this.boxEl = sceneEl.querySelector('#reward-box');
    this.openBtn = sceneEl.querySelector('#reward-open-btn');
    this.rewardArtEl = sceneEl.querySelector('.reward-box__art');
    this.beamEl = sceneEl.querySelector('#reward-beam');
    this.beamLeftEl = sceneEl.querySelector('#reward-beam-left');
    this.beamRightEl = sceneEl.querySelector('#reward-beam-right');
    this.sparklesEl = sceneEl.querySelector('#reward-sparkles');
    this.cardsEl = sceneEl.querySelector('#reward-cards');
    this.revealEl = sceneEl.querySelector('#reward-reveal');
    this.revealIconEl = sceneEl.querySelector('#reward-reveal-icon');
    this.revealTitleEl = sceneEl.querySelector('#reward-reveal-title');
    this.revealMessageEl = sceneEl.querySelector('#reward-reveal-message');
    this.continueBtn = sceneEl.querySelector('#reward-continue');

    this.boxEl.addEventListener('click', () => this._openChest());
    this.openBtn.addEventListener('click', () => this._openChest());
    this.continueBtn.addEventListener('click', () => this._finish());

    this._adventureId = null;

    // Guards against double-taps *within* one visit. Reset on every enter()
    // and exit(), so a sequence that gets interrupted can never leave the
    // scene permanently locked — that would look like the chest simply
    // refusing to open, with nothing on screen explaining why.
    this._isBusy = false;

    // Bumped on every enter(). A stray timer from a previous visit compares
    // its token and bows out instead of touching the new run's state.
    this._runToken = 0;

    // State machine: COUNTDOWN -> CHEST -> CARDS -> REVEAL -> EXIT. Only
    // the EXIT state may ever call sceneManager.goTo() — see _exit()
    // below. This scene used to have goTo() reachable from two
    // independent places (the enter() catch fallback, and _finish()),
    // which is exactly the "more than one way out" the Blueprint rules
    // out.
    this.state = 'COUNTDOWN';
  }

  /** @param {{adventureId: string}} data */
  async enter(data = {}) {
    try {
      await this._enterInner(data);
    } catch (err) {
      // Better to skip the gift-picking moment than strand the player on
      // a broken reward screen — at least the adventure still counts as
      // done and they're back somewhere they can keep playing.
      console.error('[Reward] enter() FALLBACK TRIGGERED — _enterInner() threw:', err);
      if (this._adventureId) {
        this.saveManager.markCompleted(this._adventureId);
      }
      await this._exit(SCENES.ISLAND, { returningFrom: this._adventureId });
    }
  }

  /**
   * The ONLY place in this scene allowed to call sceneManager.goTo().
   * The state===EXIT guard makes a second call (say, _finish() firing
   * right after an error fallback already left) a harmless no-op instead
   * of a second competing transition.
   */
  async _exit(targetScene, data) {
    if (this.state === 'EXIT') return;
    this.state = 'EXIT';
    await this.sceneManager.goTo(targetScene, data);
  }

  async _enterInner(data = {}) {
    debugLog('4. enter()');
    debugLog('[Reward] _enterInner: started', data);
    this._resetState();
    this._adventureId = data.adventureId ?? null;
    this._isBusy = false;
    const token = ++this._runToken;

    // Defensive safety net: an adventure's own input-guard should already
    // clear itself on exit(), but this scene is the one moment that
    // absolutely must never be silently blocked — so clear every
    // adventure's guard here too, regardless of whether that already
    // happened correctly upstream. Belt and suspenders: this can never
    // hurt (there's nothing else on screen for it to interfere with),
    // and it guarantees the chest is reachable no matter what.
    document.querySelectorAll('.adventure-input-guard').forEach((el) => {
      el.classList.remove('is-active');
    });

    // Same chest they tapped on the island, not a generic one — the theme
    // comes straight from which adventure just finished.
    renderChest(this.rewardArtEl, this._adventureId);
    debugLog('[Reward] chest theme rendered for', this._adventureId);

    this._resetVisualState();
    this._scatterAmbientParticles(10);
    await this._runCountdown();
    debugLog('5. countdown finished');
    debugLog('[Reward] countdown done');
    if (token !== this._runToken) return; // a newer visit started meanwhile

    await this._revealAncientSymbol(token);
    if (token !== this._runToken) return;

    this.state = 'CHEST';
    this.boxEl.classList.add('is-visible');
    this.openBtn.classList.add('is-visible');
    this.mickey.hush();
    debugLog('[Reward] _enterInner: finished, chest is now visible and tappable');
  }


  /** Leave nothing behind: the next adventure gets a clean scene. */
  async exit() {
    this._runToken += 1;
    this._isBusy = false;
    this._resetVisualState();
  }

  _resetState() {
    this.state = 'COUNTDOWN';
  }

  _resetVisualState() {
    this.boxEl.classList.remove('is-visible', 'is-open', 'is-gone', 'is-glowing');
    this.openBtn.classList.remove('is-visible');
    this.beamEl.classList.remove('is-shining');
    this.beamLeftEl.classList.remove('is-shining');
    this.beamRightEl.classList.remove('is-shining');
    this.sparklesEl.innerHTML = '';
    this.ambientParticlesEl.innerHTML = '';
    this.focusOverlayEl.classList.remove('is-focused');
    this.cardsEl.classList.remove('is-visible');
    this.cardsEl.innerHTML = '';
    this.revealEl.classList.remove('is-visible');
    this.countdownEl.classList.remove('is-visible');
    this.symbolEl.classList.remove('is-visible');
    this.continueBtn.classList.remove('is-visible');
    this.continueBtn.style.pointerEvents = '';

    // Force the browser to drop the finished animations before we re-add the
    // classes, otherwise the second chest can come back already "open".
    void this.boxEl.offsetWidth;
  }

  /** 3-2-1. Short on purpose: anticipation, not a wait. */
  /**
   * The story beat that ties the three adventures together: before the
   * chest even appears, the ancient symbol this adventure was guarding
   * surfaces, and Mickey reads it aloud. By the third one the player
   * should already suspect they're all pointing at the same thing —
   * which is exactly what the constellation then turns out to be.
   */
  async _revealAncientSymbol(token) {
    const symbol = ANCIENT_SYMBOLS[this._adventureId];
    if (!symbol) return; // unknown adventure — skip rather than break the flow

    this.symbolPathEl.setAttribute('d', symbol.path);
    this.symbolNameEl.textContent = symbol.name;
    this.symbolEl.classList.add('is-visible');

    // The third sign is the turning point — it's where the player
    // realizes all three were pointing at one thing. It shouldn't sound
    // like the first two did: that flattens the story's own climax into
    // a repeated notification chime.
    const isFinalSign = this._adventureId === 'bazaar';
    if (isFinalSign) {
      this.audio.fanfare();
    } else {
      this.audio.crystalTone(523);
    }

    this.mickey.say(symbol.line, 2600);

    await wait(2600);
    if (token !== this._runToken) return;
    this.symbolEl.classList.remove('is-visible');
    await wait(500);
  }

  async _runCountdown() {
    for (const step of ['3', '2', '1']) {
      this.countdownEl.textContent = step;
      this.countdownEl.classList.remove('is-visible');
      void this.countdownEl.offsetWidth; // restart the animation each time
      this.countdownEl.classList.add('is-visible');
      await wait(650);
    }
    this.countdownEl.classList.remove('is-visible');
  }

  /** The lid swings open, light pours out, sparkles scatter. */
  async _openChest() {
    // Not just a double-tap guard: this refuses to act unless the scene
    // is genuinely in the state that's supposed to allow it — the same
    // discipline as every adventure's single _exit() gateway. CSS
    // pointer-events already blocks a tap before the chest's own
    // countdown finishes, but that's presentation, not logic; a tap that
    // somehow reaches this handler early (a real-browser timing edge, or
    // a future change to the CSS) still shouldn't be able to open the
    // chest ahead of schedule.
    if (this._isBusy || this.state !== 'CHEST') return;
    this._isBusy = true;
    const token = this._runToken;
    debugLog('6. chest opened');
    debugLog('[Reward] _openChest: tapped, starting open sequence');

    try {
      // Stage 1: the "camera" focuses in — the island backdrop stays
      // visible but the whole scene darkens and blurs toward the chest.
      this.focusOverlayEl.classList.add('is-focused');
      this.openBtn.classList.remove('is-visible');
      await wait(500);
      if (token !== this._runToken) return;

      // Stage 2: gold light grows through the chest's own seams before
      // anything opens — the anticipation beat, not an instant reaction.
      this.boxEl.classList.add('is-glowing');
      this.audio.chest();
      await wait(1100);
      if (token !== this._runToken) { debugLog('[Reward] _openChest: stale token after glow delay, aborting'); return; }

      // Stage 3: the lid opens — and then everything simply stops.
      // The chest's idle bobbing is killed here (see .reward-box.is-open)
      // so this is real stillness, not a pause with something twitching
      // in it. This held beat is the whole trick: a reward feels
      // valuable in proportion to how long the game is willing to wait
      // before showing it.
      this.boxEl.classList.add('is-open');
      this.audio.tap();
      // 1300ms, not 950: the lid itself takes 450ms to swing open, so a
      // shorter hold would be mostly lid-still-moving rather than the
      // stillness this beat is for. This way roughly a full second of
      // genuine quiet lands after it settles.
      await wait(1300);
      if (token !== this._runToken) { debugLog('[Reward] _openChest: stale token after lid pause, aborting'); return; }

      // Stage 4: only now does the light come out.
      this.beamEl.classList.add('is-shining');
      this.beamLeftEl.classList.add('is-shining');
      this.beamRightEl.classList.add('is-shining');
      this._scatterSparkles(14);
      await wait(750);
      if (token !== this._runToken) { debugLog('[Reward] _openChest: stale token after beam delay, aborting'); return; }

      // Stage 5: and the light is allowed to just sit there. Nothing is
      // asked of the player, nothing is advancing — the second held beat.
      await wait(850);
      if (token !== this._runToken) { debugLog('[Reward] _openChest: stale token after light pause, aborting'); return; }

      this.boxEl.classList.add('is-gone');
      await wait(400);
      if (token !== this._runToken) { debugLog('[Reward] _openChest: stale token after chest-gone delay, aborting'); return; }

      // Stage 4: the cards don't just appear — they fly up out of the
      // chest, then settle into their arc. See the card-fly-out keyframe.
      debugLog('7. cards rendered');
      debugLog('[Reward] _openChest: about to render cards');
      this._renderCards();
      this.cardsEl.classList.add('is-visible');
      this.state = 'CARDS';
      debugLog('8. cards visible');
      debugLog('[Reward] _openChest: cards rendered and visible —', this.cardsEl.children.length, 'cards');
    } catch (err) {
      // This used to be a bare try/finally with no catch — an exception
      // here (e.g. inside _renderCards) would silently become an
      // unhandled rejection, since this runs from a click handler, not
      // from the enter() chain that has its own try/catch. That meant
      // "the chest opens but cards never appear" could fail completely
      // silently. Now it's at least loud and clear about where it broke.
      console.error('[Reward] _openChest: failed partway through:', err);
    } finally {
      // Whatever happened above, the scene stays usable.
      this._isBusy = false;
    }
  }

  /**
   * Sparkles are made here rather than in the markup so their positions
   * differ every time — repeating the exact same burst reads as canned.
   */
  _scatterSparkles(count) {
    this.sparklesEl.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const sparkEl = document.createElement('span');
      sparkEl.className = 'sparkle';
      sparkEl.style.left = `${20 + Math.random() * 60}%`;
      sparkEl.style.setProperty('--drift', `${(Math.random() - 0.5) * 90}px`);
      sparkEl.style.setProperty('--rise', `${70 + Math.random() * 80}px`);
      sparkEl.style.animationDelay = `${Math.random() * 0.5}s`;
      this.sparklesEl.appendChild(sparkEl);
    }
  }

  /**
   * Small gold particles drifting slowly through the whole scene,
   * independent of the chest's own sparkle burst — part of the
   * background atmosphere, not a one-off effect tied to a single action.
   */
  _scatterAmbientParticles(count) {
    this.ambientParticlesEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'reward-ambient-particle';
      el.style.left = `${10 + Math.random() * 80}%`;
      el.style.top = `${20 + Math.random() * 65}%`;
      el.style.setProperty('--particle-drift-x', `${(Math.random() - 0.5) * 40}px`);
      el.style.animationDuration = `${7 + Math.random() * 5}s`;
      el.style.animationDelay = `${Math.random() * 6}s`;
      this.ambientParticlesEl.appendChild(el);
    }
  }

  /** Three face-down cards. What's on them stays hidden until one is picked. */
  _renderCards() {
    const gifts = this.giftManager.pickGifts(3);
    this.cardsEl.innerHTML = '';

    // Every candidate's animation starts downloading NOW, while the
    // cards are still face-down and the player is deciding. They're
    // 200-600KB each and the card's face appears only 700ms after a
    // tap — fetching at pick-time meant the animation regularly lost
    // that race and the drawn fallback icon showed instead. Prefetching
    // all three costs bandwidth that a full playthrough would spend
    // anyway, and buys seconds of head start.
    this._animationCache = new Map();
    gifts.forEach((gift) => {
      this._animationCache.set(gift.id, this._fetchGiftAnimation(gift));
    });

    gifts.forEach((gift, i) => {
      const wrapEl = document.createElement('div');
      wrapEl.className = 'reward-card-slot';
      wrapEl.style.animationDelay = `${i * 0.12}s`;

      const cardEl = document.createElement('button');
      cardEl.className = 'reward-card';
      cardEl.style.setProperty('--card-tilt', ['-5deg', '0deg', '6deg'][i] ?? '0deg');
      cardEl.setAttribute('aria-label', 'Обрати картку');
      cardEl.innerHTML = `
        <span class="reward-card__inner">
          <span class="reward-card__face reward-card__back">
            <svg class="reward-card__back-emblem" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.4"/>
              <path d="M12 6 L14 11 L12 18 L10 11Z" fill="currentColor"/>
            </svg>
            <span class="reward-card__back-mark">?</span>
          </span>
          <span class="reward-card__face reward-card__front"><span class="reward-card__anim" data-anim-host>${icon(gift.icon)}</span></span>
        </span>
      `;

      // An explicit, unambiguous button below the card — a second
      // guaranteed way to choose it, same reasoning as the chest's own
      // open button above.
      const openBtn = document.createElement('button');
      openBtn.className = 'reward-card-slot__open-btn wooden-button is-visible';
      openBtn.innerHTML = '<svg viewBox="0 0 24 24" class="reward-open-symbol" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="currentColor"/></svg>';
      openBtn.setAttribute('aria-label', 'Відкрити картку');

      const choose = () => this._chooseGift(gift, cardEl);
      cardEl.addEventListener('click', choose);
      openBtn.addEventListener('click', choose);

      wrapEl.appendChild(cardEl);
      wrapEl.appendChild(openBtn);
      this.cardsEl.appendChild(wrapEl);
    });
  }

  /**
   * The chosen card flips, the others bow out, and then — nothing, for a
   * moment. That silence before the gift appears is doing more work than
   * any animation in this scene.
   */
  /**
   * Loads and plays the chosen gift's Lottie animation.
   *
   * Deliberately lazy: the nine animations total nearly 4MB, so fetching
   * them upfront would stall the whole game on a phone. Only the card the
   * player actually picked is ever fetched, and the parsed data is kept
   * so the reveal panel can reuse it without a second request.
   *
   * Every failure path here is silent by design — a missing file, a
   * blocked CDN, an offline phone — because the drawn icon is already
   * sitting underneath as the fallback. A reward that quietly looks
   * slightly plainer beats a reward that breaks.
   *
   * @returns {Promise<object|null>} the parsed animation data, or null
   */
  async _fetchGiftAnimation(gift) {
    const name = this.giftManager.animationFor?.(gift.id);
    if (!name || typeof fetch !== 'function') return null;
    try {
      const res = await fetch(`assets/animations/${name}.json`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null; // offline, blocked, missing — the drawn icon covers it
    }
  }

  /**
   * Plays the chosen gift's animation, using the copy already fetched
   * when the cards were dealt. Returns the data so the reveal panel can
   * reuse it without a second request.
   */
  async _playGiftAnimation(hostEl, gift) {
    if (!hostEl) return null;

    const pending = this._animationCache?.get(gift.id) ?? this._fetchGiftAnimation(gift);
    const animationData = await pending;
    if (!animationData) return null;

    this._replayGiftAnimation(hostEl, animationData);
    return animationData;
  }

  /** Plays already-fetched animation data, without re-requesting it. */
  _replayGiftAnimation(hostEl, animationData) {
    if (!hostEl || !animationData || !window.lottie) return;
    try {
      hostEl.innerHTML = '';
      window.lottie.loadAnimation({
        container: hostEl,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        animationData,
      });
    } catch {
      // Same reasoning as above — never let decoration break the reward.
    }
  }

  async _chooseGift(gift, cardEl) {
    // Same reasoning as _openChest — the state check is the real gate,
    // CSS pointer-events is just the presentation layer on top of it.
    if (this._isBusy || this.state !== 'CARDS') return;
    this._isBusy = true;
    const token = this._runToken;
    debugLog('[Reward] _chooseGift: card tapped, gift =', gift.id);

    try {
      this.giftManager.claim(gift.id);

      this.cardsEl.querySelectorAll('.reward-card-slot').forEach((slotEl) => {
        if (slotEl.contains(cardEl)) return;
        slotEl.classList.add('is-dismissed');
      });

      this.audio.tap();
      this.mickey.play(MICKEY_STATES.POINT); // looking right at the card as it flips
      cardEl.classList.add('is-chosen');

      // Started here rather than after the flip: the fetch and the
      // 700ms flip overlap, so by the time the card's face is showing
      // the animation is usually already running on it.
      const animHost = cardEl.querySelector('[data-anim-host]');
      const animPromise = this._playGiftAnimation(animHost, gift);

      await wait(700); // let the flip land
      if (token !== this._runToken) { debugLog('[Reward] _chooseGift: stale token after flip, aborting'); return; }

      this.cardsEl.classList.remove('is-visible');
      await wait(900); // the cinematic pause
      if (token !== this._runToken) { debugLog('[Reward] _chooseGift: stale token after pause, aborting'); return; }

      // The card's animation carries over into the reveal, reusing the
      // data already fetched above rather than asking for it again.
      const animationData = await animPromise;
      this.revealIconEl.innerHTML = icon(gift.icon); // fallback, replaced below if the animation loaded
      if (animationData) this._replayGiftAnimation(this.revealIconEl, animationData);
      this.revealTitleEl.textContent = gift.title;
      this.revealMessageEl.textContent = gift.message;
      this.revealEl.classList.add('is-visible');
      this.mickey.play(MICKEY_STATES.CELEBRATE);
      this.state = 'REVEAL';
      debugLog('[Reward] _chooseGift: reveal is now visible');

      // The button doesn't even appear for a full second after the gift
      // is shown — the pause is the point: let the player actually see
      // what they got before anything invites them to move on.
      setTimeout(() => {
        if (token !== this._runToken) return;
        this.continueBtn.classList.add('is-visible');
      }, 1000);
    } catch (err) {
      // Same reasoning as _openChest: this is a click-handler call, not
      // part of the enter() chain, so a silent try/finally here would
      // have swallowed any error as an unhandled rejection with the
      // reveal simply never appearing and no clue why.
      console.error('[Reward] _chooseGift: failed partway through:', err);
    } finally {
      this._isBusy = false;
    }
  }

  _finish() {
    // The most important state check of the three: this is the actual
    // exit trigger. Refusing unless we're genuinely in REVEAL means a
    // premature tap on "Далі" — before a gift has actually been chosen
    // and shown — can never leave the scene early, regardless of
    // whatever let the tap reach this handler in the first place.
    if (this.state !== 'REVEAL') return;
    debugLog('[Reward] _finish: continue button tapped, returning to island');
    const finishedAdventure = this._adventureId;
    if (finishedAdventure) {
      this.saveManager.markCompleted(finishedAdventure);
    }
    return this._exit(SCENES.ISLAND, { returningFrom: finishedAdventure });
  }
}
