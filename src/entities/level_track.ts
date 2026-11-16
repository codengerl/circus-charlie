import * as THREE from 'three';
import { AABB } from './player_charlie';
import { FireRing } from './fire_ring';
import { FirePot } from './fire_pot';
import {
  FireRingPool,
  FirePotPool,
  SmallRingPool,
  MoneyBagPool,
  SmallRing,
  MoneyBag,
} from './object_pool';
import { createVoxelBigRing } from '../graphics/voxel_models';
import { VIRTUAL_WIDTH } from '../graphics/renderer_setup';

export interface LevelTrackUpdateResult {
  hit: boolean;
  scoreGained: number;
  events: Array<'score' | 'moneyBag'>;
}

/**
 * 100m 關卡難度曲線與障礙物排程器（LevelTrack）
 * 集中管理物件池（FireRing, FirePot, SmallRing, MoneyBag）
 * 依據 100m 至 0m 距離梯度動態排程單火圈、火壺、錢袋小火圈與複合雙障礙
 */
export class LevelTrack {
  public scene: THREE.Scene;
  public group: THREE.Group;

  // 物件池
  public bigRingPool: FireRingPool;
  public firePotPool: FirePotPool;
  public smallRingPool: SmallRingPool;
  public moneyBagPool: MoneyBagPool;

  // 主活躍實體（供向後相容性與快速檢驗）
  public activeBigRing: FireRing;
  public activeFirePot: FirePot;
  public activeSmallRing: SmallRing;
  public activeMoneyBag: MoneyBag;

  // 次席活躍大火圈（用於 30m~15m 雙火圈複合障礙）
  public secondaryBigRing: FireRing;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'LevelTrackObstaclesGroup';
    this.scene.add(this.group);

    // 1. 初始化物件池
    this.bigRingPool = new FireRingPool(4);
    this.firePotPool = new FirePotPool(4);
    this.smallRingPool = new SmallRingPool(4);
    this.moneyBagPool = new MoneyBagPool(4);

    // 2. 索取並建立 3D 視覺網格
    this.activeBigRing = this.bigRingPool.acquire();
    this.activeBigRing.x = 280;
    const voxelRing = createVoxelBigRing();
    this.activeBigRing.group = voxelRing;
    this.group.add(voxelRing);

    this.secondaryBigRing = this.bigRingPool.acquire();
    this.secondaryBigRing.x = 999;
    const secondaryVoxelRing = createVoxelBigRing();
    this.secondaryBigRing.group = secondaryVoxelRing;
    secondaryVoxelRing.visible = false;
    this.group.add(secondaryVoxelRing);

    this.activeFirePot = this.firePotPool.acquire();
    this.activeFirePot.x = 420;
    const potMesh = this.activeFirePot.initMesh();
    this.group.add(potMesh);

    this.activeSmallRing = this.smallRingPool.acquire();
    this.activeSmallRing.x = 560;
    const smallRingMesh = this.activeSmallRing.initMesh();
    this.group.add(smallRingMesh);

