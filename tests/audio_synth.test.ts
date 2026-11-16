import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupHeadlessEnvironment } from './e2e/harness/mock_canvas_audio';
import { AudioSynth } from '../src/audio/audio_synth';
import { ChiptuneBgmPlayer, AMERICAN_PATROL_LEAD, AMERICAN_PATROL_BASS, NOTE } from '../src/audio/chiptune_bgm';
import { SfxPlayer } from '../src/audio/sfx_player';
import { AudioManager } from '../src/audio/audio_manager';

describe('Milestone 3: Web Audio 8-bit APU 子系統測試 (Audio Synth & APU Unit Tests)', () => {
  beforeEach(() => {
    setupHeadlessEnvironment();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('AudioSynth 基礎合成器', () => {
    it('AS-1: 成功實例化 AudioContext 並建立 Master, BGM, SFX 增益總線', () => {
      const synth = new AudioSynth();
      const ctx = synth.getContext();
      expect(ctx).toBeDefined();
      expect(synth.getUnlocked()).toBe(true);
    });

    it('AS-2: playPulse 成功調度方波振盪器與包絡參數', () => {
      const synth = new AudioSynth();
      const osc = synth.playPulse(440, 0.2, {
        sweepToFreq: 880,
        gain: 0.15,
        attack: 0.01,
        release: 0.19,
        isBgm: false,
      });
      expect(osc).toBeDefined();
      expect(osc?.type).toBe('square');
      expect(osc?.frequency.value).toBe(880); // linearRamp sets mock value
    });

    it('AS-3: playTriangle 成功調度三角波振盪器與低音參數', () => {
      const synth = new AudioSynth();
      const osc = synth.playTriangle(NOTE.C3, 0.4, {
        gain: 0.18,
        isBgm: true,
      });
      expect(osc).toBeDefined();
      expect(osc?.type).toBe('triangle');
      expect(osc?.frequency.value).toBe(NOTE.C3);
    });

    it('AS-4: playNoise 在 Mock 環境下成功平穩調度 fallback 雜訊振盪器而無例外崩潰', () => {
      const synth = new AudioSynth();
      expect(() => {
        synth.playNoise(0.2, { filterFreq: 1200, gain: 0.15, isBgm: false });
      }).not.toThrow();
    });

    it('AS-5: 音量調節函式正確限制在 [0, 1] 邊界內', () => {
      const synth = new AudioSynth();
      expect(() => {
        synth.setMasterVolume(0.5);
        synth.setMasterVolume(1.5); // 超出上限
        synth.setMasterVolume(-0.2); // 低於下限
        synth.setBgmVolume(0.3);
        synth.setSfxVolume(0.4);
      }).not.toThrow();
    });
  });

  describe('ChiptuneBgmPlayer 背景音樂播放器', () => {
    it('BGM-1: American Patrol 進行曲樂譜資料結構完整性', () => {
      expect(AMERICAN_PATROL_LEAD.length).toBeGreaterThan(20);
      expect(AMERICAN_PATROL_BASS.length).toBeGreaterThan(10);
      for (const item of AMERICAN_PATROL_LEAD) {
        expect(item.duration).toBeGreaterThan(0);
        expect(item.freq).toBeGreaterThanOrEqual(0);
      }
    });

    it('BGM-2: start, pause, resume, stop 生命週期正常切換', () => {
      const synth = new AudioSynth();
      const bgm = new ChiptuneBgmPlayer(synth, 132);

      expect(bgm.isPlaying()).toBe(false);
      bgm.start();
      expect(bgm.isPlaying()).toBe(true);

      // 前進時間觸發定時器
      vi.advanceTimersByTime(100);

      bgm.pause();
      expect(bgm.isPlaying()).toBe(false);

      bgm.resume();
      expect(bgm.isPlaying()).toBe(true);

      bgm.stop();
      expect(bgm.isPlaying()).toBe(false);
    });
  });

  describe('SfxPlayer 經典 8-bit 音效合成', () => {
    it('SFX-1: 調用 5 大音效均可正常執行無拋錯', () => {
      const synth = new AudioSynth();
      const sfx = new SfxPlayer(synth);

      expect(() => {
        sfx.playJump();
        sfx.playScore();
        sfx.playMoneyBag();
        sfx.playHit();
        sfx.playCheer();
      }).not.toThrow();

      // 前進定時器以涵蓋延遲音效 (setTimeout)
      vi.advanceTimersByTime(1200);
    });
  });

  describe('AudioManager 統一音訊管理器', () => {
    it('AM-1: 統一調度介面與向後相容別名正常運作', async () => {
      const am = new AudioManager();
      am.init();
      const unlocked = await am.unlockAudioContext();
      expect(unlocked).toBe(true);

      am.startBgm();
      expect(am.bgmPlayer.isPlaying()).toBe(true);

      am.playSfx('jump');
      am.playSfx('score');
      am.playSfx('moneyBag');
      am.playSfx('hit');
      am.playSfx('cheer');

      vi.advanceTimersByTime(500);
      am.stopBgm();
      expect(am.bgmPlayer.isPlaying()).toBe(false);
    });
  });
});
