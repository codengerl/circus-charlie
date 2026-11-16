import * as THREE from 'three';
import { EngineLoop } from './core/engine_loop';
import { InputManager } from './core/input_manager';
import { GameFSM } from './core/game_fsm';
import { RendererSetup, GROUND_Y } from './graphics/renderer_setup';
import { ParallaxStage } from './graphics/parallax_stage';
import {
  createVoxelCharlie,
  createVoxelLion,
} from './graphics/voxel_models';
import { PlayerCharlie } from './entities/player_charlie';
import { VoxelCharacterAnimator } from './entities/voxel_character_animator';
import { Podium } from './entities/podium';
import { MilestoneBoard } from './entities/milestone_board';
import { LevelTrack } from './entities/level_track';
import { AudioManager } from './audio/audio_manager';
import { HUDOverlay, TouchControls } from './ui/index';
import { FireRing } from './entities/fire_ring';
import { FirePot } from './entities/fire_pot';
import {
  FireRingPool,
  FirePotPool,
  SmallRingPool,
  MoneyBagPool,
  SmallRing,
  MoneyBag,
} from './entities/object_pool';

// 向後相容導出
export { AudioManager as SoundEffects };

/**
 * 馬戲團跳火圈 3D 體素版主遊戲應用程式（GameApp）
 * 統籌調度 Three.js 場景、動力學、8-bit APU 音效、抬頭顯示器與跨平台控制
 */
export class GameApp {
  public rendererSetup: RendererSetup;
  public inputManager: InputManager;
  public engineLoop: EngineLoop;
  public fsm: GameFSM;
  public audioManager: AudioManager;
  public soundEffects: AudioManager; // 向後相容別名

  // UI 與控制
  public hudOverlay: HUDOverlay;
  public touchControls: TouchControls;

  // 3D 體素視覺舞台與實體
  public parallaxStage: ParallaxStage;
  public playerGroup: THREE.Group;
  public characterAnimator: VoxelCharacterAnimator;
  public podium: Podium;
  public milestoneBoard: MilestoneBoard;
  public levelTrack: LevelTrack;
  public player: PlayerCharlie;

  // 向後相容實體與物件池引用
  public get podiumMesh(): THREE.Group { return this.podium.getMesh(); }
  public get milestoneMesh(): THREE.Group { return this.milestoneBoard.getMesh(); }
  public get bigRingPool(): FireRingPool { return this.levelTrack.bigRingPool; }
  public get firePotPool(): FirePotPool { return this.levelTrack.firePotPool; }
  public get smallRingPool(): SmallRingPool { return this.levelTrack.smallRingPool; }
  public get moneyBagPool(): MoneyBagPool { return this.levelTrack.moneyBagPool; }
  public get activeBigRing(): FireRing { return this.levelTrack.activeBigRing; }
  public get activeFirePot(): FirePot { return this.levelTrack.activeFirePot; }
  public get activeSmallRing(): SmallRing { return this.levelTrack.activeSmallRing; }
  public get activeMoneyBag(): MoneyBag { return this.levelTrack.activeMoneyBag; }