    this.activeMoneyBag = this.moneyBagPool.acquire();
    this.activeMoneyBag.x = 560;
    this.activeMoneyBag.y = 60;
    const bagMesh = this.activeMoneyBag.initMesh();
    this.group.add(bagMesh);
  }

  /**
   * 根據當前剩餘距離推進障礙物物理、碰撞與難度生成
   */
  public update(
    dt: number,
    playerX: number,
    playerVx: number,
    distance: number,
    hitAABB: AABB
  ): LevelTrackUpdateResult {
    let hit = false;
    let scoreGained = 0;
    const events: Array<'score' | 'moneyBag'> = [];

    // 若小於 5m，終止生成新障礙物，已在場上的障礙物移出後不再重置
    const isFinishApproaching = distance <= 5.0;

    // --- 1. 主大火圈更新 ---
    this.activeBigRing.update(dt, playerVx * 0.4);
    if (this.activeBigRing.x < 350 && this.activeBigRing.x > -40) {
      if (this.activeBigRing.checkCollision(hitAABB)) {
        hit = true;
      } else if (!this.activeBigRing.passedByPlayer && playerX > this.activeBigRing.x + this.activeBigRing.width / 2) {
        this.activeBigRing.passedByPlayer = true;
        scoreGained += 100;
        events.push('score');
      }
    }
    if (this.activeBigRing.x < -30) {
      if (isFinishApproaching) {
        this.activeBigRing.x = 999;
        if (this.activeBigRing.group) this.activeBigRing.group.visible = false;
      } else {
        this.scheduleBigRingRespawn(distance);
      }
    }

    // --- 2. 次大火圈更新 (雙火圈區間 30m~15m) ---
    if (this.secondaryBigRing.group && this.secondaryBigRing.group.visible) {
      this.secondaryBigRing.update(dt, playerVx * 0.4);
      if (this.secondaryBigRing.x < 350 && this.secondaryBigRing.x > -40) {
        if (this.secondaryBigRing.checkCollision(hitAABB)) {
          hit = true;
        } else if (!this.secondaryBigRing.passedByPlayer && playerX > this.secondaryBigRing.x + this.secondaryBigRing.width / 2) {
          this.secondaryBigRing.passedByPlayer = true;
          scoreGained += 100;
          events.push('score');
        }
      }
      if (this.secondaryBigRing.x < -30) {
        this.secondaryBigRing.x = 999;
        this.secondaryBigRing.group.visible = false;
      }
    }

    // --- 3. 地面火壺更新 ---
    const potScrollSpeed = (playerVx / 32) * 20;
    this.activeFirePot.update(dt, potScrollSpeed);
    if (this.activeFirePot.x < 350 && this.activeFirePot.x > -40) {
      if (this.activeFirePot.checkCollision(hitAABB)) {
        hit = true;
      } else if (!this.activeFirePot.passedByPlayer && playerX > this.activeFirePot.x + this.activeFirePot.width / 2) {
        this.activeFirePot.passedByPlayer = true;
        scoreGained += 200;
        events.push('score');
      }
    }
    if (this.activeFirePot.x < -30) {
      if (isFinishApproaching) {
        this.activeFirePot.x = 999;
        if (this.activeFirePot.mesh) this.activeFirePot.mesh.visible = false;
      } else {
        this.scheduleFirePotRespawn(distance);
      }
    }

    // --- 4. 小火圈與錢袋更新 ---
    this.activeSmallRing.update(dt, playerVx * 0.4);
    this.activeMoneyBag.x = this.activeSmallRing.x;
    this.activeMoneyBag.updateMeshPosition();

    if (this.activeSmallRing.x < 350 && this.activeSmallRing.x > -40) {
      if (this.activeSmallRing.checkCollision(hitAABB)) {
        hit = true;
      } else if (!this.activeSmallRing.passed && playerX > this.activeSmallRing.x + this.activeSmallRing.width / 2) {
        this.activeSmallRing.passed = true;
        scoreGained += 200;
        events.push('score');
      }

      if (!this.activeMoneyBag.collected && this.activeMoneyBag.checkCollision(hitAABB)) {
        this.activeMoneyBag.collect();
        scoreGained += 500;
        events.push('moneyBag');
      }
    }

    if (this.activeSmallRing.x < -30) {
      if (isFinishApproaching) {
        this.activeSmallRing.x = 999;
        this.activeMoneyBag.x = 999;
        if (this.activeSmallRing.mesh) this.activeSmallRing.mesh.visible = false;
        if (this.activeMoneyBag.mesh) this.activeMoneyBag.mesh.visible = false;
      } else {
        this.scheduleSmallRingRespawn(distance);
      }
    }

    return { hit, scoreGained, events };
  }

  /**
   * 難度曲線調度：大火圈重置
   */
  private scheduleBigRingRespawn(distance: number): void {
    if (distance > 85) {
      // 100m~85m: 單一大火圈，寬鬆間距
      this.activeBigRing.reset(VIRTUAL_WIDTH + 50);
    } else if (distance > 70) {
      // 85m~70m: 大火圈
      this.activeBigRing.reset(VIRTUAL_WIDTH + 60);
    } else if (distance > 50) {
      // 70m~50m: 主推小火圈，大火圈間隔拉長
      this.activeBigRing.reset(VIRTUAL_WIDTH + 180);
    } else if (distance > 30) {
      // 50m~30m: 複合障礙，大火圈伴隨火壺 (X=280 與火壺 X=320)
      this.activeBigRing.reset(280);
      this.activeFirePot.reset(320);
    } else if (distance > 15) {
      // 30m~15m: 雙火圈並進 (Ring1 X=280, Ring2 X=325)
      this.activeBigRing.reset(280);
      this.secondaryBigRing.reset(325);
      if (this.secondaryBigRing.group) {
        this.secondaryBigRing.group.visible = true;
      }
    } else {
      // 15m~5m: 終局挑戰密集火圈
      this.activeBigRing.reset(VIRTUAL_WIDTH + 40);
    }

    if (this.activeBigRing.group) {
      this.activeBigRing.group.visible = true;
    }
  }

  /**
   * 難度曲線調度：地面火壺重置
   */
  private scheduleFirePotRespawn(distance: number): void {
    if (distance > 85) {
      // 初段暫無或極少火壺
      this.activeFirePot.reset(VIRTUAL_WIDTH + 200);
    } else if (distance > 70) {
      // 85m~70m: 規律火壺
      this.activeFirePot.reset(VIRTUAL_WIDTH + 100);
    } else if (distance > 50) {
      // 70m~50m: 小火圈後方火壺
      this.activeFirePot.reset(VIRTUAL_WIDTH + 80);
    } else if (distance > 30) {
      // 50m~30m: 與大火圈複合
      this.activeFirePot.reset(VIRTUAL_WIDTH + 120);
    } else {
      // 高壓區
      this.activeFirePot.reset(VIRTUAL_WIDTH + 90);
    }

    if (this.activeFirePot.mesh) {
      this.activeFirePot.mesh.visible = true;
    }
  }

  /**
   * 難度曲線調度：小火圈與金幣袋重置
   */
  private scheduleSmallRingRespawn(distance: number): void {
    if (distance > 70) {
      // 前 30m 主要為大火圈
      this.activeSmallRing.reset(VIRTUAL_WIDTH + 260);
      this.activeMoneyBag.reset(VIRTUAL_WIDTH + 260, 60);
    } else {
      // 70m~5m: 獎勵與高難度小圈穿梭
      this.activeSmallRing.reset(VIRTUAL_WIDTH + 140);
      this.activeMoneyBag.reset(VIRTUAL_WIDTH + 140, 60);
    }

    if (this.activeSmallRing.mesh) {
      this.activeSmallRing.mesh.visible = true;
    }
    if (this.activeMoneyBag.mesh) {
      this.activeMoneyBag.mesh.visible = true;
    }
  }

  /**
   * 重設所有障礙物至初始狀態
   */
  public reset(): void {
    this.activeBigRing.reset(280);
    if (this.activeBigRing.group) this.activeBigRing.group.visible = true;

    this.secondaryBigRing.reset(999);
    if (this.secondaryBigRing.group) this.secondaryBigRing.group.visible = false;

    this.activeFirePot.reset(420);
    if (this.activeFirePot.mesh) this.activeFirePot.mesh.visible = true;

    this.activeSmallRing.reset(560);
    this.activeMoneyBag.reset(560, 60);
    if (this.activeSmallRing.mesh) this.activeSmallRing.mesh.visible = true;
    if (this.activeMoneyBag.mesh) this.activeMoneyBag.mesh.visible = true;
  }
}
