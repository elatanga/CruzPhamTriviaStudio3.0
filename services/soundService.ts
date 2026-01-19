class SoundService {
  private static instance: SoundService;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private volume: number = 0.5;

  private constructor() {}

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  public init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // --- MASTERING CHAIN ---
      // Dynamics Compressor for "produced" feel and clipping prevention
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.context.currentTime);
      this.compressor.knee.setValueAtTime(30, this.context.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.context.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.context.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.context.currentTime);

      this.masterGain = this.context.createGain();
      
      // Signal Path: Source -> Compressor -> Master Gain -> Output
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      
      this.setVolume(this.volume);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.context) {
      this.masterGain.gain.setValueAtTime(this.volume, this.context.currentTime);
    }
  }

  // --- PRIVATE SYNTHESIS HELPERS ---

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number, vol: number = 0.1) {
    if (!this.context || !this.compressor) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.005); // Fast attack
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.compressor);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playNoise(duration: number, startTime: number, vol: number = 0.1, filterFreq: number = 1000) {
    if (!this.context || !this.compressor) return;
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.Q.value = 1;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);

    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.start(startTime);
  }

  // --- PREMIUM SOUND EFFECTS ---

  /**
   * High-tech UI interaction click.
   * Very short, precise, high-frequency.
   */
  public playClick() {
    this.init();
    if (!this.context) return;
    const t = this.context.currentTime;
    
    // Layer 1: High Sine Ping
    this.playTone(1500, 'sine', 0.05, t, 0.05);
    // Layer 2: Filtered Noise Click
    this.playNoise(0.03, t, 0.04, 3000);
  }

  /**
   * Question Reveal.
   * A "Swell" effect + Glass Chime.
   */
  public playReveal() {
    this.init();
    if (!this.context || !this.compressor) return;
    const t = this.context.currentTime;
    
    // Layer 1: Swell (Reverse Cymbal feel)
    const osc1 = this.context.createOscillator();
    const gain1 = this.context.createGain();
    osc1.frequency.setValueAtTime(200, t);
    osc1.frequency.exponentialRampToValueAtTime(600, t + 0.3);
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.08, t + 0.2);
    gain1.gain.linearRampToValueAtTime(0, t + 0.35);
    osc1.connect(gain1);
    gain1.connect(this.compressor);
    osc1.start(t);
    osc1.stop(t + 0.35);

    // Layer 2: Glass Chime (Harmonics)
    this.playTone(1046.50, 'sine', 0.5, t + 0.1, 0.05); // C6
    this.playTone(2093.00, 'sine', 0.4, t + 0.1, 0.02); // C7
  }

  /**
   * Award Points.
   * A rich C Major 9 chord arpeggio with harmonics for sparkle.
   */
  public playAward() {
    this.init();
    if (!this.context) return;
    const t = this.context.currentTime;
    
    // Chord: C4, E4, G4, B4, D5 (C Major 9)
    const notes = [261.63, 329.63, 392.00, 493.88, 587.33];
    
    notes.forEach((freq, i) => {
      const delay = i * 0.04;
      // Fundamental
      this.playTone(freq, 'triangle', 0.6, t + delay, 0.08);
      // Sparkle Harmonic (1 octave up)
      this.playTone(freq * 2, 'sine', 0.4, t + delay, 0.03);
    });
  }

  /**
   * Double Or Nothing.
   * Cinematic Impact: Deep sub-bass drop + high-end shimmer/alarm.
   */
  public playDoubleOrNothing() {
    this.init();
    if (!this.context || !this.compressor) return;
    const t = this.context.currentTime;
    
    // Layer 1: Sub-bass Drop (Impact)
    const subOsc = this.context.createOscillator();
    const subGain = this.context.createGain();
    subOsc.frequency.setValueAtTime(120, t);
    subOsc.frequency.exponentialRampToValueAtTime(0.01, t + 0.8);
    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    subOsc.connect(subGain);
    subGain.connect(this.compressor);
    subOsc.start(t);
    subOsc.stop(t + 0.8);

    // Layer 2: Alarm / Shimmer
    const alarmOsc = this.context.createOscillator();
    const alarmGain = this.context.createGain();
    alarmOsc.type = 'sawtooth';
    alarmOsc.frequency.setValueAtTime(800, t);
    alarmOsc.frequency.linearRampToValueAtTime(1200, t + 0.1); // Slide up
    alarmOsc.frequency.linearRampToValueAtTime(800, t + 0.4);   // Slide down
    alarmGain.gain.setValueAtTime(0, t);
    alarmGain.gain.linearRampToValueAtTime(0.05, t + 0.05);
    alarmGain.gain.linearRampToValueAtTime(0, t + 0.4);
    alarmOsc.connect(alarmGain);
    alarmGain.connect(this.compressor);
    alarmOsc.start(t);
    alarmOsc.stop(t + 0.4);
  }

  /**
   * Void Question.
   * A "Power Down" / Glitch effect.
   */
  public playVoid() {
    this.init();
    if (!this.context || !this.compressor) return;
    const t = this.context.currentTime;
    
    // FM Glitch
    const carrier = this.context.createOscillator();
    const carrierGain = this.context.createGain();
    const modulator = this.context.createOscillator();
    const modulatorGain = this.context.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(100, t);
    
    modulator.frequency.value = 50; // Fast modulation
    modulatorGain.gain.value = 500; // Deep modulation depth

    modulator.connect(modulatorGain);
    modulatorGain.connect(carrier.frequency);

    carrierGain.gain.setValueAtTime(0.15, t);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    carrier.connect(carrierGain);
    carrierGain.connect(this.compressor);

    carrier.start(t);
    modulator.start(t);
    carrier.stop(t + 0.4);
    modulator.stop(t + 0.4);
  }

  /**
   * Timer Tick.
   * Precise mechanical watch sound (Woodblock/Tick).
   */
  public playTimerTick() {
    this.init();
    if (!this.context || !this.compressor) return;
    const t = this.context.currentTime;
    
    // Filtered Square Wave
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    
    osc.type = 'square';
    osc.frequency.value = 800;
    
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;
    
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export const soundService = SoundService.getInstance();
