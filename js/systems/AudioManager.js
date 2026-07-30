/**
 * AudioManager
 * ------------
 * Sound for the island. Two sources, deliberately:
 *
 * 1. The sea, bird calls, a soft ukulele phrase, and every interaction sound
 *    are SYNTHESISED in the browser with the Web Audio API. No files,
 *    nothing to download, works offline. Bird calls and ukulele notes fire
 *    at random intervals rather than looping, so the background never
 *    settles into a pattern you start to notice.
 *
 * 2. A full music track (if you ever want one) can be dropped into
 *    assets/audio/ as a file — see playMusic() below. If the file isn't
 *    there, nothing breaks: the sea, birds and ukulele already carry the
 *    background on their own.
 *
 * The brief asks for background sound that is "almost unnoticeable" and no
 * sharp effects, so every level here is low and every sound is soft-edged.
 *
 * Browsers refuse to play audio until the user has interacted with the page,
 * so nothing starts until unlock() is called from a real tap.
 */

const VOLUMES = {
  sea: 0.05,      // barely there, as asked
  music: 0.13,    // 10-15% asked for — just a background presence
  effects: 0.13,
  wind: 0.045,
};

/**
 * How loud each ambient layer sits in each scene, as a multiplier of its
 * base volume. Until this existed, every scene shared one mix: the beach
 * played identically on a mountain, in a candlelit study and under the
 * night sky, which is the single biggest reason the sound didn't
 * reinforce where you were.
 *
 * `birds` and `ukulele` double as probabilities — the schedulers keep
 * running but skip a turn based on these, so a scene can thin them out
 * rather than only having them fully on or fully off.
 */
