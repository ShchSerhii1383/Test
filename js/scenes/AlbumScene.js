import { GIFTS } from '../data/gifts.js';
import { JOURNEY_COMPLETE, SECRET_BONUS } from '../data/dialogs.js';
import { SCENES, MICKEY_STATES } from '../config/constants.js';
import { icon } from '../components/icons.js';
import { wait } from '../utils/typewriter.js';
import { debugLog } from '../utils/debugLog.js';

/**
 * AlbumScene — "Every Journey Leaves a Memory"
 * --------------------------------------------
 * The closing scene. Not a results screen and not another puzzle: the
 * game stops asking anything of the player here and simply says thank
 * you.
 *
 * Two rules shape everything below. First, the island stays alive —
 * waves move, fireflies drift, a star falls now and then — because a
 * frozen end-card would undo the "this is a place" feeling the whole
 * game has been building. Second, nothing is rushed: the journal opens
 * slowly, the photos land one at a time, and the button to leave
 * doesn't appear until there has been time to actually read.
 *
 * State machine: ARRIVE -> JOURNAL -> READING -> CLOSING -> EXIT.
 */
export class AlbumScene {
  constructor(sceneEl, sceneManager, saveManager, mickey, audio) {
    this.sceneEl = sceneEl;
    this.sceneManager = sceneManager;
    this.saveManager = saveManager;
    this.mickey = mickey;
    this.audio = audio;

    this.journalEl = sceneEl.querySelector('#album-journal');
    this.titleEl = sceneEl.querySelector('#album-journal-title');
    this.subtitleEl = sceneEl.querySelector('#album-journal-subtitle');
    this.taglineEl = sceneEl.querySelector('#album-journal-tagline');
    this.photosEl = sceneEl.querySelector('#album-photos');
    this.letterEl = sceneEl.querySelector('#album-letter');
    this.continueBtn = sceneEl.querySelector('#album-continue');
    this.starfieldEl = sceneEl.querySelector('#album-starfield');
    this.shootingStarEl = sceneEl.querySelector('#album-shooting-star');
    this.mickeySpotEl = sceneEl.querySelector('#album-mickey-spot');

    this.continueBtn.addEventListener('click', () => this._finish());

    this._runToken = 0;
    this.state = 'ARRIVE';
    this._mickeyMoodTimer = null;
    this._shootingStarTimer = null;
  }

  async enter() {
    try {
      await this._enterInner();
    } catch (err) {
      // Even if the ceremony breaks, the player should still reach the
      // very last beat rather than being stranded on a half-built page.
      console.error('AlbumScene.enter() failed partway through:', err);
      await this._exit(SCENES.FINALE);
    }
  }

  /** The ONLY place allowed to call sceneManager.goTo(). */
  async _exit(targetScene) {
    if (this.state === 'EXIT') return;
    this.state = 'EXIT';
    await this.sceneManager.goTo(targetScene);
  }

  async _enterInner() {
    const token = ++this._runToken;
    this._resetVisualState();

    this.mickeySpotEl.appendChild(this.mickey.el);
    this._scatterStars(46);
    this._startShootingStars();

    // Stage 1: the camera settles back down onto the island after the
    // constellation. Nothing else happens while it does.
    this.sceneEl.classList.add('is-settled');
    await wait(2400);
    if (token !== this._runToken) return;

    // Stage 2: Mickey looks up at the stars he just helped light, then
    // turns to the player.
    this.mickey.play(MICKEY_STATES.TELESCOPE);
    await wait(1800);
    if (token !== this._runToken) return;
    this.mickey.play(MICKEY_STATES.HAPPY);
    await wait(900);
    if (token !== this._runToken) return;

    // Stage 3: the journal opens, slowly.
    this.state = 'JOURNAL';
    this.titleEl.textContent = JOURNEY_COMPLETE.title;
    this.subtitleEl.textContent = JOURNEY_COMPLETE.subtitle;
    this.taglineEl.textContent = JOURNEY_COMPLETE.tagline;
    this.journalEl.classList.add('is-open');
    this.audio.tap();
    await wait(1600);
    if (token !== this._runToken) return;

    // Stage 4: the photos land on the page, one at a time.
    await this._dropPhotos(token);
    if (token !== this._runToken) return;

    // Stage 5: the letter.
    this._renderLetter();
    this.letterEl.classList.add('is-visible');
    this.state = 'READING';

    // Stage 6: Mickey keeps living while the player reads.
    this._startMickeyMoods();

    // Stage 9: only after there's genuinely been time to read does the
    // way out appear.
    await wait(4200);
    if (token !== this._runToken) return;
    this.continueBtn.textContent = JOURNEY_COMPLETE.buttonLabel;
    this.continueBtn.classList.add('is-visible');
    debugLog('[Album] final page fully assembled');
  }

