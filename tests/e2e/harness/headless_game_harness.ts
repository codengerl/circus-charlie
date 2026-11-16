import * as THREE from 'three';
import { setupHeadlessEnvironment, globalAudioSpy, CapturedAudioEvent } from './mock_canvas_audio';
import { PlayerCharlie, AABB, PlayerKinematicsConfig } from '../../../src/entities/player_charlie';
import { FireRing } from '../../../src/entities/fire_ring';
import { InputSnapshot } from '../../../src/core/input_manager';
import {
  setupVoxelScene,
  createVoxelCharlie,
  createVoxelLion,
  createVoxelBigRing,
  createVoxelSmallRing,
  createVoxelFirePot,
  createVoxelMoneyBag,
  createVoxelPodium,
} from './voxel_models';

export interface HarnessOptions {
  initialDistance?: number;
  initialBonus?: number;
  initialScore?: number;
  initialHighScore?: number;
  initialLives?: number;
  customRingX?: number;
  bonusDecayRate?: number; // 預設 40 / 秒
  playerConfig?: Partial<PlayerKinematicsConfig>;
}

export interface SmallRingEntity {
  x: number;
  groundY: number;
  width: number;
  height: number;
  moveSpeed: number;
  safeYMin: number;
  safeYMax: number;
  passed: boolean;
  isActive: boolean;
  hasBag: boolean;
  bagCollected: boolean;
  checkCollision: (aabb: AABB) => boolean;
  isSafeThrough: (aabb: AABB) => boolean;
  update: (dt: number, extraSpeed?: number) => void;
  getHitBox: () => AABB;
}

export interface FirePotEntity {
  id: string;
  x: number;
  groundY: number;
  width: number;
  height: number;
  isActive: boolean;
  passed: boolean;
  getAABB: () => AABB;
  checkCollision: (playerAABB: AABB) => boolean;
}

export interface MoneyBagEntity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  getAABB: () => AABB;
}

export interface CharlieStateSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isJumping: boolean;
  isGrounded: boolean;
  isHit: boolean;
  isCelebrating: boolean;
  aabb: AABB;
  hitAABB: AABB;
}

export interface GameStateSnapshot {
  frame: number;
  time: number;
  distance: number;
  bonus: number;
  score: number;
  highScore: number;
  lives: number;
  fsmState: 'PLAYING' | 'CHARLIE_HIT' | 'STAGE_CELEBRATION' | 'GAME_OVER' | 'IDLE';
  charlie: CharlieStateSnapshot;
  ring: {
    x: number;
    safeYMin: number;
    safeYMax: number;
    passed: boolean;
    isActive: boolean;
  };
  bigRings: Array<{
    x: number;
    safeYMin: number;
    safeYMax: number;
    passed: boolean;
    isActive: boolean;
  }>;
  smallRings: Array<{
    x: number;
    safeYMin: number;
    safeYMax: number;
    passed: boolean;
    hasBag: boolean;
    bagCollected: boolean;
  }>;
  firePots: Array<{
    id: string;
    x: number;
    width: number;
    height: number;
    passed: boolean;
  }>;
  moneyBags: Array<{
    id: string;
    x: number;
    y: number;
    collected: boolean;
  }>;
  audioEvents: CapturedAudioEvent[];
  lastTriggeredMilestone: number | null;
}

export class HeadlessGameHarness {
  public readonly fixedDelta: number = 1 / 60; // 60 Hz 確定性步進
  private currentFrame: number = 0;
  private currentTime: number = 0;

  // 核心實體
  public player: PlayerCharlie;
  public fireRing: FireRing; // 預設大火圈相容
  public bigRings: FireRing[] = [];
  public smallRings: SmallRingEntity[] = [];
  public firePots: FirePotEntity[] = [];
  public moneyBags: MoneyBagEntity[] = [];

  // 數值與狀態
  public initialDistance: number;
  public distance: number;
  public bonus: number;
  public score: number;
  public highScore: number;
  public lives: number;
  public fsmState: 'PLAYING' | 'CHARLIE_HIT' | 'STAGE_CELEBRATION' | 'GAME_OVER' | 'IDLE' = 'PLAYING';
  public bonusDecayRate: number;
  public lastTriggeredMilestone: number | null = null;
  public podiumReached: boolean = false;