  // 遊戲數值
  public score: number = 0;
  public highScore: number = 20000;
  public bonus: number = 5000;
  public distance: number = 100.0; // 100m 倒數至 0m
  public lives: number = 3;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('找不到 #game-canvas 元素');
    }

    this.rendererSetup = new RendererSetup(canvas);
    this.inputManager = new InputManager();
    this.audioManager = new AudioManager();
    this.soundEffects = this.audioManager;
    this.fsm = new GameFSM('Title');

    // 初始化 HUD 與行動端觸控控制器
    this.hudOverlay = new HUDOverlay();
    this.touchControls = new TouchControls(this.inputManager);
    this.highScore = this.hudOverlay.getHighScore();

    // 1. 初始化 3D 體素舞台背景
    this.parallaxStage = new ParallaxStage();
    this.rendererSetup.scene.add(this.parallaxStage.getMesh());

    // 2. 初始化 3D 體素玩家群組（查理騎乘於獅子背上）
    this.player = new PlayerCharlie();
    this.playerGroup = new THREE.Group();
    this.playerGroup.name = 'VoxelPlayerCharlieAndLion';

    const lion = createVoxelLion();
    const charlie = createVoxelCharlie();
    charlie.position.set(0, 10, 0); // 查理騎坐於獅背
    this.playerGroup.add(lion);
    this.playerGroup.add(charlie);
    this.rendererSetup.scene.add(this.playerGroup);

    // 3. 初始化 3D 角色動態控制器
    this.characterAnimator = new VoxelCharacterAnimator(this.playerGroup);

    // 4. 初始化 0m 終點跳台與 10m~100m 里程看板
    this.podium = new Podium();
    this.rendererSetup.scene.add(this.podium.getMesh());

    this.milestoneBoard = new MilestoneBoard();
    this.rendererSetup.scene.add(this.milestoneBoard.getMesh());

    // 5. 初始化關卡跑道與障礙物排程器
    this.levelTrack = new LevelTrack(this.rendererSetup.scene);

    // 6. 註冊狀態轉換監聽器
    this.fsm.onStateChange((payload) => {
      this.hudOverlay.setGameState(payload.currentState);
    });

    // 7. 啟動引擎循環（60 Hz 確定性模擬）
    this.engineLoop = new EngineLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );

    this.engineLoop.start();
  }

  public update(dt: number): void {
    const input = this.inputManager.getSnapshot();
    this.fsm.update(dt);
    const currentState = this.fsm.getState();

    // 狀態處理分流
    switch (currentState) {
      case 'Title':
        if (input.jumpJustPressed || input.startJustPressed) {
          this.audioManager.startBgm();
          this.fsm.transitionTo('StageIntro');
        }
        break;

      case 'StageIntro':
        if (this.fsm.getStateTime() >= 1.5) {
          this.resetGameRound();
          this.audioManager.startBgm();
          this.fsm.transitionTo('Playing');
        }
        break;

      case 'Playing':
        this.updatePlaying(dt, input);
        break;

      case 'CharlieHit':
        if (this.fsm.getStateTime() >= 1.0) {
          if (this.lives > 0) {
            this.fsm.transitionTo('RespawnWait');
          } else {
            this.fsm.transitionTo('GameOver');
          }
        }
        break;

      case 'RespawnWait':
        if (this.fsm.getStateTime() >= 0.8) {
          this.player.reset();
          this.player.isHit = false;
          this.audioManager.startBgm();
          this.fsm.transitionTo('Playing');
        }
        break;

      case 'StageCelebration':
        if (this.fsm.getStateTime() >= 3.0) {
          if (input.startJustPressed || input.jumpJustPressed) {
            this.fsm.transitionTo('StageIntro');
          }
        }
        break;

      case 'GameOver':
        if (input.startJustPressed || input.jumpJustPressed) {
          this.lives = 3;
          this.score = 0;
          this.bonus = 5000;
          this.distance = 100.0;
          this.fsm.transitionTo('Title');
        }
        break;
    }

    this.hudOverlay.update(this.score, this.highScore, this.bonus, this.lives, this.distance);
  }

  private resetGameRound(): void {
    this.player.reset();
    this.player.x = 40;
    this.player.y = GROUND_Y;
    this.bonus = 5000;
    this.distance = 100.0;

    this.levelTrack.reset();
    this.podium.reset();
    this.milestoneBoard.reset();
  }

  private updatePlaying(dt: number, input: ReturnType<InputManager['getSnapshot']>): void {
    const wasJumping = this.player.isJumping;

    // 更新角色動力學
    this.player.update(dt, input);

    if (!wasJumping && this.player.isJumping) {
      this.audioManager.playJump();
    }

    // 依據前進速度衰減距離與捲動背景（修正倒退超出 100m 邊界漏洞）
    const scrollRate = (this.player.vx / 32) * dt * 0.3;
    if (this.player.vx > 0) {
      this.distance = Math.max(0, this.distance - scrollRate);
    } else if (this.player.vx < 0) {
      this.distance = Math.min(100.0, this.distance - scrollRate);
    }
    this.parallaxStage.update(dt, (100 - this.distance) * 32);

    const hitAABB = this.player.getHitAABB();

    // 障礙物關卡曲線更新與判定
    const trackResult = this.levelTrack.update(dt, this.player.x, this.player.vx, this.distance, hitAABB);
    if (trackResult.hit) {
      this.audioManager.stopBgm();
      this.triggerHit();
      return;
    }

    if (trackResult.scoreGained > 0) {
      this.score += trackResult.scoreGained;
    }

    for (const evt of trackResult.events) {
      if (evt === 'score') {
        this.audioManager.playScore();
      } else if (evt === 'moneyBag') {
        this.audioManager.playMoneyBag();
      }
    }

    // 更新跑道里程看板與終點跳台
    this.podium.update(this.distance);
    this.milestoneBoard.update(this.distance);

    // 0m 終點跳台過關著陸判定
    if (this.distance <= 0) {
      this.distance = 0;
      this.score += Math.floor(this.bonus);
      this.player.y = this.podium.surfaceY;
      this.player.vx = 0;
      this.player.setAnimationState('cheer');
      this.audioManager.stopBgm();
      this.audioManager.playCheer();
      this.fsm.transitionTo('StageCelebration');
      return;
    }

    // BONUS 線性倒數（修正每訊框 Math.floor 截斷 Bug）
    this.bonus = Math.max(0, this.bonus - dt * 40);
    if (this.bonus <= 0) {
      this.bonus = 0;
      this.audioManager.stopBgm();
      this.triggerHit();
    }
  }

  private triggerHit(): void {
    this.player.setAnimationState('hit');
    this.lives = Math.max(0, this.lives - 1);
    this.audioManager.playHit();
    this.fsm.transitionTo('CharlieHit');
  }

  public render(_alpha: number): void {
    // 同步 3D 體素玩家模型位置
    this.playerGroup.position.set(this.player.x, this.player.y, 0);

    if (this.player.isHit) {
      this.playerGroup.rotation.z = -Math.PI / 4;
    } else {
      this.playerGroup.rotation.z = 0;
    }

    // 更新 3D 體素肢體動畫姿態
    this.characterAnimator.update(1 / 60, this.player.getAnimState(), this.player.getAnimFrame());

    // 渲染 Three.js 3D 體素場景
    this.rendererSetup.render();
  }
}

// 瀏覽器啟動主切片
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    new GameApp();
  });
}
