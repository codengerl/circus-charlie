import * as THREE from 'three';
import { InputSnapshot } from '../core/input_manager';
import { SpriteGenerator } from '../graphics/texture_generator';

export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface PlayerKinematicsConfig {
  groundY: number;
  baseSpeed: number;
  forwardSpeed: number;
  backwardSpeed: number;
  jumpVelocity: number;
  gravity: number;
}

export const DEFAULT_PLAYER_CONFIG: PlayerKinematicsConfig = {
  groundY: 32,
  baseSpeed: 60,       // 基礎前進巡航速度 (px/s)
  forwardSpeed: 120,    // 加速前進速度 (px/s)
  backwardSpeed: -35,   // 制動減速/後退速度 (px/s)
  jumpVelocity: 240,    // 垂直起跳初速度 (px/s)
  gravity: 600          // 重力加速度 (px/s^2)
};

/**
 * 查理騎獅實體（Player Charlie & Lion）
 * 涵蓋水平運動方程、重力拋物線跳躍、動畫狀態切換與 AABB 幾何邊界
 */
export class PlayerCharlie {
  // 世界座標與運動狀態
  public x: number = 48;
  public y: number = 32;
  public vx: number = 60;
  public vy: number = 0;

  public isJumping: boolean = false;
  public isGrounded: boolean = true;
  public isHit: boolean = false;
  public isCelebrating: boolean = false;

  public readonly config: PlayerKinematicsConfig;

  // 動畫計時與影格
  private animTimer: number = 0;
  private animFrameIndex: number = 0;
  public animState: 'run' | 'jump' | 'hit' | 'cheer' = 'run';

  // Three.js 視覺網格與紋理
  public mesh: THREE.Mesh | null = null;
  private textures: {
    run1?: THREE.CanvasTexture;
    run2?: THREE.CanvasTexture;
    jump?: THREE.CanvasTexture;
    dead?: THREE.CanvasTexture;
  } = {};

  constructor(config: Partial<PlayerKinematicsConfig> = {}) {
    this.config = { ...DEFAULT_PLAYER_CONFIG, ...config };
    this.y = this.config.groundY;
  }

