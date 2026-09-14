/**
 * Sound Engine for Poki-style Gaming Portal
 * Uses the Web Audio API for zero-latency, asset-free retro sound effects.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('arcade_muted') === 'true';
    this.initContext = this.initContext.bind(this);
    
    // Lazy initialize on first user interaction
    ['click', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, this.initContext, { once: true, passive: true });
    });
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('arcade_muted', this.isMuted);
    return this.isMuted;
  }

  playTone(freq, type, duration, startTime = 0, gainLevel = 0.15) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime + startTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio context might not be fully permitted yet
    }
  }

  playClick() {
    this.initContext();
    this.playTone(800, 'sine', 0.05, 0, 0.08);
  }

  playHover() {
    this.initContext();
    this.playTone(450, 'triangle', 0.04, 0, 0.03);
  }

  playJump() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playScore() {
    this.initContext();
    this.playTone(523.25, 'sine', 0.08, 0, 0.12); // C5
    this.playTone(659.25, 'sine', 0.08, 0.06, 0.12); // E5
    this.playTone(783.99, 'sine', 0.14, 0.12, 0.15); // G5
  }

  playPowerup() {
    this.initContext();
    this.playTone(440, 'triangle', 0.08, 0, 0.12);
    this.playTone(554.37, 'triangle', 0.08, 0.08, 0.12);
    this.playTone(659.25, 'triangle', 0.08, 0.16, 0.12);
    this.playTone(880, 'sine', 0.2, 0.24, 0.15);
  }

  playHit() {
    if (this.isMuted || !this.ctx) return;
    this.initContext();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playGameOver() {
    this.initContext();
    this.playTone(400, 'sawtooth', 0.15, 0, 0.15);
    this.playTone(350, 'sawtooth', 0.15, 0.15, 0.15);
    this.playTone(280, 'sawtooth', 0.2, 0.3, 0.15);
    this.playTone(180, 'sawtooth', 0.35, 0.5, 0.15);
  }

  playVictory() {
    this.initContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.15, idx * 0.1, 0.15);
    });
  }
}

window.soundEngine = new SoundEngine();
