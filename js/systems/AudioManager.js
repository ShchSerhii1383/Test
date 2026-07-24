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
  music: 0.16,
  effects: 0.13,
};

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isUnlocked = false;
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
      this._scheduleBirds();
      this._scheduleUkulele();
      this.isUnlocked = true;
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
   * A bird call, now and then, at a random interval — never on a beat, so
   * it never turns into background noise you tune out.
   */
  _scheduleBirds() {
    const chirp = () => {
      if (!this.isMuted) this._birdCall();
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
      if (!this.isMuted) this._ukulelePhrase();
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

  /* ---- Optional music from a file ---- */

  /**
   * Play a looping music track, if the file exists. Missing file is not an
   * error — see assets/audio/README.md for what to drop in.
   * @param {string} url
   */
  playMusic(url) {
    if (this.musicEl) return;

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = this.isMuted ? 0 : VOLUMES.music;

    audio.play().catch(() => {
      // No file, or the browser blocked it. The sea is enough on its own.
    });

    this.musicEl = audio;
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
