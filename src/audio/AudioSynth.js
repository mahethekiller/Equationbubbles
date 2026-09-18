/**
 * Pure Web Audio API Synthesizer
 * Zero external audio assets required. Generates bubble pops,
 * harmonic bell chimes, wrong buzzes, and gentle pentatonic background music.
 */
export class AudioSynth {
  constructor() {
    this.ctx = null;
    this.isMusicOn = true;
    this.isSfxOn = true;
    this.bgmTimer = null;
    this.bgmIndex = 0;
    this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C major pentatonic
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSettings(isMusicOn, isSfxOn) {
    this.isMusicOn = isMusicOn;
    this.isSfxOn = isSfxOn;
    if (!this.isMusicOn) {
      this.stopBgm();
    } else if (!this.bgmTimer) {
      this.startBgm();
    }
  }

  // --- Sound Effects ---

  /**
   * Crisp Bubble Pop Sound
   */
  playPop() {
    if (!this.isSfxOn) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency sweep down rapidly
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    // Snappy envelope
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Cheerful Major Bell Chord for Correct Answer
   */
  playCorrect() {
    if (!this.isSfxOn) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  /**
   * Soft Cartoon Error Buzz / Wobble
   */
  playWrong() {
    if (!this.isSfxOn) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.12);
    osc.frequency.linearRampToValueAtTime(90, t + 0.25);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.29);
  }

  /**
   * Gentle Paper Rustle / Page Turn Sound
   */
  playPageTurn() {
    if (!this.isSfxOn) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.22);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.23);
    } catch (e) {
      this.playClick();
    }
  }

  /**
   * Subtle Paper Click / Tap Sound
   */
  playClick() {
    if (!this.isSfxOn) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * Celebratory Victory Fanfare
   */
  playFanfare() {
    if (!this.isSfxOn) return;
    this.init();
    if (!this.ctx) return;

    const melody = [523.25, 659.25, 783.99, 1046.50, 880.00, 1046.50];
    melody.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  // --- Background Music Synth ---

  /**
   * Plays soft pentatonic music box notes in a peaceful loop
   */
  startBgm() {
    if (!this.isMusicOn || this.bgmTimer) return;
    this.init();

    const pattern = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 2, 4, 5, 7, 4, 2];
    this.bgmTimer = setInterval(() => {
      if (!this.isMusicOn || !this.ctx) return;

      const noteIdx = pattern[this.bgmIndex % pattern.length];
      this.bgmIndex++;
      const freq = this.scale[noteIdx % this.scale.length];

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.65);
    }, 450);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const audioSynth = new AudioSynth();
