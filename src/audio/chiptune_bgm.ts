import { AudioSynth } from './audio_synth';

/**
 * 音符頻率字典 (Hz)
 */
export const NOTE = {
  REST: 0,
  G2: 98.00,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.00,
  A3: 220.00,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.00,
  B5: 987.77,
  C6: 1046.50,
} as const;

export interface NoteEvent {
  freq: number;
  duration: number; // 拍數單位（1.0 = 1 拍，0.5 = 半拍，0.25 = 十六分音符）
}

/**
 * 《American Patrol》（美國巡邏兵進行曲）樂譜序列
 * C 大調，2/4 拍，經典紅白機 Stage 1 旋律
 */
export const AMERICAN_PATROL_LEAD: NoteEvent[] = [
  // 樂句 1: G4 -> C5 C5 C5 D5 | E5 C5 G4 C5
  { freq: NOTE.G4, duration: 0.5 },
  { freq: NOTE.C5, duration: 0.5 },
  { freq: NOTE.C5, duration: 0.25 },
  { freq: NOTE.C5, duration: 0.25 },
  { freq: NOTE.D5, duration: 0.5 },
  { freq: NOTE.E5, duration: 0.5 },
  { freq: NOTE.C5, duration: 0.5 },
  { freq: NOTE.G4, duration: 0.5 },
  { freq: NOTE.C5, duration: 0.5 },

  // 樂句 2: D5 D5 D5 E5 | F5 D5 B4 D5
  { freq: NOTE.D5, duration: 0.5 },
  { freq: NOTE.D5, duration: 0.25 },
  { freq: NOTE.D5, duration: 0.25 },
  { freq: NOTE.E5, duration: 0.5 },
  { freq: NOTE.F5, duration: 0.5 },
  { freq: NOTE.D5, duration: 0.5 },
  { freq: NOTE.B4, duration: 0.5 },
  { freq: NOTE.D5, duration: 0.5 },

  // 樂句 3: E5 E5 E5 F5 | G5 E5 C5 E5
  { freq: NOTE.E5, duration: 0.5 },
  { freq: NOTE.E5, duration: 0.25 },
  { freq: NOTE.E5, duration: 0.25 },
  { freq: NOTE.F5, duration: 0.5 },
  { freq: NOTE.G5, duration: 0.5 },
  { freq: NOTE.E5, duration: 0.5 },
  { freq: NOTE.C5, duration: 0.5 },
  { freq: NOTE.E5, duration: 0.5 },

  // 樂句 4: D5 C5 B4 A4 | G4 A4 B4 D5
  { freq: NOTE.D5, duration: 0.5 },
  { freq: NOTE.C5, duration: 0.5 },
  { freq: NOTE.B4, duration: 0.5 },
  { freq: NOTE.A4, duration: 0.5 },
  { freq: NOTE.G4, duration: 0.5 },
  { freq: NOTE.A4, duration: 0.25 },
  { freq: NOTE.B4, duration: 0.25 },
  { freq: NOTE.C5, duration: 1.0 },

  // 樂句 5 (副歌進階): E5 G5 C6 B5 | A5 G5 F5 E5
  { freq: NOTE.E5, duration: 0.5 },
  { freq: NOTE.G5, duration: 0.5 },
  { freq: NOTE.C6, duration: 0.75 },
  { freq: NOTE.B5, duration: 0.25 },
  { freq: NOTE.A5, duration: 0.5 },
  { freq: NOTE.G5, duration: 0.5 },
  { freq: NOTE.F5, duration: 0.5 },
  { freq: NOTE.E5, duration: 0.5 },

  // 樂句 6: D5 F5 B5 A5 | G5 F5 E5 D5
  { freq: NOTE.D5, duration: 0.5 },
  { freq: NOTE.F5, duration: 0.5 },
  { freq: NOTE.B5, duration: 0.75 },
  { freq: NOTE.A5, duration: 0.25 },
  { freq: NOTE.G5, duration: 0.5 },
  { freq: NOTE.F5, duration: 0.5 },
  { freq: NOTE.E5, duration: 0.5 },
  { freq: NOTE.D5, duration: 0.5 },

  // 樂句 7 結尾收束: C5 E5 G5 C6 | G5 E5 C5 REST
  { freq: NOTE.C5, duration: 0.5 },
  { freq: NOTE.E5, duration: 0.5 },
  { freq: NOTE.G5, duration: 0.5 },
  { freq: NOTE.C6, duration: 0.5 },
  { freq: NOTE.G5, duration: 0.5 },
  { freq: NOTE.E5, duration: 0.5 },
  { freq: NOTE.C5, duration: 0.5 },
  { freq: NOTE.REST, duration: 0.5 },
];

/**
 * 三角波低音聲部（Walking Bass: C3 -> G2 -> C3 -> G2...）
 */
