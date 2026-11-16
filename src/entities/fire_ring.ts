import * as THREE from 'three';
import { AABB } from './player_charlie';
import { SpriteGenerator } from '../graphics/texture_generator';

export interface FireRingConfig {
  x: number;
  groundY: number;
  width: number;
  height: number;
  moveSpeed: number;
  lowerFlameHeight: number;
  upperFlameHeight: number;
}

export const DEFAULT_FIRE_RING_CONFIG: FireRingConfig = {
  x: 280,
  groundY: 32,
  width: 20,
  height: 96,
  moveSpeed: 45,           // 向左移動速度 45 px/s
  lowerFlameHeight: 14,     // 底部火焰高度 (Y: 32 ~ 46)
  upperFlameHeight: 10,     // 頂部火焰高度 (Y: 118 ~ 128)
};

/**
 * 火圈障礙物實體（Fire Ring Entity）
 * 具備前後 2.5D 深度拆分網格（Z=-5 與 Z=+5）、雙影格火焰燃燒動畫、中央中空安全窗與 AABB 碰撞判定
 */
export class FireRing {
  public x: number;
  public readonly groundY: number;
  public readonly width: number;
  public readonly height: number;
  public moveSpeed: number;

  public isActive: boolean = true;
  public passedByPlayer: boolean = false;

  // 安全穿透通道垂直區間
  public readonly safeYMin: number;
  public readonly safeYMax: number;

  // 動畫相關
  private animTimer: number = 0;
  private currentFrame: 1 | 2 = 1;

  // Three.js 前後分層網格
  public group: THREE.Group | null = null;
  public frontMesh: THREE.Mesh | null = null;
  public backMesh: THREE.Mesh | null = null;

  private frontTexture1?: THREE.CanvasTexture;
  private frontTexture2?: THREE.CanvasTexture;
  private backTexture1?: THREE.CanvasTexture;
  private backTexture2?: THREE.CanvasTexture;

  constructor(config: Partial<FireRingConfig> = {}) {
    const cfg = { ...DEFAULT_FIRE_RING_CONFIG, ...config };
    this.x = cfg.x;
    this.groundY = cfg.groundY;
    this.width = cfg.width;
    this.height = cfg.height;
    this.moveSpeed = cfg.moveSpeed;

    // 安全窗計算：底部火焰上方至頂部火焰下方
    this.safeYMin = this.groundY + cfg.lowerFlameHeight;
    this.safeYMax = this.groundY + this.height - cfg.upperFlameHeight;
  }

  /**
   * 初始化 Three.js 前後分層雙網格
   */
  public initMesh(): THREE.Group {
    if (typeof document !== 'undefined') {
      this.group = new THREE.Group();

      this.frontTexture1 = SpriteGenerator.createFireRingFrontTexture(1);
      this.frontTexture2 = SpriteGenerator.createFireRingFrontTexture(2);
      this.backTexture1 = SpriteGenerator.createFireRingBackTexture(1);
      this.backTexture2 = SpriteGenerator.createFireRingBackTexture(2);

      const geometry = new THREE.PlaneGeometry(this.width, this.height);

      // 後層網格 (Z = -5)
      const backMaterial = new THREE.MeshBasicMaterial({
        map: this.backTexture1,
        transparent: true,
        depthTest: true,
      });
      this.backMesh = new THREE.Mesh(geometry, backMaterial);
      this.backMesh.position.set(0, 0, -5);

      // 前層網格 (Z = +5)
      const frontMaterial = new THREE.MeshBasicMaterial({
        map: this.frontTexture1,
        transparent: true,
        depthTest: true,
      });
      this.frontMesh = new THREE.Mesh(geometry, frontMaterial);
      this.frontMesh.position.set(0, 0, 5);

      this.group.add(this.backMesh);
      this.group.add(this.frontMesh);

      // 設定 Group 中心點（Y 軸為 groundY + height/2）
      this.group.position.set(this.x, this.groundY + this.height / 2, 0);
    }
    return this.group as THREE.Group;
  }