  // 3D 體素場景
  public voxelScene: THREE.Scene;
  public voxelSunLight: THREE.DirectionalLight;
  public voxelAmbLight: THREE.AmbientLight;
  public voxelCharlieGroup: THREE.Group;
  public voxelLionGroup: THREE.Group;
  public voxelPodiumGroup: THREE.Group;

  // 輸入佇列與狀態
  private activeInput: InputSnapshot = {
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false,
    startJustPressed: false,
  };

  private scheduledActions: Array<{ frame: number; action: () => void }> = [];

  constructor(options: HarnessOptions = {}) {
    setupHeadlessEnvironment();
    globalAudioSpy.clear();

    this.player = new PlayerCharlie(options.playerConfig);
    this.fireRing = new FireRing({ x: options.customRingX ?? 260 });
    this.bigRings = [this.fireRing];

    this.initialDistance = options.initialDistance ?? 100.0;
    this.distance = this.initialDistance;
    this.bonus = options.initialBonus ?? 5000;
    this.score = options.initialScore ?? 0;
    this.highScore = options.initialHighScore ?? 20000;
    this.lives = options.initialLives ?? 3;
    this.bonusDecayRate = options.bonusDecayRate ?? 40;

    // 建立 3D 體素場景與燈光
    const { scene, directionalLight, ambientLight } = setupVoxelScene();
    this.voxelScene = scene;
    this.voxelSunLight = directionalLight;
    this.voxelAmbLight = ambientLight;

    this.voxelCharlieGroup = createVoxelCharlie();
    this.voxelLionGroup = createVoxelLion();
    this.voxelPodiumGroup = createVoxelPodium();

    this.voxelScene.add(this.voxelCharlieGroup);
    this.voxelScene.add(this.voxelLionGroup);
    this.voxelScene.add(this.voxelPodiumGroup);

    // 初始記錄 BGM 開始
    globalAudioSpy.record({
      type: 'bgm',
      name: 'bgm_american_patrol',
      time: 0,
      frame: 0,
    });
  }

  // --- 障礙物工廠與註冊 API ---

  public addBigRing(x: number): FireRing {
    const ring = new FireRing({ x });
    this.bigRings.push(ring);
    const voxelRing = createVoxelBigRing();
    voxelRing.position.set(x, ring.groundY + ring.height / 2, 0);
    this.voxelScene.add(voxelRing);
    return ring;
  }

  public addSmallRing(x: number, withBag: boolean = true): SmallRingEntity {
    const groundY = 32;
    const width = 20;
    const height = 56;
    const lowerFlameHeight = 12;
    const upperFlameHeight = 12;
    const safeYMin = groundY + lowerFlameHeight; // 44
    const safeYMax = groundY + height - upperFlameHeight; // 76

    const bagId = withBag ? `bag_${this.moneyBags.length + 1}` : '';
    if (withBag) {
      this.addMoneyBag(bagId, x, safeYMin + (safeYMax - safeYMin) / 2);
    }

    const smallRing: SmallRingEntity = {
      x,
      groundY,
      width,
      height,
      moveSpeed: 50,
      safeYMin,
      safeYMax,
      passed: false,
      isActive: true,
      hasBag: withBag,
      bagCollected: false,
      getHitBox: () => ({
        minX: smallRing.x - width / 2,
        maxX: smallRing.x + width / 2,
        minY: groundY,
        maxY: groundY + height,
      }),
      isSafeThrough: (playerAABB: AABB) => {
        const hasXOverlap = playerAABB.maxX > (smallRing.x - width / 2) && playerAABB.minX < (smallRing.x + width / 2);
        if (!hasXOverlap) return true;
        return playerAABB.minY >= safeYMin && playerAABB.maxY <= safeYMax;
      },
      checkCollision: (playerAABB: AABB) => {
        const halfW = width / 2;
        const upperFlame: AABB = {
          minX: smallRing.x - halfW,
          maxX: smallRing.x + halfW,
          minY: safeYMax,
          maxY: groundY + height,
        };
        const lowerFlame: AABB = {
          minX: smallRing.x - halfW,
          maxX: smallRing.x + halfW,
          minY: groundY,
          maxY: safeYMin,
        };
        const overlap = (a: AABB, b: AABB) =>
          a.maxX > b.minX && a.minX < b.maxX && a.maxY > b.minY && a.minY < b.maxY;
        return overlap(playerAABB, upperFlame) || overlap(playerAABB, lowerFlame);
      },
      update: (dt: number, extraSpeed: number = 0) => {
        if (!smallRing.isActive) return;
        smallRing.x -= (smallRing.moveSpeed + extraSpeed) * dt;
        if (withBag) {
          const bag = this.moneyBags.find(b => b.id === bagId);
          if (bag) bag.x = smallRing.x;
        }
      },
    };

    this.smallRings.push(smallRing);

    const voxelRing = createVoxelSmallRing();
    voxelRing.position.set(x, groundY + height / 2, 0);
    this.voxelScene.add(voxelRing);

    return smallRing;
  }

