// ═══════════════════════════════════════════════════════════
//  audio.js — Layered space ambient soundtrack
// ═══════════════════════════════════════════════════════════
class SpaceAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.running = false;
    this.supported = !!(window.AudioContext || window.webkitAudioContext);
    this.lastButtonEl = null;
  }

  init() {
    if (this.ctx) return;
    if (!this.supported) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._buildMusic();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (err) {
      this.supported = false;
    }
  }

  _note(freq) { return freq; }

  _buildMusic() {
    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 1.5);
    master.connect(ctx.destination);
    this.master = master;

    // ── Layer 1: Deep sub-bass rumble (36 Hz) ────────────
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = 36;
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.65;
    bass.connect(bassGain); bassGain.connect(master);
    bass.start();

    // ── Layer 2: Slow melodic pad (Cm pentatonic) ────────
    // Notes: C3 Eb3 G3 Bb3 — slow cycle
    const padNotes = [130.81, 155.56, 196.00, 233.08];
    padNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0;
      // Fade each pad note in/out with slight offset — ethereal pad
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.025 + i * 0.007;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 0.08;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      g.gain.setValueAtTime(0.06 + i * 0.01, ctx.currentTime);
      osc.connect(g); g.connect(master);
      osc.start(); lfo.start();
    });

    // ── Layer 3: High shimmer (overtone cluster 523–880 Hz) 
    [523.25, 659.25, 783.99, 880.00].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.012 - i * 0.002;
      // Slow tremolo
      const trem = ctx.createOscillator();
      trem.frequency.value = 0.08 + i * 0.03;
      const tremG = ctx.createGain();
      tremG.gain.value = 0.008;
      trem.connect(tremG); tremG.connect(g.gain);
      osc.connect(g); g.connect(master);
      osc.start(); trem.start();
    });

    // ── Layer 4: Noise "wind" band (space texture) ───────
    const bufLen = ctx.sampleRate * 3;
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 180; bpf.Q.value = 0.3;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.04;
    noise.connect(bpf); bpf.connect(noiseGain); noiseGain.connect(master);
    noise.start();

    // ── Layer 5: Slow LFO pulse on master ────────────────
    const masterLfo = ctx.createOscillator();
    masterLfo.frequency.value = 0.03;
    const masterLfoG = ctx.createGain();
    masterLfoG.gain.value = 0.025;
    masterLfo.connect(masterLfoG); masterLfoG.connect(master.gain);
    masterLfo.start();

    // ── Occasional cosmic "ping" ──────────────────────────
    this._schedulePings();
    this.running = true;
  }

  _schedulePings() {
    const ctx = this.ctx;
    if (!ctx || ctx.state === 'closed') return;
    const pingNotes = [261.63, 329.63, 392.00, 523.25];
    const pingTime  = ctx.currentTime + 8 + Math.random() * 20;
    const freq      = pingNotes[Math.floor(Math.random() * pingNotes.length)];

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, pingTime);
    gain.gain.linearRampToValueAtTime(0.06, pingTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, pingTime + 3.5);
    osc.connect(gain); gain.connect(this.master);
    osc.start(pingTime); osc.stop(pingTime + 4);

    setTimeout(() => this._schedulePings(), (pingTime - ctx.currentTime + 4) * 1000);
  }

  toggle() {
    if (!this.supported) return;
    if (!this.ctx) {
      this.init();
      return;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
      this.running = true;
    } else {
      this.ctx.suspend();
      this.running = false;
    }
  }

  setButtonLabel(buttonEl) {
    if (!buttonEl) return;
    this.lastButtonEl = buttonEl;
    buttonEl.textContent = this.running ? '🔊 Audio On' : '🔈 Audio Off';
  }
}