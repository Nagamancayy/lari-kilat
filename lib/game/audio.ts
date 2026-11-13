type Tone = {
  frequency: number;
  endFrequency?: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  delay?: number;
};

const SOUNDS: Record<string, Tone[]> = {
  jump: [{ frequency: 380, endFrequency: 640, duration: 0.11, type: "triangle", volume: 0.16 }],
  land: [{ frequency: 160, endFrequency: 90, duration: 0.07, type: "sine", volume: 0.09 }],
  coin: [
    { frequency: 880, duration: 0.07, type: "sine", volume: 0.16 },
    { frequency: 1320, duration: 0.09, type: "sine", volume: 0.13, delay: 0.06 },
  ],
  spring: [{ frequency: 300, endFrequency: 980, duration: 0.2, type: "triangle", volume: 0.16 }],
  checkpoint: [
    { frequency: 520, duration: 0.08, type: "triangle", volume: 0.13 },
    { frequency: 780, duration: 0.12, type: "triangle", volume: 0.12, delay: 0.08 },
  ],
  hurt: [{ frequency: 260, endFrequency: 70, duration: 0.28, type: "sawtooth", volume: 0.14 }],
  respawn: [{ frequency: 420, endFrequency: 620, duration: 0.14, type: "sine", volume: 0.1 }],
  won: [
    { frequency: 523, duration: 0.11, type: "triangle", volume: 0.15 },
    { frequency: 659, duration: 0.11, type: "triangle", volume: 0.15, delay: 0.1 },
    { frequency: 784, duration: 0.11, type: "triangle", volume: 0.15, delay: 0.2 },
    { frequency: 1046, duration: 0.26, type: "triangle", volume: 0.16, delay: 0.3 },
  ],
};

export class GameAudio {
  private context: AudioContext | null = null;
  private muted: boolean;

  constructor(muted = false) {
    this.muted = muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  resume(): void {
    if (this.muted) return;
    if (!this.context) {
      const Ctor = window.AudioContext;
      if (!Ctor) return;
      this.context = new Ctor();
    }
    if (this.context.state === "suspended") {
      void this.context.resume();
    }
  }

  play(name: string): void {
    if (this.muted) return;
    const tones = SOUNDS[name];
    if (!tones) return;
    this.resume();
    const context = this.context;
    if (!context) return;

    for (const tone of tones) {
      const start = context.currentTime + (tone.delay ?? 0);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = tone.type;
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      if (tone.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, tone.endFrequency), start + tone.duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(tone.volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + tone.duration + 0.02);
    }
  }
}