const AMBIENT_MIXES = {
  island:       { sea: 1,    birds: 1,   ukulele: 1,   wind: 0 },
  // Ankle-deep in the water rather than looking at it from the shore.
  lagoon:       { sea: 1.9,  birds: 0.7, ukulele: 0.4, wind: 0 },
  // The scene people look at least like it sounds: rock and mist, not surf.
  mountain:     { sea: 0.12, birds: 0.1, ukulele: 0,   wind: 1 },
  // Meant to be the quietest place in the game — reading by candlelight.
  bazaar:       { sea: 0.08, birds: 0,   ukulele: 0,   wind: 0.15 },
  reward:       { sea: 0.5,  birds: 0.3, ukulele: 0.3, wind: 0 },
  // Night, everything finished, the most intimate moment there is.
  constellation:{ sea: 0.55, birds: 0,   ukulele: 0,   wind: 0.2 },
  album:        { sea: 0.65, birds: 0,   ukulele: 0.25, wind: 0.1 },
  finale:       { sea: 0.75, birds: 0,   ukulele: 0,   wind: 0.1 },
};

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isUnlocked = false;
    this._mix = AMBIENT_MIXES.island; // until a scene says otherwise
    this._pendingScene = null;
    this.musicEl = null;
  }

  /**
   * Called on the player's first tap. Creates the audio context and starts
   * the sea. Safe to call repeatedly.
   */
  unlock() {
    if (this.isUnlocked) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return; // very old browser: game runs silently

    try {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this._startSea();
      this._startWind();
      this._scheduleBirds();
      this._scheduleUkulele();
      this.isUnlocked = true;

      // Whatever scene we're already on gets its own mix immediately,
      // rather than everyone starting on the island's.
      this.setAmbientMix(this._pendingScene ?? 'island');
    } catch (err) {
      console.warn('AudioManager: audio unavailable, continuing without sound.', err);
    }
  }

  /**
   * The sea: filtered noise with a slow swell on top of it. Two oscillators
   * at different speeds mean the waves never fall into an obvious rhythm.
   */
  _startSea() {
    const { ctx } = this;
    const seconds = 4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Brown noise — much softer than white noise, closer to water.
    let lastValue = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      lastValue = (lastValue + 0.02 * white) / 1.02;
      data[i] = lastValue * 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 520;

    this.seaGain = ctx.createGain();
    this.seaGain.gain.value = VOLUMES.sea;

    // Slow swell, so it breathes instead of hissing at a constant level.
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.09;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = VOLUMES.sea * 0.55;
    swell.connect(swellDepth).connect(this.seaGain.gain);
    swell.start();

    noise.connect(lowpass).connect(this.seaGain).connect(this.masterGain);
    noise.start();
  }

  /**
   * Wind: noise again, but shaped completely differently to the sea —
   * a narrow band-pass that whistles rather than washes, with a slow
   * wander in pitch. Silent everywhere except the mountain (and a
   * breath of it at night), so it reads as altitude, not weather.
   */
  _startWind() {
    const ctx = this.ctx;

    // Its own noise buffer, and deliberately whiter than the sea's brown
    // noise: water washes, wind whistles. Same technique, different
    // character, so the two never blur into one texture.
    const seconds = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.09 * white) / 1.09;
      data[i] = last * 2.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.start();

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 620;
    band.Q.value = 0.9;

    // A slow drift across the band so it never sits on one note.
    const drift = ctx.createOscillator();
    drift.frequency.value = 0.07;
    const driftDepth = ctx.createGain();
    driftDepth.gain.value = 260;
    drift.connect(driftDepth).connect(band.frequency);
    drift.start();

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0; // silent until a scene asks for it

    noise.connect(band).connect(this.windGain).connect(this.masterGain);
  }

  /**
   * Fades the ambient layers to suit the scene being entered. Called
   * from SceneManager, so every scene is covered automatically and no
   * scene has to know anything about audio.
   *
   * The sea and wind are real gain ramps (a genuine cross-fade, not a
   * cut); birds and ukulele are timer-driven one-shots, so their mix
   * value acts as a probability the scheduler checks each turn.
   */
  setAmbientMix(sceneName) {
    const mix = AMBIENT_MIXES[sceneName];
    if (!mix) return;

    this._mix = mix;

    // Remember it even if audio isn't unlocked yet, so the first scene
    // doesn't briefly play the wrong mix once it is.
    this._pendingScene = sceneName;
    if (!this.ctx || !this.isUnlocked) return;

    const now = this.ctx.currentTime;
    const FADE = 1.6; // long enough to feel like walking somewhere else

    if (this.seaGain) {
      this.seaGain.gain.cancelScheduledValues(now);
      this.seaGain.gain.setValueAtTime(this.seaGain.gain.value, now);
      this.seaGain.gain.linearRampToValueAtTime(VOLUMES.sea * mix.sea, now + FADE);
    }
    if (this.windGain) {
      this.windGain.gain.cancelScheduledValues(now);
      this.windGain.gain.setValueAtTime(this.windGain.gain.value, now);
      this.windGain.gain.linearRampToValueAtTime(VOLUMES.wind * mix.wind, now + FADE);
    }
  }

  /**
   * A bird call, now and then, at a random interval — never on a beat, so
   * it never turns into background noise you tune out.
   */
  _scheduleBirds() {
    const chirp = () => {
      // The scene's mix acts as a probability: a place with few birds
      // still hears one occasionally, a place with none never does —
      // without needing a separate on/off switch per scene.
      const chance = this._mix?.birds ?? 1;
      if (!this.isMuted && Math.random() < chance) this._birdCall();
      this._birdTimer = setTimeout(chirp, 5000 + Math.random() * 9000);
    };
    this._birdTimer = setTimeout(chirp, 3000 + Math.random() * 4000);
  }

  /** Two or three quick, high notes with a fast fade — a single bird call. */
  _birdCall() {
    const notes = 2 + Math.floor(Math.random() * 2);
    const base = 2200 + Math.random() * 700;

    for (let i = 0; i < notes; i++) {
      this._tone(base + i * 180, 0.09, {
        type: 'sine',
        volume: 0.28,
        delay: i * 0.09,
      });
    }
  }

  /**
   * A soft, plucked ukulele-style phrase, played occasionally rather than
   * looping — the brief asks for background music that's "almost
   * unnoticeable", and a tune that never repeats on a fixed loop stays
   * that way much longer than a looping track would.
   */
  _scheduleUkulele() {
    const strum = () => {
      const chance = this._mix?.ukulele ?? 1;
      if (!this.isMuted && Math.random() < chance) this._ukulelePhrase();
      this._ukuleleTimer = setTimeout(strum, 14000 + Math.random() * 10000);
    };
    this._ukuleleTimer = setTimeout(strum, 9000 + Math.random() * 5000);
  }

  /** A short, warm four-note phrase — a pentatonic run, plucked not held. */
  _ukulelePhrase() {
    const scale = [392, 440, 494, 587, 659]; // G major pentatonic, gentle range
    const phraseLength = 3 + Math.floor(Math.random() * 2);

    for (let i = 0; i < phraseLength; i++) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      this._pluck(note, i * 0.32);
    }
  }

  /** One plucked string: a quick attack and a natural decay, like a real pluck. */
  _pluck(frequency, delay) {
    if (!this.ctx || this.isMuted) return;

    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(VOLUMES.music, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);

    osc.connect(gain).connect(this.masterGain);
    osc.start(start);
    osc.stop(start + 1);
  }

  /**
   * A single soft tone. Every interaction sound in the game is built from
   * these — short, rounded, with a fade so nothing ever clicks.
   */
  _tone(frequency, duration = 0.18, { type = 'sine', volume = 1, delay = 0 } = {}) {
    if (!this.ctx || this.isMuted) return;

    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);

    // fade in and out rather than starting abruptly
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(VOLUMES.effects * volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain).connect(this.masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  /* ---- The game's sound effects ---- */

  /** Soft tap, for buttons and taps that don't need ceremony. */
  tap() {
    this._tone(520, 0.12, { volume: 0.7 });
  }

  /** Something went right, but quietly — a wrong answer never gets a buzz. */
  nudge() {
    this._tone(392, 0.16, { volume: 0.6 });
  }

  /** A small win: two rising notes. */
  win() {
    this._tone(523, 0.18);
    this._tone(659, 0.22, { delay: 0.12 });
  }

  /** A soft, bell-like crystal chime at any pitch — used for Mountain's
   *  9 crystals, each with its own tone, so the sequence can be
   *  memorized by ear as well as by eye. A quiet high overtone on top
   *  of the main tone is what gives it a "crystal" rather than plain
   *  sine-wave character. */
  crystalTone(frequency) {
    this._tone(frequency, 0.4, { volume: 0.5 });
    this._tone(frequency * 2, 0.25, { volume: 0.15, delay: 0.02 });
  }

  /** Lagoon's own musical signature: bright, quick, watery — a rising
   *  major triad. Played once, at the moment Lagoon is actually won. */
  lagoonSignature() {
    this._tone(523, 0.22, { volume: 0.55 });
    this._tone(659, 0.22, { delay: 0.14, volume: 0.55 });
    this._tone(784, 0.35, { delay: 0.28, volume: 0.55 });
  }

  /** Mountain's own musical signature: solid, resonant, low — an
   *  ascending fifth and octave, like the crystal tones but grounded. */
  mountainSignature() {
    this._tone(261, 0.3, { volume: 0.55 });
    this._tone(392, 0.3, { delay: 0.16, volume: 0.55 });
    this._tone(523, 0.4, { delay: 0.32, volume: 0.55 });
  }

  /** Bazaar's own musical signature: warm, a little wistful — a
   *  descending phrase, like closing a journal after a good story. */
  bazaarSignature() {
    this._tone(440, 0.26, { volume: 0.5 });
    this._tone(349, 0.26, { delay: 0.15, volume: 0.5 });
    this._tone(294, 0.4, { delay: 0.3, volume: 0.5 });
  }

  /** The three signatures played together as one chord — the small
   *  musical culmination once the island goes quiet for the night,
   *  recognizable because each piece was already heard on its own. */
  islandChord() {
    this._tone(261, 0.9, { volume: 0.4 });
    this._tone(349, 0.9, { volume: 0.35, delay: 0.05 });
    this._tone(440, 0.9, { volume: 0.3, delay: 0.1 });
    this._tone(523, 1.1, { volume: 0.4, delay: 0.15 });
    this._tone(659, 1.1, { volume: 0.3, delay: 0.2 });
  }

  /** The chest opening: a warm chord that opens upward. */
  chest() {
    this._tone(392, 0.5, { volume: 0.8 });
    this._tone(523, 0.5, { delay: 0.06, volume: 0.8 });
    this._tone(784, 0.6, { delay: 0.14, volume: 0.6 });
  }

  /** The registration stamp: a low, short thud. */
  stamp() {
    this._tone(140, 0.2, { type: 'triangle', volume: 1 });
  }

  /** The finale: a little rising run. */
  fanfare() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      this._tone(freq, 0.4, { delay: i * 0.13, volume: 0.75 });
    });
  }

  /* ---- Background music: a day playlist, then a night track ---- */

  /**
   * Starts the "daytime" music: Music1 and Music2 alternate, one after
   * the other, cycling for as long as the player is still on their first
   * three adventures. Called once, right after the team's name is
   * registered.
   *
   * A missing file is not an error — this degrades to silence exactly
   * like the old single-track version did, so the game never depends on
   * these being present.
   */
  playDayMusic(urls) {
    if (this.musicEl || this._musicPhase) return; // already running
    this._musicPhase = 'day';
    this._dayPlaylist = urls;
    this._dayTrackIndex = 0;
    this._playPlaylistTrack();
  }

  _playPlaylistTrack() {
    if (this._musicPhase !== 'day') return; // switchToNightMusic beat us to it
    const url = this._dayPlaylist[this._dayTrackIndex % this._dayPlaylist.length];
    this._setMusicElement(url, () => {
      // One track ended — the next one takes over. Two tracks alternating
      // reads as "playlist", not "the same song looping twice".
      this._dayTrackIndex += 1;
      this._playPlaylistTrack();
    });
  }

  /**
   * Crosses over to the night track (Music3), which then loops on its
   * own for the rest of the game. Called once, the moment night falls
   * for the first time — see IslandScene._syncDayStage().
   */
  switchToNightMusic(url) {
    if (this._musicPhase === 'night') return;
    this._musicPhase = 'night';
    this._setMusicElement(url, null, { loop: true, fadeOutPrevious: true });
  }

  /**
   * Swaps in a new <audio> element, fading the old one out underneath it
   * rather than cutting it — day and night should feel like the music
   * changed with the light, not like a track skipped.
   * @param {string} url
   * @param {(() => void)|null} onEnded - called when the track finishes,
   *   unless `loop` is set (a looping track never ends).
   */
  _setMusicElement(url, onEnded, { loop = false, fadeOutPrevious = false } = {}) {
    const previous = this.musicEl;

    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = 0;
    if (onEnded) audio.addEventListener('ended', onEnded, { once: true });

    audio.play().catch(() => {
      // Missing file, or the browser blocked autoplay before the game's
      // own unlock — the sea and the ambient layers carry the scene fine
      // on their own either way.
    });

    this.musicEl = audio;
    this._fadeAudioTo(audio, this.isMuted ? 0 : VOLUMES.music, 1.5);

    if (previous) {
      if (fadeOutPrevious) {
        this._fadeAudioTo(previous, 0, 1.5);
        setTimeout(() => previous.pause(), 1700);
      } else {
        previous.pause();
      }
    }
  }

  /** A plain <audio> element has no Web Audio gain node to ramp, so this
   *  fades its .volume by hand in small steps instead. */
  _fadeAudioTo(audioEl, target, seconds) {
    const start = audioEl.volume;
    const steps = 20;
    const stepMs = (seconds * 1000) / steps;
    let i = 0;
    const tick = () => {
      i += 1;
      audioEl.volume = start + (target - start) * (i / steps);
      if (i < steps) setTimeout(tick, stepMs);
    };
    tick();
  }

  /* ---- Mute ---- */

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 1;
    if (this.musicEl) this.musicEl.volume = muted ? 0 : VOLUMES.music;
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }
}
