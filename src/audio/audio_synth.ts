/**
 * 8-bit APU 模擬音訊合成器（Web Audio API）
 * 實現 2 方波（Pulse 1/2）+ 1 三角波（Triangle）+ 1 雜訊（Noise）四頻道音訊合成
 * 0 外部音訊資產，純代碼產生
 */

export interface EnvelopeOptions {
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  gain?: number;
  sweepToFreq?: number;
  isBgm?: boolean;
}

export class AudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.initContext();
  }

  /**
   * 初始化 AudioContext 與總線增益節點
   */
  public initContext(): AudioContext | null {
    if (this.ctx) return this.ctx;

    try {
      const AudioCtxClass =
        (typeof window !== 'undefined' && (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)) ||
        (typeof globalThis !== 'undefined' && (globalThis as unknown as { AudioContext: typeof AudioContext }).AudioContext);

      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.setupBuses();
      }
    } catch {
      // 容錯降級處理
      this.ctx = null;
    }

    return this.ctx;
  }

  private setupBuses(): void {
    if (!this.ctx) return;

    try {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch {
      // 忽略無頭節點連接異常
    }
  }

  public getContext(): AudioContext | null {
    if (!this.ctx) {
      this.initContext();
    }
    return this.ctx;
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
        this.isUnlocked = true;
      } catch {
        // 忽略 resume 拒絕
      }
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }
  }

  public getUnlocked(): boolean {
    return this.isUnlocked || (this.ctx?.state === 'running');
  }

  /**
   * 播放方波音符（Pulse 頻道，主旋律與音效主要來源）
   */
  public playPulse(freq: number, duration: number, options: EnvelopeOptions = {}): OscillatorNode | null {
    const ctx = this.getContext();
    if (!ctx) return null;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';

      const peakGain = options.gain ?? 0.15;
      const targetBus = options.isBgm ? (this.bgmGain ?? ctx.destination) : (this.sfxGain ?? ctx.destination);

      osc.frequency.setValueAtTime(freq, t);
      if (options.sweepToFreq !== undefined && Number.isFinite(options.sweepToFreq)) {
        osc.frequency.linearRampToValueAtTime(options.sweepToFreq, t + duration);
      }

      const attack = options.attack ?? 0.01;
      const release = options.release ?? Math.max(0.01, duration - attack);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(peakGain, t + attack);
      gain.gain.linearRampToValueAtTime(0.001, t + attack + release);

      osc.connect(gain);
      gain.connect(targetBus);

      osc.start(t);
      osc.stop(t + duration + 0.02);
      return osc;
    } catch {
      return null;
    }
  }

  /**
   * 播放三角波音符（Triangle 頻道，低音 Bass 核心）
   */
  public playTriangle(freq: number, duration: number, options: EnvelopeOptions = {}): OscillatorNode | null {
    const ctx = this.getContext();
    if (!ctx) return null;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';

      const peakGain = options.gain ?? 0.18;
      const targetBus = options.isBgm ? (this.bgmGain ?? ctx.destination) : (this.sfxGain ?? ctx.destination);

      osc.frequency.setValueAtTime(freq, t);
      if (options.sweepToFreq !== undefined && Number.isFinite(options.sweepToFreq)) {
        osc.frequency.linearRampToValueAtTime(options.sweepToFreq, t + duration);
      }

      const attack = options.attack ?? 0.01;
      const release = options.release ?? Math.max(0.01, duration - attack);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(peakGain, t + attack);
      gain.gain.linearRampToValueAtTime(0.001, t + attack + release);

      osc.connect(gain);
      gain.connect(targetBus);

      osc.start(t);
      osc.stop(t + duration + 0.02);
      return osc;
    } catch {
      return null;
    }
  }

  /**
   * 播放白雜訊 / 爆音（Noise 頻道，打擊樂小鼓與爆炸音效）
   */
  public playNoise(duration: number, options: { filterFreq?: number; gain?: number; isBgm?: boolean } = {}): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const targetBus = options.isBgm ? (this.bgmGain ?? ctx.destination) : (this.sfxGain ?? ctx.destination);
      const peakGain = options.gain ?? 0.12;

      // 檢查環境是否支援原生 createBufferSource
      if (typeof ctx.createBufferSource === 'function' && typeof ctx.createBuffer === 'function') {
        const bufferSize = Math.max(256, Math.floor(ctx.sampleRate * Math.min(duration, 1.0)));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(options.filterFreq ?? 1200, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(peakGain, t);
        gain.gain.linearRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(targetBus);

        noise.start(t);
        noise.stop(t + duration + 0.01);
      } else {
        // Fallback: 無頭環境或 MockAudioContext 使用高頻方波衰減替代
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(options.filterFreq ?? 800, t);
        gain.gain.setValueAtTime(peakGain * 0.5, t);
        gain.gain.linearRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(targetBus);
        osc.start(t);
        osc.stop(t + duration);
      }
    } catch {
      // 容錯靜默
    }
  }

  public setMasterVolume(val: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  public setBgmVolume(val: number): void {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  public setSfxVolume(val: number): void {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }
}