  public addFirePot(x: number): FirePotEntity {
    const id = `pot_${this.firePots.length + 1}`;
    const pot: FirePotEntity = {
      id,
      x,
      groundY: 32,
      width: 16,
      height: 20,
      isActive: true,
      passed: false,
      getAABB: () => ({
        minX: pot.x - pot.width / 2,
        maxX: pot.x + pot.width / 2,
        minY: pot.groundY,
        maxY: pot.groundY + pot.height, // 32 ~ 52
      }),
      checkCollision: (playerAABB: AABB) => {
        const box = pot.getAABB();
        const overlapX = playerAABB.maxX > box.minX && playerAABB.minX < box.maxX;
        const overlapY = playerAABB.maxY > box.minY && playerAABB.minY < box.maxY;
        return overlapX && overlapY;
      },
    };

    this.firePots.push(pot);
    const voxelPot = createVoxelFirePot();
    voxelPot.position.set(x, pot.groundY, 0);
    this.voxelScene.add(voxelPot);
    return pot;
  }

  public addMoneyBag(id: string, x: number, y: number): MoneyBagEntity {
    const bag: MoneyBagEntity = {
      id,
      x,
      y,
      width: 12,
      height: 12,
      collected: false,
      getAABB: () => ({
        minX: bag.x - bag.width / 2,
        maxX: bag.x + bag.width / 2,
        minY: bag.y - bag.height / 2,
        maxY: bag.y + bag.height / 2,
      }),
    };
    this.moneyBags.push(bag);
    const voxelBag = createVoxelMoneyBag();
    voxelBag.position.set(x, y, 0);
    this.voxelScene.add(voxelBag);
    return bag;
  }

  // --- 輸入控制 API ---

  public pressRight(): void {
    this.activeInput.right = true;
    this.activeInput.left = false;
  }

  public pressLeft(): void {
    this.activeInput.left = true;
    this.activeInput.right = false;
  }

  public pressSimultaneousLeftRight(): void {
    this.activeInput.left = true;
    this.activeInput.right = true;
  }

  public releaseHorizontal(): void {
    this.activeInput.left = false;
    this.activeInput.right = false;
  }

  public triggerJump(): void {
    this.activeInput.jump = true;
    this.activeInput.jumpJustPressed = true;
  }

  public releaseJump(): void {
    this.activeInput.jump = false;
    this.activeInput.jumpJustPressed = false;
  }

  public injectInput(partial: Partial<InputSnapshot>): void {
    this.activeInput = { ...this.activeInput, ...partial };
  }

  public scheduleAction(frame: number, action: () => void): void {
    this.scheduledActions.push({ frame, action });
  }

  // --- 重生與狀態重置 ---

  public respawn(x: number = 48, y: number = 32): void {
    this.player.reset(x, y);
    this.fsmState = 'PLAYING';
    globalAudioSpy.record({
      type: 'sfx',
      name: 'respawn',
      time: this.currentTime,
      frame: this.currentFrame,
    });
  }

  // --- 確定性步進引擎 ---