export const AMERICAN_PATROL_BASS: NoteEvent[] = [
  { freq: NOTE.C3, duration: 0.5 },
  { freq: NOTE.G2, duration: 0.5 },
  { freq: NOTE.C3, duration: 0.5 },
  { freq: NOTE.G2, duration: 0.5 },
  { freq: NOTE.D3, duration: 0.5 },
  { freq: NOTE.G2, duration: 0.5 },
  { freq: NOTE.D3, duration: 0.5 },
  { freq: NOTE.G2, duration: 0.5 },
  { freq: NOTE.C3, duration: 0.5 },
  { freq: NOTE.G2, duration: 0.5 },
  { freq: NOTE.C3, duration: 0.5 },
  { freq: NOTE.G2, duration: 0.5 },
  { freq: NOTE.G2, duration: 0.5 },
  { freq: NOTE.D3, duration: 0.5 },
  { freq: NOTE.C3, duration: 1.0 },
];

/**
 * ChiptuneBgmPlayer
 * 採用 Web Audio Lookahead 排程機制，支援無縫循環播放
 */
export class ChiptuneBgmPlayer {
  private synth: AudioSynth;
  private bpm: number = 132;
  private secondsPerBeat: number;

  private isRunning: boolean = false;
  private scheduleTimer: ReturnType<typeof setInterval> | null = null;

  private nextNoteTime: number = 0;
  private leadNoteIndex: number = 0;
  private bassNoteIndex: number = 0;
  private drumStep: number = 0;

  constructor(synth: AudioSynth, bpm: number = 132) {
    this.synth = synth;
    this.bpm = bpm;
    this.secondsPerBeat = 60 / this.bpm;
  }

  public start(): void {
    if (this.isRunning) return;

    const ctx = this.synth.getContext();
    if (!ctx) return;

    this.isRunning = true;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.leadNoteIndex = 0;
    this.bassNoteIndex = 0;
    this.drumStep = 0;

    // 啟動定時檢查排程佇列 (Lookahead: 25ms 檢查一次，預排 100ms)
    this.scheduleTimer = setInterval(() => {
      this.scheduler();
    }, 25);
  }

  public pause(): void {
    this.isRunning = false;
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  public resume(): void {
    if (this.isRunning) return;
    this.start();
  }

  public stop(): void {
    this.pause();
    this.leadNoteIndex = 0;
    this.bassNoteIndex = 0;
    this.drumStep = 0;
  }

  public isPlaying(): boolean {
    return this.isRunning;
  }

  private scheduler(): void {
    const ctx = this.synth.getContext();
    if (!ctx || !this.isRunning) return;

    const lookAheadWindow = 0.12; // 預排 120ms 內的音符
    while (this.nextNoteTime < ctx.currentTime + lookAheadWindow) {
      this.scheduleLeadNote(this.nextNoteTime);
      this.scheduleBassAndDrums(this.nextNoteTime);

      const leadEvent = AMERICAN_PATROL_LEAD[this.leadNoteIndex];
      const durationSec = leadEvent.duration * this.secondsPerBeat;

      this.nextNoteTime += durationSec;
      this.leadNoteIndex = (this.leadNoteIndex + 1) % AMERICAN_PATROL_LEAD.length;
    }
  }

  private scheduleLeadNote(_time: number): void {
    const ctx = this.synth.getContext();
    if (!ctx) return;

    const event = AMERICAN_PATROL_LEAD[this.leadNoteIndex];
    if (event.freq > 0) {
      const dur = event.duration * this.secondsPerBeat * 0.85; // 85% 斷音產生進行曲跳躍感
      this.synth.playPulse(event.freq, dur, {
        gain: 0.12,
        attack: 0.01,
        release: dur - 0.01,
        isBgm: true,
      });
    }
  }

  private scheduleBassAndDrums(_time: number): void {
    const bassEvent = AMERICAN_PATROL_BASS[this.bassNoteIndex];
    if (bassEvent && bassEvent.freq > 0) {
      const dur = bassEvent.duration * this.secondsPerBeat * 0.9;
      this.synth.playTriangle(bassEvent.freq, dur, {
        gain: 0.14,
        attack: 0.02,
        release: dur - 0.02,
        isBgm: true,
      });
    }
    this.bassNoteIndex = (this.bassNoteIndex + 1) % AMERICAN_PATROL_BASS.length;

    // 進行曲小鼓噪聲 rhythm (每 2 步打一次小鼓，第 4 步加重音)
    this.drumStep = (this.drumStep + 1) % 4;
    const isAccent = this.drumStep === 0;
    this.synth.playNoise(isAccent ? 0.06 : 0.03, {
      filterFreq: isAccent ? 2200 : 1600,
      gain: isAccent ? 0.08 : 0.04,
      isBgm: true,
    });
  }
}
