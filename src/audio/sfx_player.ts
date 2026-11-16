import { AudioSynth } from './audio_synth';

/**
 * 8-bit APU 經典音效播放器（SFX Player）
 * 涵蓋 5 大類音效：跳躍、穿圈得分、金幣錢袋、碰撞陣亡、終點勝利歡呼
 */
export class SfxPlayer {
  private synth: AudioSynth;

  constructor(synth: AudioSynth) {
    this.synth = synth;
  }

  /**
   * 跳躍音效（180Hz -> 540Hz 方波線性滑頻，歷時 0.16s）
   */
  public playJump(): void {
    this.synth.playPulse(180, 0.16, {
      sweepToFreq: 540,
      gain: 0.16,
      attack: 0.01,
      release: 0.15,
      isBgm: false,
    });
  }

  /**
   * 穿圈得分音效（659.25Hz -> 880.0Hz 方波雙音琶音）
   */
  public playScore(): void {
    const ctx = this.synth.getContext();
    if (!ctx) return;

    // 第一音 (E5: 659.25Hz, 0.06s)
    this.synth.playPulse(659.25, 0.06, {
      gain: 0.14,
      attack: 0.005,
      release: 0.055,
      isBgm: false,
    });

    // 第二音 (A5: 880.0Hz, 0.08s) 於 0.06s 後發聲
    setTimeout(() => {
      this.synth.playPulse(880.0, 0.08, {
        gain: 0.15,
        attack: 0.005,
        release: 0.075,
        isBgm: false,
      });
    }, 60);
  }

  /**
   * 金幣錢袋音效（987.77Hz -> 1318.51Hz 高音清脆雙音階）
   */
  public playMoneyBag(): void {
    // 第一音 (B5: 987.77Hz, 0.08s)
    this.synth.playPulse(987.77, 0.08, {
      gain: 0.16,
      attack: 0.005,
      release: 0.075,
      isBgm: false,
    });

    // 第二音 (E6: 1318.51Hz, 0.10s) 於 0.08s 後發聲
    setTimeout(() => {
      this.synth.playPulse(1318.51, 0.10, {
        gain: 0.18,
        attack: 0.005,
        release: 0.095,
        isBgm: false,
      });
    }, 80);
  }

  /**
   * 碰撞陣亡音效（200Hz 快速墜落至 40Hz + 雜訊爆音）
   */
  public playHit(): void {
    // 方波下墜滑音 (220Hz -> 40Hz, 0.25s)
    this.synth.playPulse(220, 0.25, {
      sweepToFreq: 40,
      gain: 0.22,
      attack: 0.01,
      release: 0.24,
      isBgm: false,
    });

    // 伴隨短促帶通雜訊爆音 (0.22s)
    this.synth.playNoise(0.22, {
      filterFreq: 800,
      gain: 0.20,
      isBgm: false,
    });
  }

  /**
   * 終點歡呼音效（勝利號角和弦琶音 + 群眾鼓掌雜訊）
   */
  public playCheer(): void {
    // 勝利號角琶音 (C5, E5, G5, C6)
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        this.synth.playTriangle(freq, 0.20, {
          gain: 0.20,
          attack: 0.01,
          release: 0.19,
          isBgm: false,
        });
      }, idx * 100);
    });

    // 群眾掌聲節奏雜訊 (三波連續拍掌)
    [450, 650, 850, 1050].forEach((delay) => {
      setTimeout(() => {
        this.synth.playNoise(0.12, {
          filterFreq: 1400,
          gain: 0.15,
          isBgm: false,
        });
      }, delay);
    });
  }
}
