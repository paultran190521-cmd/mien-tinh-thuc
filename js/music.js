/**
 * SUNNYCARE MindWell — Ambient Sound System
 * Web Audio API-based ambient sound generator (no external files needed)
 * Tracks: Rain | Ocean | Forest | Piano | Wind
 */

class AmbientSoundSystem {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentTrack = 'rain';
    this.schedulerTimer = null;
    this.targetVolume = 0.4;
  }

  // ─── INIT ────────────────────────────────────────────────────────────────────
  ensureContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.connect(this.audioCtx.destination);
      this.masterGain.gain.value = 0;
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }

  // ─── NOISE GENERATORS ───────────────────────────────────────────────────────
  createNoiseBuffer(seconds = 4) {
    const sr = this.audioCtx.sampleRate;
    const buffer = this.audioCtx.createBuffer(2, sr * seconds, sr);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  createImpulseBuffer(duration = 2.5, decay = 2.5) {
    const sr = this.audioCtx.sampleRate;
    const length = sr * duration;
    const buf = this.audioCtx.createBuffer(2, length, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    return buf;
  }

  createReverb(duration = 2.5, decay = 2.5) {
    const conv = this.audioCtx.createConvolver();
    conv.buffer = this.createImpulseBuffer(duration, decay);
    return conv;
  }

  // ─── TRACK: RAIN ────────────────────────────────────────────────────────────
  playRain() {
    const src = this.audioCtx.createBufferSource();
    src.buffer = this.createNoiseBuffer(4);
    src.loop = true;

    const lp = this.audioCtx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1000; lp.Q.value = 0.4;

    const hp = this.audioCtx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 300;

    const g = this.audioCtx.createGain(); g.gain.value = 0.9;
    src.connect(lp); lp.connect(hp); hp.connect(g); g.connect(this.masterGain);
    src.start();
    this.activeNodes.push(src, g);
  }

  // ─── TRACK: OCEAN ────────────────────────────────────────────────────────────
  playOcean() {
    const src = this.audioCtx.createBufferSource();
    src.buffer = this.createNoiseBuffer(4); src.loop = true;

    const lfo = this.audioCtx.createOscillator();
    const lfoG = this.audioCtx.createGain();
    lfo.frequency.value = 0.12; lfoG.gain.value = 350;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 500; filter.Q.value = 0.7;

    const g = this.audioCtx.createGain(); g.gain.value = 0.65;

    lfo.connect(lfoG); lfoG.connect(filter.frequency);
    src.connect(filter); filter.connect(g); g.connect(this.masterGain);
    lfo.start(); src.start();
    this.activeNodes.push(src, lfo, g);
  }

  // ─── TRACK: FOREST ───────────────────────────────────────────────────────────
  playForest() {
    // Wind background
    const src = this.audioCtx.createBufferSource();
    src.buffer = this.createNoiseBuffer(4); src.loop = true;
    const bp = this.audioCtx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 280; bp.Q.value = 0.3;
    const g = this.audioCtx.createGain(); g.gain.value = 0.25;
    src.connect(bp); bp.connect(g); g.connect(this.masterGain);
    src.start();
    this.activeNodes.push(src);
    // Bird chirps
    this._scheduleBirds();
  }

  _scheduleBirds() {
    if (!this.isPlaying) return;
    const chirp = () => {
      if (!this.isPlaying) return;
      const freq = 1600 + Math.random() * 2400;
      const osc = this.audioCtx.createOscillator();
      const env = this.audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, this.audioCtx.currentTime + 0.06);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, this.audioCtx.currentTime + 0.18);
      env.gain.setValueAtTime(0, this.audioCtx.currentTime);
      env.gain.linearRampToValueAtTime(0.12, this.audioCtx.currentTime + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.22);
      osc.connect(env); env.connect(this.masterGain);
      osc.start(); osc.stop(this.audioCtx.currentTime + 0.25);
      this.schedulerTimer = setTimeout(chirp, 2200 + Math.random() * 3800);
    };
    this.schedulerTimer = setTimeout(chirp, 800 + Math.random() * 1500);
  }

  // ─── TRACK: PIANO (Pentatonic Arpeggio) ─────────────────────────────────────
  playPiano() {
    // C minor pentatonic notes (Hz)
    const notes = [261.63, 293.66, 329.63, 392.00, 466.16, 523.25];
    // Gentle ascending/descending pattern
    const pattern = [0, 1, 2, 1, 3, 2, 4, 3, 5, 4, 3, 2, 1, 0];
    const reverb = this.createReverb(3, 2);
    reverb.connect(this.masterGain);

    const scheduleLoop = () => {
      if (!this.isPlaying) return;
      let t = this.audioCtx.currentTime + 0.2;
      pattern.forEach(idx => {
        const osc = this.audioCtx.createOscillator();
        const env = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = notes[idx];
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.18, t + 0.03);
        env.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
        osc.connect(env); env.connect(reverb);
        osc.start(t); osc.stop(t + 1.5);
        t += 0.55;
      });
      const totalMs = (pattern.length * 0.55 + 1.5) * 1000;
      this.schedulerTimer = setTimeout(scheduleLoop, totalMs - 800);
    };
    scheduleLoop();
  }

  // ─── TRACK: WIND ─────────────────────────────────────────────────────────────
  playWind() {
    const src = this.audioCtx.createBufferSource();
    src.buffer = this.createNoiseBuffer(4); src.loop = true;

    const lp1 = this.audioCtx.createBiquadFilter();
    lp1.type = 'lowpass'; lp1.frequency.value = 500;
    const lp2 = this.audioCtx.createBiquadFilter();
    lp2.type = 'lowpass'; lp2.frequency.value = 300;

    const lfo = this.audioCtx.createOscillator();
    const lfoG = this.audioCtx.createGain();
    lfo.frequency.value = 0.07; lfoG.gain.value = 0.35;

    const g = this.audioCtx.createGain(); g.gain.value = 0.75;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(lp1); lp1.connect(lp2); lp2.connect(g); g.connect(this.masterGain);
    lfo.start(); src.start();
    this.activeNodes.push(src, lfo, g);
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────────────────
  play(track) {
    this.ensureContext();
    this.stop(false);
    this.isPlaying = true;
    this.currentTrack = track;

    // Fade in
    this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.targetVolume, this.audioCtx.currentTime + 1.5);

    switch (track) {
      case 'rain':   this.playRain();   break;
      case 'ocean':  this.playOcean();  break;
      case 'forest': this.playForest(); break;
      case 'piano':  this.playPiano();  break;
      case 'wind':   this.playWind();   break;
    }
  }

  stop(updateFlag = true) {
    if (updateFlag) this.isPlaying = false;
    if (this.schedulerTimer) { clearTimeout(this.schedulerTimer); this.schedulerTimer = null; }
    this.activeNodes.forEach(n => { try { n.stop(); } catch(e){} try { n.disconnect(); } catch(e){} });
    this.activeNodes = [];
  }

  pause() {
    if (this.audioCtx && this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.8);
      setTimeout(() => { this.stop(true); }, 900);
    }
  }

  setVolume(val0to100) {
    this.targetVolume = (val0to100 / 100) * 0.75;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.linearRampToValueAtTime(this.targetVolume, this.audioCtx.currentTime + 0.15);
    }
  }

  switchTrack(track) {
    if (!this.isPlaying) { this.play(track); return; }
    // Fade out then switch
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.6);
      setTimeout(() => {
        this.stop(false);
        this.play(track);
      }, 700);
    }
  }
}

// Singleton
window.ambientSound = new AmbientSoundSystem();