  public step(dt: number = this.fixedDelta): void {
    this.currentFrame++;
    this.currentTime += dt;

    // 執行排程指令
    const pendingActions = this.scheduledActions.filter(a => a.frame === this.currentFrame);
    for (const a of pendingActions) {
      a.action();
    }

    if (this.fsmState === 'GAME_OVER') {
      // 遊戲結束鎖定一切輸入與位移
      this.activeInput.jumpJustPressed = false;
      return;
    }

    // 處理左右同按相消
    const effectiveInput: InputSnapshot = {
      ...this.activeInput,
      left: this.activeInput.left && !this.activeInput.right,
      right: this.activeInput.right && !this.activeInput.left,
      jump: this.fsmState === 'STAGE_CELEBRATION' ? false : this.activeInput.jump,
      jumpJustPressed: this.fsmState === 'STAGE_CELEBRATION' ? false : this.activeInput.jumpJustPressed,
    };

    const wasJumping = this.player.isJumping;

    // 1. 物理運動推進
    this.player.update(dt, effectiveInput);

    if (this.fsmState === 'STAGE_CELEBRATION') {
      this.player.vx = 0;
    }

    this.updateHighScore();

    if (!wasJumping && this.player.isJumping) {
      globalAudioSpy.record({
        type: 'sfx',
        name: 'jump',
        time: this.currentTime,
        frame: this.currentFrame,
      });
    }

    // 2. 遊戲進行邏輯
    if (!this.player.isHit && this.fsmState === 'PLAYING') {
      // 距離衰減與背景捲動
      const scrollRate = (this.player.vx / 32) * dt * 0.3;
      if (this.player.vx > 0) {
        this.distance = Math.max(0, this.distance - scrollRate);
      } else if (this.player.vx < 0) {
        // 後退不增加距離超過初始起點
        this.distance = Math.min(this.initialDistance, this.distance - scrollRate);
      }

      // 里程碑檢驗（每 10m 觸發一次立柱檢驗）
      const currentMilestone = Math.floor(this.distance / 10) * 10;
      if (currentMilestone > 0 && currentMilestone !== this.lastTriggeredMilestone && this.distance <= currentMilestone + 0.1) {
        this.lastTriggeredMilestone = currentMilestone;
        globalAudioSpy.record({
          type: 'sfx',
          name: 'milestone',
          time: this.currentTime,
          frame: this.currentFrame,
          parameters: { milestone: currentMilestone },
        });
      }

      // BONUS 衰減
      if (this.bonus > 0) {
        const decay = Math.floor(dt * this.bonusDecayRate);
        this.bonus = Math.max(0, this.bonus - Math.max(1, decay));
        if (this.bonus === 0) {
          // BONUS 歸零逾時陣亡
          this.triggerDeath('bonus_timeout');
        }
      }

      // 障礙物位移與碰撞
      const playerHitBox = this.player.getHitAABB();

      // 大火圈更新
      for (const ring of this.bigRings) {
        ring.update(dt, this.player.vx * 0.4);

        if (ring.x < -30) {
          ring.reset(286);
        }

        if (ring.checkCollision(playerHitBox)) {
          this.triggerDeath('hit_big_ring');
          break;
        } else if (!ring.passedByPlayer && this.player.x > ring.x + ring.width / 2) {
          ring.passedByPlayer = true;
          this.score += 100;
          this.updateHighScore();
          globalAudioSpy.record({
            type: 'sfx',
            name: 'score',
            time: this.currentTime,
            frame: this.currentFrame,
          });
        }
      }

      // 小火圈更新
      if (this.fsmState === 'PLAYING') {
        for (const sRing of this.smallRings) {
          sRing.update(dt, this.player.vx * 0.4);

          if (sRing.checkCollision(playerHitBox)) {
            this.triggerDeath('hit_small_ring');
            break;
          } else if (!sRing.passed && this.player.x > sRing.x + sRing.width / 2) {
            sRing.passed = true;
            this.score += 200;
            this.updateHighScore();
            globalAudioSpy.record({
              type: 'sfx',
              name: 'score',
              time: this.currentTime,
              frame: this.currentFrame,
            });
          }
        }
      }

      // 地面火壺更新與碰撞檢驗
      if (this.fsmState === 'PLAYING') {
        for (const pot of this.firePots) {
          if (pot.checkCollision(playerHitBox)) {
            this.triggerDeath('hit_fire_pot');
            break;
          } else if (!pot.passed && this.player.x > pot.x + pot.width / 2) {
            pot.passed = true;
          }
        }
      }

      // 錢袋拾取檢驗
      if (this.fsmState === 'PLAYING') {
        for (const bag of this.moneyBags) {
          if (!bag.collected) {
            const bagBox = bag.getAABB();
            const overlapX = playerHitBox.maxX > bagBox.minX && playerHitBox.minX < bagBox.maxX;
            const overlapY = playerHitBox.maxY > bagBox.minY && playerHitBox.minY < bagBox.maxY;
            if (overlapX && overlapY) {
              bag.collected = true;
              this.score += 500;
              this.updateHighScore();
              globalAudioSpy.record({
                type: 'sfx',
                name: 'money_bag',
                time: this.currentTime,
                frame: this.currentFrame,
              });
            }
          }
        }
      }

      // 抵達 0m 終點跳台
      if (this.distance <= 0 && !this.podiumReached) {
        this.distance = 0;
        this.podiumReached = true;
        this.fsmState = 'STAGE_CELEBRATION';
        this.player.isCelebrating = true;
        this.player.vx = 0;

        // 結算剩餘 BONUS
        this.score += this.bonus;
        this.updateHighScore();

        globalAudioSpy.record({
          type: 'sfx',
          name: 'cheer',
          time: this.currentTime,
          frame: this.currentFrame,
          parameters: { finalScore: this.score, finalBonus: this.bonus },
        });
      }
    }

    // 同步 3D 體素位置
    this.voxelCharlieGroup.position.set(this.player.x, this.player.y + 16, 0);
    this.voxelLionGroup.position.set(this.player.x, this.player.y + 8, 0);

    // 單次按鍵消耗
    this.activeInput.jumpJustPressed = false;
    this.activeInput.startJustPressed = false;
  }