  async exit() {
    this._runToken += 1;
    // An emptied container hides a Lottie but doesn't stop it — without
    // this its animation loop runs for the rest of the session.
    (this._liveAnimations ?? []).forEach((a) => { try { a.destroy(); } catch { /* already gone */ } });
    this._liveAnimations = [];
    clearTimeout(this._mickeyMoodTimer);
    clearTimeout(this._shootingStarTimer);
  }

  _resetVisualState() {
    this.state = 'ARRIVE';
    this.sceneEl.classList.remove('is-settled', 'is-closing');
    this.journalEl.classList.remove('is-open');
    this.photosEl.innerHTML = '';
    this.letterEl.innerHTML = '';
    this.letterEl.classList.remove('is-visible');
    this.continueBtn.classList.remove('is-visible');
    this.starfieldEl.innerHTML = '';
    clearTimeout(this._mickeyMoodTimer);
    clearTimeout(this._shootingStarTimer);
  }

  _scatterStars(count) {
    this.starfieldEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'album-star';
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 100}%`;
      el.style.animationDelay = `${Math.random() * 5}s`;
      el.style.animationDuration = `${3 + Math.random() * 4}s`;
      this.starfieldEl.appendChild(el);
    }
  }

  /** A star falls now and then — never on a predictable beat. */
  _startShootingStars() {
    const schedule = () => {
      this._shootingStarTimer = setTimeout(() => {
        this.shootingStarEl.classList.remove('is-falling');
        void this.shootingStarEl.offsetWidth;
        this.shootingStarEl.style.top = `${5 + Math.random() * 30}%`;
        this.shootingStarEl.style.left = `${40 + Math.random() * 45}%`;
        this.shootingStarEl.classList.add('is-falling');
        schedule();
      }, 6000 + Math.random() * 9000);
    };
    schedule();
  }

  /**
   * The gifts from the journey, as polaroids Mickey just laid out —
   * each one tilted a little differently, landing 0.4s apart. Tapping
   * one lifts it for a closer look, tapping again puts it back.
   */
  async _dropPhotos(token) {
    this.photosEl.innerHTML = '';
    const claimedIds = this.saveManager.claimedGifts;
    const claimed = GIFTS.filter((g) => claimedIds.includes(g.id));

    // If somehow nothing was claimed, still show something rather than
    // an empty page — the ending shouldn't look broken.
    const photos = claimed.length ? claimed : GIFTS.slice(0, 3);

    // Whoever found the island's hidden secrets gets one more photo than
    // everyone else — the quiet payoff for having looked closely.
    if (this.saveManager.hasSecretBonus) {
      photos.push(SECRET_BONUS);
    }

    const tilts = ['-6deg', '4deg', '-3deg', '7deg'];

    for (let i = 0; i < photos.length; i++) {
      if (token !== this._runToken) return;
      const gift = photos[i];

      const el = document.createElement('button');
      el.className = 'album-photo';
      el.style.setProperty('--photo-tilt', tilts[i % tilts.length]);
      el.setAttribute('aria-label', gift.title);
      el.innerHTML = `
        <span class="album-photo__frame">
          <span class="album-photo__image" data-anim-host>${icon(gift.icon)}</span>
          <span class="album-photo__caption">${gift.title}</span>
        </span>
      `;
      el.addEventListener('click', () => {
        // One at a time: lifting a new photo puts any other one back.
        this.photosEl.querySelectorAll('.album-photo.is-lifted').forEach((other) => {
          if (other !== el) other.classList.remove('is-lifted');
        });
        el.classList.toggle('is-lifted');
        this.audio.tap();
      });

      this.photosEl.appendChild(el);
      // Force the browser to notice the element before animating it in,
      // otherwise all three can appear at once instead of in turn.
      void el.offsetWidth;
      el.classList.add('is-landed');
      this.audio.tap();

      // The polaroid shows the same animation the player watched when
      // they opened this gift, not a flat stand-in for it — otherwise
      // the closing page quietly contradicts what they remember. Fire
      // and forget: the drawn icon is already in place underneath, so a
      // slow or failed load just leaves the page as it was.
      this._playPhotoAnimation(el.querySelector('[data-anim-host]'), gift);

      await wait(400);
    }
  }

  /**
   * Plays a gift's Lottie inside its polaroid. Deliberately its own
   * small copy of the logic rather than a shared module: RewardScene's
   * version is entangled with prefetching and the reveal panel, and one
   * abstraction serving two quite different moments would be worse than
   * these few lines.
   */
  async _playPhotoAnimation(hostEl, gift) {
    if (!hostEl || typeof fetch !== 'function') return;
    const name = gift.animation;
    if (!name) return; // e.g. the secret bonus, which has no animation

    try {
      const res = await fetch(`assets/animations/${name}.json`);
      if (!res.ok) {
        console.warn(`[Album] animation "${name}.json" returned ${res.status} — keeping the drawn icon.`);
        return;
      }
      const animationData = await res.json();
      if (!window.lottie) return; // already warned about by RewardScene

      hostEl.innerHTML = '';
      const anim = window.lottie.loadAnimation({
        container: hostEl,
        renderer: 'svg',
        loop: true, // it's a photo on a page now, not a one-off reveal
        autoplay: true,
        animationData,
      });
      (this._liveAnimations ||= []).push(anim);
    } catch (err) {
      console.warn(`[Album] animation "${name}.json" failed:`, err.message);
    }
  }

  _renderLetter() {
    this.letterEl.innerHTML = '';
    JOURNEY_COMPLETE.letter.forEach((line, i) => {
      const p = document.createElement('p');
      p.className = 'album-letter__line';
      p.style.animationDelay = `${i * 0.25}s`;
      p.textContent = line;
      this.letterEl.appendChild(p);
    });
  }

  /**
   * While the player reads, Mickey keeps doing small, quiet things —
   * looking at the photos, checking his compass, watching the sea,
   * glancing back. Never anything sudden.
   */
  _startMickeyMoods() {
    const moods = [
      MICKEY_STATES.READING,
      MICKEY_STATES.IDLE,
      MICKEY_STATES.TELESCOPE,
      MICKEY_STATES.HAPPY,
      MICKEY_STATES.IDLE,
    ];
    let i = 0;

    const next = () => {
      this.mickey.play(moods[i % moods.length]);
      i += 1;
      this._mickeyMoodTimer = setTimeout(next, 3200 + Math.random() * 2400);
    };
    next();
  }

  /**
   * The journal closes, Mickey says his goodbye, and the camera pulls
   * back off the island before the very last beat.
   */
  async _finish() {
    if (this.state !== 'READING') return;
    this.state = 'CLOSING';
    const token = this._runToken;
    clearTimeout(this._mickeyMoodTimer);

    this.continueBtn.classList.remove('is-visible');
    this.journalEl.classList.remove('is-open');
    this.audio.tap();
    await wait(1200);
    if (token !== this._runToken) return;

    // Mickey takes out his compass, looks at it, closes it, and waves.
    this.mickey.el.classList.add('is-compass-glowing');
    this.mickey.play(MICKEY_STATES.READING);
    await wait(1400);
    if (token !== this._runToken) return;
    this.mickey.el.classList.remove('is-compass-glowing');
    this.mickey.play(MICKEY_STATES.WAVE);
    await wait(1600);
    if (token !== this._runToken) return;

    // The camera drifts back to take in the whole night island, and the
    // scene fades away with it.
    this.sceneEl.classList.add('is-closing');
    await wait(2600);
    if (token !== this._runToken) return;

    await this._exit(SCENES.FINALE);
  }
}
