import * as THREE from 'three';
import { AABB } from './player_charlie';
import { createVoxelFirePot } from '../graphics/voxel_models';

export interface FirePotConfig {
  id?: string;
  x?: number;
  groundY?: number;
}

/**
 * 地面固定火壺實體（Ground Fire Pot）
 * 2D 碰撞包圍盒：[x - 8, x + 8] x [groundY, groundY + 20]
 * 支援 3D 體素網格附著與物件池（Poolable）複用
 */
export class FirePot {
  public id: string;
  public x: number;
  public groundY: number = 32;
  public width: number = 16;
  public height: number = 20;

  public isActive: boolean = true;
  public passed: boolean = false;
  public passedByPlayer: boolean = false;

  public mesh: THREE.Group | null = null;

  constructor(config?: FirePotConfig) {
    this.id = config?.id ?? `pot_${Math.random().toString(36).substring(2, 9)}`;
    this.x = config?.x ?? 200;
    this.groundY = config?.groundY ?? 32;
  }

  /**
   * 初始化 3D 體素網格
   */
  public initMesh(): THREE.Group {
    if (!this.mesh) {
      this.mesh = createVoxelFirePot();
      this.updateMeshPosition();
    }
    return this.mesh;
  }

  /**
   * 取得 2D 碰撞包圍盒 AABB
   * [x - 8, x + 8] x [32, 52]
   */
  public getAABB(): AABB {
    return {
      minX: this.x - this.width / 2,
      maxX: this.x + this.width / 2,
      minY: this.groundY,
      maxY: this.groundY + this.height,
    };
  }

  /**
   * 碰撞檢驗（與玩家判定盒 AABB 相交）
   */
  public checkCollision(playerAABB: AABB): boolean {
    if (!this.isActive) return false;

    const potBox = this.getAABB();
    const overlapX = playerAABB.maxX > potBox.minX && playerAABB.minX < potBox.maxX;
    const overlapY = playerAABB.maxY > potBox.minY && playerAABB.minY < potBox.maxY;

    return overlapX && overlapY;
  }

  /**
   * 更新火壺位置（靜止於地面，隨世界捲動或速度向左移動）
   */
  public update(dt: number, scrollSpeed: number = 0): void {
    if (!this.isActive) return;

    if (scrollSpeed !== 0) {
      this.x -= scrollSpeed * dt;
      this.updateMeshPosition();
    }
  }

  /**
   * 同步 3D 體素網格空間座標
   */
  public updateMeshPosition(): void {
    if (this.mesh) {
      this.mesh.position.set(this.x, this.groundY, 0);
      this.mesh.visible = this.isActive;
    }
  }

  /**
   * 重置火壺狀態（物件池回收複用）
   */
  public reset(x?: number): void {
    if (x !== undefined) {
      this.x = x;
    }
    this.passed = false;
    this.passedByPlayer = false;
    this.isActive = true;
    this.updateMeshPosition();
  }

  public dispose(): void {
    this.isActive = false;
    if (this.mesh) {
      this.mesh.visible = false;
    }
  }
}