  /**
   * 更新火圈位置與火焰動態影格
   */
  public update(dt: number, extraSpeed: number = 0): void {
    if (!this.isActive) return;

    // 向左推進
    this.x -= (this.moveSpeed + extraSpeed) * dt;

    // 動畫影格切換
    this.animTimer += dt;
    if (this.animTimer >= 0.1) {
      this.animTimer = 0;
      this.currentFrame = this.currentFrame === 1 ? 2 : 1;
      this.updateMeshVisuals();
    }

    if (this.group) {
      this.group.position.x = this.x;
    }
  }

  private updateMeshVisuals(): void {
    if (!this.frontMesh || !this.backMesh) return;

    const frontMat = this.frontMesh.material as THREE.MeshBasicMaterial;
    const backMat = this.backMesh.material as THREE.MeshBasicMaterial;

    if (this.currentFrame === 1) {
      if (this.frontTexture1) frontMat.map = this.frontTexture1;
      if (this.backTexture1) backMat.map = this.backTexture1;
    } else {
      if (this.frontTexture2) frontMat.map = this.frontTexture2;
      if (this.backTexture2) backMat.map = this.backTexture2;
    }

    frontMat.needsUpdate = true;
    backMat.needsUpdate = true;
  }

  /**
   * 取得火圈整體水平包圍盒
   */
  public getXBounds(): { minX: number; maxX: number } {
    const halfW = this.width / 2;
    return {
      minX: this.x - halfW,
      maxX: this.x + halfW,
    };
  }

  /**
   * 取得火圈上危險火焰區 AABB
   */
  public getUpperFlameAABB(): AABB {
    const halfW = this.width / 2;
    return {
      minX: this.x - halfW,
      maxX: this.x + halfW,
      minY: this.safeYMax,
      maxY: this.groundY + this.height,
    };
  }

  /**
   * 取得火圈下危險火焰區 AABB
   */
  public getLowerFlameAABB(): AABB {
    const halfW = this.width / 2;
    return {
      minX: this.x - halfW,
      maxX: this.x + halfW,
      minY: this.groundY,
      maxY: this.safeYMin,
    };
  }

  /**
   * 判定兩 AABB 包圍盒是否在 2D 平面上實質相交
   * 採用半開區間邊界相交測試（X 與 Y 維度皆必須同時具有重疊區間）
   */
  public static checkAABBOverlap(a: AABB, b: AABB): boolean {
    return (
      a.maxX > b.minX &&
      a.minX < b.maxX &&
      a.maxY > b.minY &&
      a.minY < b.maxY
    );
  }

  /**
   * 檢驗角色是否在水平重疊時安全穿透火圈安全通道
   */
  public isSafeThrough(playerAABB: AABB): boolean {
    const ringBounds = this.getXBounds();
    const hasXOverlap = playerAABB.maxX > ringBounds.minX && playerAABB.minX < ringBounds.maxX;
    if (!hasXOverlap) {
      return true; // 水平未相交，自然安全
    }

    // 檢查垂直是否完全落在中央安全窗內
    return playerAABB.minY >= this.safeYMin && playerAABB.maxY <= this.safeYMax;
  }

  /**
   * 檢查角色是否與火圈的火焰危險區發生碰撞
   * 分別檢驗與上火焰盒 (getUpperFlameAABB) 及下火焰盒 (getLowerFlameAABB) 之實體 AABB 重疊
   */
  public checkCollision(playerAABB: AABB): boolean {
    const upperHit = FireRing.checkAABBOverlap(playerAABB, this.getUpperFlameAABB());
    const lowerHit = FireRing.checkAABBOverlap(playerAABB, this.getLowerFlameAABB());
    return upperHit || lowerHit;
  }

  /**
   * 重設火圈至指定位置
   */
  public reset(newX?: number): void {
    if (newX !== undefined) {
      this.x = newX;
    }
    this.isActive = true;
    this.passedByPlayer = false;
    if (this.group) {
      this.group.position.x = this.x;
    }
  }
}