  private triggerDeath(cause: string): void {
    this.player.isHit = true;
    this.lives = Math.max(0, this.lives - 1);

    globalAudioSpy.record({
      type: 'sfx',
      name: 'hit',
      time: this.currentTime,
      frame: this.currentFrame,
      parameters: { cause, remainingLives: this.lives },
    });

    if (this.lives === 0) {
      this.fsmState = 'GAME_OVER';
      globalAudioSpy.record({
        type: 'sfx',
        name: 'game_over',
        time: this.currentTime,
        frame: this.currentFrame,
      });
    } else {
      this.fsmState = 'CHARLIE_HIT';
    }
  }

  private updateHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  public stepFrames(frameCount: number): void {
    for (let i = 0; i < frameCount; i++) {
      this.step();
    }
  }

  public stepSeconds(seconds: number): void {
    const totalFrames = Math.round(seconds / this.fixedDelta);
    this.stepFrames(totalFrames);
  }

  public stepUntil(predicate: (state: GameStateSnapshot) => boolean, maxFrames: number = 3600): boolean {
    for (let i = 0; i < maxFrames; i++) {
      this.step();
      if (predicate(this.getSnapshot())) {
        return true;
      }
    }
    return false;
  }

  public getSnapshot(): GameStateSnapshot {
    return {
      frame: this.currentFrame,
      time: this.currentTime,
      distance: this.distance,
      bonus: this.bonus,
      score: this.score,
      highScore: this.highScore,
      lives: this.lives,
      fsmState: this.fsmState,
      charlie: {
        x: this.player.x,
        y: this.player.y,
        vx: this.player.vx,
        vy: this.player.vy,
        isJumping: this.player.isJumping,
        isGrounded: this.player.isGrounded,
        isHit: this.player.isHit,
        isCelebrating: this.player.isCelebrating,
        aabb: this.player.getAABB(),
        hitAABB: this.player.getHitAABB(),
      },
      ring: {
        x: this.fireRing.x,
        safeYMin: this.fireRing.safeYMin,
        safeYMax: this.fireRing.safeYMax,
        passed: this.fireRing.passedByPlayer,
        isActive: this.fireRing.isActive,
      },
      bigRings: this.bigRings.map(r => ({
        x: r.x,
        safeYMin: r.safeYMin,
        safeYMax: r.safeYMax,
        passed: r.passedByPlayer,
        isActive: r.isActive,
      })),
      smallRings: this.smallRings.map(sr => ({
        x: sr.x,
        safeYMin: sr.safeYMin,
        safeYMax: sr.safeYMax,
        passed: sr.passed,
        hasBag: sr.hasBag,
        bagCollected: sr.bagCollected,
      })),
      firePots: this.firePots.map(p => ({
        id: p.id,
        x: p.x,
        width: p.width,
        height: p.height,
        passed: p.passed,
      })),
      moneyBags: this.moneyBags.map(b => ({
        id: b.id,
        x: b.x,
        y: b.y,
        collected: b.collected,
      })),
      audioEvents: globalAudioSpy.getEvents(),
      lastTriggeredMilestone: this.lastTriggeredMilestone,
    };
  }
}
