class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
    this.currentPack = 'scifi'; // Default sound pack
    this.bgAudio = null;
    this.bgAudioSource = null;
    this.bgFilter = null;
    this.customMusicName = '';
    this.customSfx = null; // Stores extracted AudioBuffers
    
    // Web Audio Background Music Properties (Fix for looping bug)
    this.bgBufferSource = null;
    this.bgMusicBuffer = null;
    this.bgPlayhead = 0;
    this.bgStartTime = 0;
    this.bgPlaying = false;
    this.bgGainNode = null;
    
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

  setupBgAudioSource() {
    // No-op: We now play background music directly via AudioBufferSourceNode
    // to bypass the browser HTML5 MediaElementAudioSourceNode looping bug.
  }

  setFilterActive(active) {
    if (!this.audioCtx || !this.bgFilter) return;
    const now = this.audioCtx.currentTime;
    if (active) {
      // Transition filter down to 350Hz over 0.5 seconds (cinematic blur effect)
      this.bgFilter.frequency.setValueAtTime(this.bgFilter.frequency.value, now);
      this.bgFilter.frequency.exponentialRampToValueAtTime(350, now + 0.5);
    } else {
      // Transition filter back up to 20000Hz (full brightness)
      this.bgFilter.frequency.setValueAtTime(this.bgFilter.frequency.value, now);
      this.bgFilter.frequency.exponentialRampToValueAtTime(20000, now + 0.5);
    }
  }

  playCustomMusic(file) {
    this.stopCustomMusic();
    
    // Notify Alpine UI to open loading mini-game modal
    if (window.appInstance) {
      window.appInstance.musicLoading = true;
      window.appInstance.musicAnalysisStatus = 'DECODING AUDIO STREAM...';
      window.appInstance.showRetroGame = true;
    }

    // Set a dummy audio object to make app.js state checks happy
    this.bgAudio = new Audio();
    this.customMusicName = file.name;

    // Decode and analyze the file for SFX slicing
    this.decodeAndAnalyze(file);
  }

  playBgBuffer(offset = 0) {
    if (!this.audioCtx || !this.bgMusicBuffer) return;
    
    if (this.bgBufferSource) {
      try {
        this.bgBufferSource.stop();
      } catch(e) {}
      this.bgBufferSource = null;
    }
    
    this.bgBufferSource = this.audioCtx.createBufferSource();
    this.bgBufferSource.buffer = this.bgMusicBuffer;
    this.bgBufferSource.loop = true;
    
    if (!this.bgGainNode) {
      this.bgGainNode = this.audioCtx.createGain();
    }
    this.bgGainNode.gain.setValueAtTime(this.muted ? 0 : 0.45, this.audioCtx.currentTime);
    
    if (!this.bgFilter) {
      this.bgFilter = this.audioCtx.createBiquadFilter();
      this.bgFilter.type = 'lowpass';
      this.bgFilter.frequency.setValueAtTime(20000, this.audioCtx.currentTime);
    }
    
    this.bgBufferSource.connect(this.bgGainNode);
    this.bgGainNode.connect(this.bgFilter);
    this.bgFilter.connect(this.audioCtx.destination);
    
    this.bgStartTime = this.audioCtx.currentTime - offset;
    this.bgBufferSource.start(0, offset % this.bgMusicBuffer.duration);
    this.bgPlaying = true;
  }

  pauseBgMusic() {
    if (this.bgBufferSource && this.bgPlaying) {
      this.bgPlayhead = this.audioCtx.currentTime - this.bgStartTime;
      try {
        this.bgBufferSource.stop();
      } catch(e) {}
      this.bgBufferSource = null;
      this.bgPlaying = false;
    }
  }

  resumeBgMusic() {
    if (this.bgMusicBuffer && !this.bgPlaying) {
      this.playBgBuffer(this.bgPlayhead || 0);
    }
  }

  decodeAndAnalyze(file) {
    if (!this.audioCtx) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (window.appInstance) {
        window.appInstance.musicAnalysisStatus = 'DECOMPRESSING AUDIO TRACK...';
      }
      const arrayBuffer = e.target.result;
      this.audioCtx.decodeAudioData(arrayBuffer)
        .then(audioBuffer => {
          this.processBuffer(audioBuffer);
        })
        .catch(err => {
          console.warn("Audio decoding failed:", err);
          if (window.appInstance) {
            window.appInstance.musicAnalysisStatus = 'DECODING FAILED. REVERTING TO DEFAULT.';
            window.appInstance.musicLoading = false;
          }
        });
    };
    reader.readAsArrayBuffer(file);
  }

  processBuffer(audioBuffer) {
    if (window.appInstance) {
      window.appInstance.musicAnalysisStatus = 'RUNNING SPECTRAL & ENERGY TRANSIENT ANALYSIS...';
    }
    const sampleRate = audioBuffer.sampleRate;
    const data = audioBuffer.getChannelData(0); // use channel 0 (mono/left)
    const duration = audioBuffer.duration;
    
    // Scan up to first 60 seconds of the song to optimize analysis speed (prevent UI block)
    const scanLimit = Math.min(data.length, sampleRate * 60);
    
    // Compute RMS energy in 40ms windows
    const windowSize = Math.floor(sampleRate * 0.04); // 40ms
    const energies = [];
    const peaks = [];
    let zeroCrossings = 0;
    
    for (let i = 0; i < scanLimit; i += windowSize) {
      let sum = 0;
      let crossings = 0;
      const end = Math.min(i + windowSize, scanLimit);
      for (let j = i; j < end; j++) {
        sum += data[j] * data[j];
        if (j > 0 && ((data[j] >= 0 && data[j-1] < 0) || (data[j] < 0 && data[j-1] >= 0))) {
          crossings++;
        }
      }
      const rms = Math.sqrt(sum / (end - i));
      energies.push({ index: i, rms });
      zeroCrossings += crossings;
    }
    
    const avgEnergy = energies.reduce((acc, e) => acc + e.rms, 0) / energies.length;
    const zcr = zeroCrossings / scanLimit;
    
    // Peak onset detection (moving average threshold)
    const localWindow = 12; // average over 12 windows (~500ms)
    let lastPeakTime = -999;
    
    for (let i = 2; i < energies.length - 2; i++) {
      let localSum = 0;
      let count = 0;
      const startWin = Math.max(0, i - localWindow);
      const endWin = Math.min(energies.length, i + localWindow);
      for (let w = startWin; w < endWin; w++) {
        localSum += energies[w].rms;
        count++;
      }
      const localAvg = localSum / count;
      
      const currentTimeSec = (energies[i].index / sampleRate);
      
      // Candidate transient: peak is above local average and a minimum absolute threshold
      if (energies[i].rms > localAvg * 1.45 && 
          energies[i].rms > energies[i-1].rms && 
          energies[i].rms > energies[i+1].rms &&
          energies[i].rms > 0.035) {
        
        // Enforce min 200ms spacing between custom SFX triggers to capture distinct peaks
        if (currentTimeSec - lastPeakTime > 0.20) {
          peaks.push(energies[i].index);
          lastPeakTime = currentTimeSec;
        }
      }
    }
    
    // AI Vibe/Genre Judgment
    let vibe = "COSMIC ORBIT (Cinematic Ambient)";
    if (avgEnergy > 0.16 && zcr > 0.08) {
      vibe = "GALAXY HYPERDRIVE (High-Energy Electronic)";
    } else if (avgEnergy > 0.11 && zcr <= 0.08) {
      vibe = "ASTEROID IMPACT (Heavy Industrial Bass)";
    } else if (avgEnergy <= 0.11 && zcr > 0.06) {
      vibe = "NEBULA MIST (Mellow Glitch Hop)";
    } else {
      vibe = "DEEP VOID (Muffled Space Drone)";
    }
    
    console.log(`[AI Judge] Average Energy: ${avgEnergy.toFixed(3)}, ZCR: ${zcr.toFixed(3)}, Onsets: ${peaks.length}`);
    console.log(`[AI Judge] Vibe Judgment: ${vibe}`);
    
    // Save to window for UI visibility
    window.customMusicVibe = vibe;
    if (window.appInstance) {
      window.appInstance.$nextTick(() => {
        // Force refresh widget if needed
      });
    }
    
    // Slice and extract SFX buffers
    this.extractSFXSlices(audioBuffer, peaks);
  }

  extractSFXSlices(audioBuffer, peaks) {
    this.customSfx = {};
    const sampleRate = audioBuffer.sampleRate;
    
    // Fallback peaks if song is extremely quiet or transient-less
    const finalPeaks = peaks.length > 5 ? peaks : [
      Math.floor(sampleRate * 0.5),
      Math.floor(sampleRate * 1.5),
      Math.floor(sampleRate * 3.0),
      Math.floor(sampleRate * 5.0),
      Math.floor(sampleRate * 8.0),
      Math.floor(sampleRate * 12.0)
    ];

    const sliceBuffer = (startSample, durationSeconds, pitchMultiplier = 1.0) => {
      const numSamples = Math.floor(durationSeconds * sampleRate);
      const newBuffer = this.audioCtx.createBuffer(
        audioBuffer.numberOfChannels,
        numSamples,
        sampleRate * pitchMultiplier
      );
      
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const srcData = audioBuffer.getChannelData(ch);
        const destData = newBuffer.getChannelData(ch);
        const start = Math.min(srcData.length, startSample);
        const len = Math.min(numSamples, srcData.length - start);
        
        for (let i = 0; i < len; i++) {
          destData[i] = srcData[start + i];
        }
        
        // Envelope: 5ms fade-in, 20ms fade-out to prevent pop artifacts
        const fadeInLen = Math.floor(0.005 * sampleRate);
        const fadeOutStart = numSamples - Math.floor(0.02 * sampleRate);
        
        for (let i = 0; i < Math.min(fadeInLen, numSamples); i++) {
          destData[i] *= (i / fadeInLen);
        }
        for (let i = Math.max(0, fadeOutStart); i < numSamples; i++) {
          const factor = (numSamples - i) / (numSamples - fadeOutStart);
          destData[i] *= factor;
        }
      }
      return newBuffer;
    };

    // Slice different types of SFX:
    // 1. click: very short, high pitch
    this.customSfx['click'] = sliceBuffer(finalPeaks[0], 0.05, 1.8);
    
    // 2. move: short transient
    this.customSfx['move'] = sliceBuffer(finalPeaks[Math.min(1, finalPeaks.length - 1)], 0.16, 1.15);
    
    // 3. win: longer high-energy chorus segment
    this.customSfx['win'] = sliceBuffer(finalPeaks[Math.min(3, finalPeaks.length - 1)], 1.5, 1.0);
    
    // 4. lose: pitch-down decay segment
    this.customSfx['lose'] = sliceBuffer(finalPeaks[Math.min(4, finalPeaks.length - 1)], 1.2, 0.72);
    
    // 5. draw: steady mid-range
    this.customSfx['draw'] = sliceBuffer(finalPeaks[Math.min(2, finalPeaks.length - 1)], 0.75, 0.95);
    
    // 6. start: medium duration
    this.customSfx['start'] = sliceBuffer(finalPeaks[Math.min(5, finalPeaks.length - 1)], 0.5, 1.0);
    
    // 7. error: rapid gated punch
    this.customSfx['error'] = sliceBuffer(finalPeaks[0], 0.22, 0.62);
    
    // 8. zip: transient sweep
    this.customSfx['zip'] = sliceBuffer(finalPeaks[Math.min(finalPeaks.length - 1, 6)], 0.42, 1.45);

    console.log("[AI Judge] Extracted 8 dynamic SFX buffers from custom track.");
    
    // Save the main audio buffer for looping background playback
    this.bgMusicBuffer = audioBuffer;
    this.bgPlayhead = 0;
    
    // Set current pack to custom
    this.changePack('custom');
    
    // Automatically update Alpine UI
    if (window.appInstance) {
      window.appInstance.musicAnalysisStatus = 'ANALYSIS COMPLETE! CUSTOM SFX PACK READY.';
      window.appInstance.musicLoading = false;
      window.appInstance.user.profile.soundPack = 'custom';
      if (!window.appInstance.soundPacks.includes('custom')) {
        window.appInstance.soundPacks.push('custom');
      }
    }
    
    // Start background music loop playback!
    this.playBgBuffer(0);
  }

  playCustomBuffer(buffer) {
    if (this.muted || !this.audioCtx) return;
    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      source.start();
    } catch(e) {
      console.warn("playCustomBuffer failed:", e);
    }
  }

  toggleBgMusic() {
    if (!this.bgMusicBuffer) return false;
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (this.bgPlaying) {
      this.pauseBgMusic();
      return false;
    } else {
      this.resumeBgMusic();
      return true;
    }
  }

  stopCustomMusic() {
    if (this.bgBufferSource) {
      try {
        this.bgBufferSource.stop();
      } catch(e) {}
      this.bgBufferSource = null;
    }
    this.bgMusicBuffer = null;
    this.bgPlayhead = 0;
    this.bgPlaying = false;
    this.bgAudio = null;
    this.customMusicName = '';
    this.customSfx = null;
    
    // Revert sound pack if currently set to custom
    if (this.currentPack === 'custom') {
      this.changePack('scifi');
      if (window.appInstance) {
        window.appInstance.user.profile.soundPack = 'scifi';
        const customIdx = window.appInstance.soundPacks.indexOf('custom');
        if (customIdx > -1) {
          window.appInstance.soundPacks.splice(customIdx, 1);
        }
      }
    }
    window.customMusicVibe = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.bgGainNode) {
      this.bgGainNode.gain.setValueAtTime(this.muted ? 0 : 0.45, this.audioCtx.currentTime);
    }
    return this.muted;
  }

  changePack(pack) {
    this.currentPack = pack;
  }

  play(type) {
    if (this.muted || !this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Play sliced custom SFX if custom pack is active
    if (this.currentPack === 'custom' && this.customSfx && this.customSfx[type]) {
      this.playCustomBuffer(this.customSfx[type]);
      return;
    }

    const now = this.audioCtx.currentTime;

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
