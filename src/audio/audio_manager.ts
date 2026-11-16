import { AudioSynth } from './audio_synth';
import { ChiptuneBgmPlayer } from './chiptune_bgm';
import { SfxPlayer } from './sfx_player';

export type SfxType = 'jump' | 'score' | 'moneyBag' | 'hit' | 'cheer';

/**
 * 統一音訊管理器（AudioManager）
 * 統籌調度 BGM 與 SFX，落實手勢解鎖、分頁切換自動自愈與音量平衡
 */
export class AudioManager {
  public synth: AudioSynth;
  public bgmPlayer: ChiptuneBgmPlayer;
  public sfxPlayer: SfxPlayer;

  private wasBgmPlayingBeforeSuspend: boolean = false;
  private unlockListenerBound: boolean = false;

  constructor() {
    this.synth = new AudioSynth();
    this.bgmPlayer = new ChiptuneBgmPlayer(this.synth);
    this.sfxPlayer = new SfxPlayer(this.synth);

    this.setupGlobalUnlockListeners();
    this.setupVisibilityListeners();
  }

  public init(): void {
    this.synth.initContext();
  }

  /**
   * 解鎖 Web Audio 上下文（因應瀏覽器 Autoplay 規範）
   */
  public async unlockAudioContext(): Promise<boolean> {
    try {
      this.init();
      await this.synth.resume();
      return this.synth.getUnlocked();
    } catch {
      return false;
    }
  }

  public async ensureContextRunning(): Promise<void> {
    await this.synth.resume();
  }

  /**
   * 設定全域使用者手勢自動喚醒
   */
  private setupGlobalUnlockListeners(): void {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    if (this.unlockListenerBound) return;

    this.unlockListenerBound = true;
    const unlockEvents = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];

    const handleUnlock = async () => {
      await this.unlockAudioContext();
      if (this.synth.getUnlocked()) {
        unlockEvents.forEach((evt) => {
          window.removeEventListener(evt, handleUnlock);
        });
      }
    };

    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, handleUnlock, { passive: true, once: false });
    });
  }

  /**
   * 監聽瀏覽器分頁切換與音訊狀態自愈
   */
  private setupVisibilityListeners(): void {
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;

    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'hidden') {
        if (this.bgmPlayer.isPlaying()) {
          this.wasBgmPlayingBeforeSuspend = true;
          this.bgmPlayer.pause();
        }
      } else if (document.visibilityState === 'visible') {
        await this.ensureContextRunning();
        if (this.wasBgmPlayingBeforeSuspend) {
          this.wasBgmPlayingBeforeSuspend = false;
          this.bgmPlayer.resume();
        }
      }
    });
  }

  // --- BGM 控制 ---
  public startBgm(): void {
    this.bgmPlayer.start();
    this.ensureContextRunning();
  }

  public stopBgm(): void {
    this.bgmPlayer.stop();
  }

  public pauseBgm(): void {
    this.bgmPlayer.pause();
  }

  public resumeBgm(): void {
    this.bgmPlayer.resume();
    this.ensureContextRunning();
  }

  // --- SFX 控制 ---
  public playJump(): void {
    this.ensureContextRunning();
    this.sfxPlayer.playJump();
  }

  public playScore(): void {
    this.ensureContextRunning();
    this.sfxPlayer.playScore();
  }

  public playMoneyBag(): void {
    this.ensureContextRunning();
    this.sfxPlayer.playMoneyBag();
  }

  public playHit(): void {
    this.ensureContextRunning();
    this.sfxPlayer.playHit();
  }

  public playCheer(): void {
    this.ensureContextRunning();
    this.sfxPlayer.playCheer();
  }

  public playSfx(type: SfxType): void {
    switch (type) {
      case 'jump':
        this.playJump();
        break;
      case 'score':
        this.playScore();
        break;
      case 'moneyBag':
        this.playMoneyBag();
        break;
      case 'hit':
        this.playHit();
        break;
      case 'cheer':
        this.playCheer();
        break;
    }
  }

  // --- 增益控制 ---
  public setMasterVolume(val: number): void {
    this.synth.setMasterVolume(val);
  }

  public setBgmVolume(val: number): void {
    this.synth.setBgmVolume(val);
  }

  public setSfxVolume(val: number): void {
    this.synth.setSfxVolume(val);
  }
}