  /**
   * 初始化 Three.js 網格與程序化紋理
   */
  public initMesh(): THREE.Mesh {
    if (typeof document !== 'undefined') {
      this.textures.run1 = SpriteGenerator.createCharlieLionRunFrame1();
      this.textures.run2 = SpriteGenerator.createCharlieLionRunFrame2();
      this.textures.jump = SpriteGenerator.createCharlieLionJumpFrame();
      this.textures.dead = SpriteGenerator.createCharlieLionDeadFrame();

      const geometry = new THREE.PlaneGeometry(32, 32);
      const material = new THREE.MeshBasicMaterial({
        map: this.textures.run1,
        transparent: true,
        depthTest: true,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(this.x, this.y + 16, 0); // 網格中心點錨定於 16px 處
    }
    return this.mesh as THREE.Mesh;
  }

  /**
   * 觸發跳躍
   */
  public jump(): boolean {
    if (!this.isJumping && this.isGrounded && !this.isHit) {
      this.isJumping = true;
      this.isGrounded = false;
      this.vy = this.config.jumpVelocity;
      return true;
    }
    return false;
  }

  /**
   * 物理與動力學更新循環
   */
  public update(dt: number, input: InputSnapshot): void {
    if (this.isHit) {
      this.animState = 'hit';
      // 撞擊受傷狀態停止橫向加速並迅速下墜
      if (this.y > this.config.groundY) {
        this.y += (this.vy - 0.5 * this.config.gravity * dt) * dt;
        this.vy -= this.config.gravity * dt;
        if (this.y < this.config.groundY) {
          this.y = this.config.groundY;
          this.vy = 0;
        }
      }
      this.updateMeshVisuals();
      return;
    }

    if (this.isCelebrating) {
      this.animState = 'cheer';
      this.animTimer += dt;
      if (this.animTimer >= 0.20) {
        this.animTimer = 0;
        this.animFrameIndex = (this.animFrameIndex + 1) % 2;
      }
      this.updateMeshVisuals();
      return;
    }

    // 1. 水平速度控制
    if (input.right) {
      this.vx = this.config.forwardSpeed;
    } else if (input.left) {
      this.vx = this.config.backwardSpeed;
    } else {
      this.vx = this.config.baseSpeed;
    }

    // 2. 跳躍觸發
    if (input.jumpJustPressed) {
      this.jump();
    }

    // 3. 垂直運動積分 (採用精確運動學半步長積分，消除離散步長數值能量流失)
    if (this.isJumping) {
      this.animState = 'jump';
      this.y += (this.vy - 0.5 * this.config.gravity * dt) * dt;
      this.vy -= this.config.gravity * dt;

      // 落地檢驗
      if (this.y <= this.config.groundY) {
        this.y = this.config.groundY;
        this.vy = 0;
        this.isJumping = false;
        this.isGrounded = true;
        this.animState = 'run';
      }
    } else {
      this.animState = 'run';
    }

    // 4. 動畫影格計時（奔跑 3 影格循環，0.11 秒/幀）
    this.animTimer += dt;
    if (this.animTimer >= 0.11) {
      this.animTimer = 0;
      this.animFrameIndex = (this.animFrameIndex + 1) % 3;
    }

    // 5. 同步更新 Three.js 網格
    this.updateMeshVisuals();
  }

  public setAnimationState(state: 'run' | 'jump' | 'hit' | 'cheer', frameIndex?: number): void {
    this.animState = state;
    if (frameIndex !== undefined) {
      this.animFrameIndex = frameIndex;
    }
    if (state === 'cheer') {
      this.isCelebrating = true;
      this.isHit = false;
    } else if (state === 'hit') {
      this.isHit = true;
      this.isCelebrating = false;
    } else if (state === 'jump') {
      this.isJumping = true;
      this.isGrounded = false;
    } else if (state === 'run') {
      this.isJumping = false;
      this.isGrounded = true;
      this.isHit = false;
      this.isCelebrating = false;
    }
  }

  public getAnimState(): 'run' | 'jump' | 'hit' | 'cheer' {
    return this.animState;
  }

  public getAnimFrame(): number {
    return this.animFrameIndex;
  }

  private updateMeshVisuals(): void {
    if (!this.mesh) return;

    // 更新位置 (Mesh 中心點需加上半徑 16)
    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y + 16;

    const material = this.mesh.material as THREE.MeshBasicMaterial;

    if (this.isHit && this.textures.dead) {
      material.map = this.textures.dead;
    } else if (this.isJumping && this.textures.jump) {
      material.map = this.textures.jump;
    } else if (this.textures.run1 && this.textures.run2) {
      material.map = this.animFrameIndex === 0 ? this.textures.run1 : this.textures.run2;
    }
    material.needsUpdate = true;
  }

  /**
   * 取得整體包圍盒 AABB (寬 32, 高 32)
   */
  public getAABB(): AABB {
    return {
      minX: this.x - 16,
      maxX: this.x + 16,
      minY: this.y,
      maxY: this.y + 32,
    };
  }

  /**
   * 取得內縮容錯判定盒（Padding 2px，防止像素邊緣過嚴判定）
   */
  public getHitAABB(): AABB {
    return {
      minX: this.x - 10,
      maxX: this.x + 10,
      minY: this.y + 4,
      maxY: this.y + 26,
    };
  }

  /**
   * 重設角色至預設位置與速度
   */
  public reset(x: number = 48, y: number = this.config.groundY): void {
    this.x = x;
    this.y = y;
    this.vx = this.config.baseSpeed;
    this.vy = 0;
    this.isJumping = false;
    this.isGrounded = true;
    this.isHit = false;
    this.isCelebrating = false;
    this.animState = 'run';
    this.animTimer = 0;
    this.animFrameIndex = 0;
    this.updateMeshVisuals();
  }
}
