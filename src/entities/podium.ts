import * as THREE from 'three';
import { createVoxelPodium } from '../graphics/voxel_models';
import { GROUND_Y } from '../graphics/renderer_setup';

export const PODIUM_SURFACE_Y = 46; // 終點跳台頂部平台 Y 座標

/**
 * 0m 終點跳台實體（Podium Entity）
 * 負責 0m 體素跳台之位置計算、逼近動畫與著陸判定
 */
export class Podium {
  public mesh: THREE.Group;
  public x: number = 200;
  public y: number = GROUND_Y;
  public readonly surfaceY: number = PODIUM_SURFACE_Y;
  public isPlayerLanded: boolean = false;

  constructor() {
    this.mesh = createVoxelPodium();
    this.mesh.position.set(this.x, this.y, 0);
    this.mesh.visible = false;
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * 根據剩餘距離更新跳台可視性與滑入位置
   */
  public update(distance: number): void {
    if (distance <= 5.0) {
      this.mesh.visible = true;
      // 距離 5.0m 至 0.0m 平滑滑入畫面中央 (200 - distance * 24)
      this.x = 200 - distance * 24;
      this.mesh.position.x = this.x;
    } else {
      this.mesh.visible = false;
      this.mesh.position.x = 350;
    }
  }

  /**
   * 判定玩家是否成功登頂跳台
   */
  public isPlayerOnPodium(playerX: number, playerY: number): boolean {
    const isHorizontalAligned = Math.abs(playerX - this.x) <= 24;
    const isAtLandingHeight = playerY >= this.surfaceY - 6;
    return isHorizontalAligned && isAtLandingHeight;
  }

  public reset(): void {
    this.x = 200;
    this.mesh.position.set(200, this.y, 0);
    this.mesh.visible = false;
    this.isPlayerLanded = false;
  }
}
