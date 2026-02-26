class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
    this.init();
  }

  init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  play(type) {
    if (this.muted || !this.audioCtx) return;

    // Resume context if suspended (common browser policy requires user interaction first)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;

    switch (type) {
      case 'click':
        this.playTone(800, 'sine', 0.1, 0, 0.05);
        break;

      case 'move':
        this.playTone(400, 'square', 0.1, 0, 0.05);
        break;

      case 'win':
        // Fanfare
        this.playTone(523.25, 'triangle', 0.2, 0);       // C5
        this.playTone(659.25, 'triangle', 0.2, 0.2);     // E5
        this.playTone(783.99, 'triangle', 0.2, 0.4);     // G5
        this.playTone(1046.50, 'triangle', 0.6, 0.6);    // C6
        break;

      case 'lose':
        // Descending
        this.playTone(392.00, 'sawtooth', 0.3, 0);       // G4
        this.playTone(311.13, 'sawtooth', 0.3, 0.3);     // Eb4
        this.playTone(261.63, 'sawtooth', 0.6, 0.6);     // C4
        break;

      case 'draw':
        this.playTone(300, 'sine', 0.2, 0);
        this.playTone(300, 'sine', 0.2, 0.3);
        break;

      case 'start':
        // Ascending slide
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'error':
        this.playTone(150, 'sawtooth', 0.2, 0);
        break;
    }
  }

  playTone(freq, type, duration, delay = 0, volume = 0.1) {
    if (this.muted || !this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    const startTime = this.audioCtx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

// Make it globally available
window.SoundManager = new SoundManager();
