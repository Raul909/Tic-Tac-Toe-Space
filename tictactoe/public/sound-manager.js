class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
    this.currentPack = 'scifi'; // Default sound pack
    this.bgAudio = null;
    this.customMusicName = '';
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

  playCustomMusic(file) {
    if (this.bgAudio) {
      this.bgAudio.pause();
      this.bgAudio.src = '';
      this.bgAudio = null;
    }
    this.bgAudio = new Audio();
    this.bgAudio.loop = true;
    this.bgAudio.volume = this.muted ? 0 : 0.45;
    this.bgAudio.src = URL.createObjectURL(file);
    this.customMusicName = file.name;
    const playPromise = this.bgAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => console.warn("Background music play failed:", e));
    }
  }

  toggleBgMusic() {
    if (!this.bgAudio) return false;
    if (this.bgAudio.paused) {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.bgAudio.play().catch(e => console.warn(e));
      return true;
    } else {
      this.bgAudio.pause();
      return false;
    }
  }

  stopCustomMusic() {
    if (this.bgAudio) {
      this.bgAudio.pause();
      this.bgAudio.src = '';
      this.bgAudio = null;
      this.customMusicName = '';
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.bgAudio) {
      this.bgAudio.volume = this.muted ? 0 : 0.45;
    }
    return this.muted;
  }

  changePack(pack) {
    this.currentPack = pack;
  }

  play(type) {
    if (this.muted || !this.audioCtx) return;

    // Resume context if suspended (common browser policy requires user interaction first)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;

    // Different sound packs
    const packs = {
      scifi: this.getSciFiSound(type),
      retro: this.getRetroSound(type),
      realistic: this.getRealisticSound(type),
      minimal: this.getMinimalSound(type)
    };

    const sound = packs[this.currentPack] || packs.scifi;
    if (sound) {
      sound.forEach(s => this.playTone(s.freq, s.type, s.duration, s.delay, s.volume, s.endFreq));
    }
  }

  getSciFiSound(type) {
    switch (type) {
      case 'click':
        return [{ freq: 800, type: 'sine', duration: 0.05, delay: 0, volume: 0.1 }];
      case 'move':
        return [{ freq: 400, type: 'square', duration: 0.05, delay: 0, volume: 0.1 }];
      case 'win':
        return [
          { freq: 523.25, type: 'triangle', duration: 0.2, delay: 0, volume: 0.2 },
          { freq: 659.25, type: 'triangle', duration: 0.2, delay: 0.2, volume: 0.2 },
          { freq: 783.99, type: 'triangle', duration: 0.2, delay: 0.4, volume: 0.2 },
          { freq: 1046.50, type: 'triangle', duration: 0.6, delay: 0.6, volume: 0.2 }
        ];
      case 'lose':
        return [
          { freq: 392.00, type: 'sawtooth', duration: 0.3, delay: 0, volume: 0.3 },
          { freq: 311.13, type: 'sawtooth', duration: 0.3, delay: 0.3, volume: 0.3 },
          { freq: 261.63, type: 'sawtooth', duration: 0.6, delay: 0.6, volume: 0.3 }
        ];
      case 'draw':
        return [
          { freq: 300, type: 'sine', duration: 0.2, delay: 0, volume: 0.2 },
          { freq: 300, type: 'sine', duration: 0.2, delay: 0.3, volume: 0.2 }
        ];
      case 'start':
        return [{ freq: 200, type: 'sawtooth', duration: 0.4, delay: 0, volume: 0.1 }];
      case 'error':
        return [{ freq: 150, type: 'sawtooth', duration: 0.2, delay: 0, volume: 0.2 }];
      case 'zip':
        return [{ freq: 150, endFreq: 2400, type: 'sawtooth', duration: 0.45, delay: 0, volume: 0.15 }];
      default:
        return [];
    }
  }

  getRetroSound(type) {
    switch (type) {
      case 'click':
        return [{ freq: 1000, type: 'square', duration: 0.03, delay: 0, volume: 0.15 }];
      case 'move':
        return [{ freq: 600, type: 'square', duration: 0.08, delay: 0, volume: 0.15 }];
      case 'win':
        return [
          { freq: 440, type: 'square', duration: 0.15, delay: 0, volume: 0.2 },
          { freq: 554, type: 'square', duration: 0.15, delay: 0.15, volume: 0.2 },
          { freq: 659, type: 'square', duration: 0.15, delay: 0.3, volume: 0.2 },
          { freq: 880, type: 'square', duration: 0.4, delay: 0.45, volume: 0.2 }
        ];
      case 'lose':
        return [
          { freq: 440, type: 'square', duration: 0.2, delay: 0, volume: 0.25 },
          { freq: 349, type: 'square', duration: 0.2, delay: 0.2, volume: 0.25 },
          { freq: 293, type: 'square', duration: 0.4, delay: 0.4, volume: 0.25 }
        ];
      case 'draw':
        return [
          { freq: 400, type: 'square', duration: 0.15, delay: 0, volume: 0.2 },
          { freq: 400, type: 'square', duration: 0.15, delay: 0.2, volume: 0.2 }
        ];
      case 'start':
        return [{ freq: 300, type: 'square', duration: 0.3, delay: 0, volume: 0.15 }];
      case 'error':
        return [{ freq: 200, type: 'square', duration: 0.15, delay: 0, volume: 0.2 }];
      case 'zip':
        return [{ freq: 120, endFreq: 1800, type: 'square', duration: 0.38, delay: 0, volume: 0.15 }];
      default:
        return [];
    }
  }

  getRealisticSound(type) {
    switch (type) {
      case 'click':
        return [{ freq: 2000, type: 'sine', duration: 0.02, delay: 0, volume: 0.08 }];
      case 'move':
        return [{ freq: 1500, type: 'sine', duration: 0.04, delay: 0, volume: 0.08 }];
      case 'win':
        return [
          { freq: 523, type: 'sine', duration: 0.25, delay: 0, volume: 0.15 },
          { freq: 659, type: 'sine', duration: 0.25, delay: 0.25, volume: 0.15 },
          { freq: 784, type: 'sine', duration: 0.5, delay: 0.5, volume: 0.15 }
        ];
      case 'lose':
        return [
          { freq: 400, type: 'sine', duration: 0.4, delay: 0, volume: 0.2 },
          { freq: 300, type: 'sine', duration: 0.6, delay: 0.4, volume: 0.2 }
        ];
      case 'draw':
        return [{ freq: 350, type: 'sine', duration: 0.3, delay: 0, volume: 0.15 }];
      case 'start':
        return [{ freq: 500, type: 'sine', duration: 0.2, delay: 0, volume: 0.1 }];
      case 'error':
        return [{ freq: 250, type: 'sine', duration: 0.15, delay: 0, volume: 0.15 }];
      case 'zip':
        return [{ freq: 250, endFreq: 1400, type: 'sine', duration: 0.52, delay: 0, volume: 0.18 }];
      default:
        return [];
    }
  }

  getMinimalSound(type) {
    switch (type) {
      case 'click':
        return [{ freq: 1200, type: 'sine', duration: 0.02, delay: 0, volume: 0.05 }];
      case 'move':
        return [{ freq: 800, type: 'sine', duration: 0.03, delay: 0, volume: 0.05 }];
      case 'win':
        return [{ freq: 1000, type: 'sine', duration: 0.3, delay: 0, volume: 0.1 }];
      case 'lose':
        return [{ freq: 400, type: 'sine', duration: 0.3, delay: 0, volume: 0.1 }];
      case 'draw':
        return [{ freq: 600, type: 'sine', duration: 0.2, delay: 0, volume: 0.08 }];
      case 'start':
        return [{ freq: 700, type: 'sine', duration: 0.15, delay: 0, volume: 0.08 }];
      case 'error':
        return [{ freq: 300, type: 'sine', duration: 0.1, delay: 0, volume: 0.1 }];
      case 'zip':
        return [{ freq: 500, endFreq: 950, type: 'sine', duration: 0.22, delay: 0, volume: 0.08 }];
      default:
        return [];
    }
  }

  playTone(freq, type, duration, delay = 0, volume = 0.1, endFreq = null) {
    if (this.muted || !this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    const startTime = this.audioCtx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq) {
      // Perform a smooth exponential sweep over the sound duration
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    }

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

// Make it globally available
window.SoundManager = new SoundManager();
