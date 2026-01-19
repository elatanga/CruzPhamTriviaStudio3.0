class SoundService {
  private static instance: SoundService;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
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
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.setVolume(this.volume);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.context?.currentTime || 0);
    }
  }

  private createOscillator(type: OscillatorType, freq: number, startTime: number, duration: number, gainVal: number = 0.1) {
    if (!this.context || !this.masterGain) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // --- SOUND FX ---

  public playClick() {
    this.init();
    if (!this.context) return;
    const t = this.context.currentTime;
    // High pitched metallic click
    this.createOscillator('sine', 1200, t, 0.05, 0.05);
    this.createOscillator('triangle', 2000, t, 0.05, 0.02);
  }

  public playReveal() {
    this.init();
    if (!this.context) return;
    const t = this.context.currentTime;
    // Glassy swell
    this.createOscillator('sine', 400, t, 0.5, 0.1);
    this.createOscillator('sine', 800, t, 0.5, 0.05);
    this.createOscillator('triangle', 1200, t + 0.1, 0.6, 0.02);
  }

  public playAward() {
    this.init();
    if (!this.context) return;
    const t = this.context.currentTime;
    // Major chord arpeggio (C Major)
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.createOscillator('triangle', freq, t + (i * 0.08), 0.4, 0.1);
    });
  }

  public playDoubleOrNothing() {
    this.init();
    if (!this.context) return;
    const t = this.context.currentTime;
    // Siren / Alert luxury style
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.5);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 1.5);
    
    osc.start(t);
    osc.stop(t + 1.5);
  }

  public playVoid() {
    this.init();
    if (!this.context) return;
    const t = this.context.currentTime;
    // Low dissonance
    this.createOscillator('sawtooth', 100, t, 0.4, 0.1);
    this.createOscillator('sawtooth', 105, t, 0.4, 0.1); // Dissonant interval
  }

  public playTimerTick() {
    this.init();
    if (!this.context) return;
    const t = this.context.currentTime;
    // Woodblock tick
    this.createOscillator('square', 800, t, 0.03, 0.05);
  }
}

export const soundService = SoundService.getInstance();
