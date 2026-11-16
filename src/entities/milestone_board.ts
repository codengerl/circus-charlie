import * as THREE from 'three';
import { createVoxelMilestone } from '../graphics/voxel_models';
import { GROUND_Y } from '../graphics/renderer_setup';

export interface MilestoneItem {
  distanceM: number;
  mesh: THREE.Group;
}

/**
 * 100m 至 10m 里程碑標記看板管理器（MilestoneBoard）
 * 動態管理跑道每 10m 的體素看板，並依世界進度平滑捲動
 */
export class MilestoneBoard {
  public group: THREE.Group;
  private milestones: MilestoneItem[] = [];
  private readonly PIXELS_PER_METER = 32;
  private readonly BASE_X = 60;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'MilestoneBoardsGroup';
    this.initBoards();
  }

  private initBoards(): void {
    // 建立 100m, 90m, ..., 10m 看板
    for (let m = 100; m >= 10; m -= 10) {
      const mesh = createVoxelMilestone(m);
      mesh.position.set(this.BASE_X, GROUND_Y, 0);
      mesh.visible = (m === 100);
      this.group.add(mesh);
      this.milestones.push({ distanceM: m, mesh });
    }
  }

  public getMesh(): THREE.Group {
    return this.group;
  }

  /**
   * 根據當前剩餘距離更新所有里程碑之可視性與螢幕位置
   */
  public update(currentDistance: number): void {
    for (const item of this.milestones) {
      // 計算相對於基準點的螢幕 X 座標
      const screenX = this.BASE_X + (currentDistance - item.distanceM) * this.PIXELS_PER_METER;
      item.mesh.position.x = screenX;

      // 視窗裁切：螢幕可視區約 -40 至 300 px
      if (screenX >= -40 && screenX <= 300) {
        item.mesh.visible = true;
      } else {
        item.mesh.visible = false;
      }
    }
  }

  public reset(): void {
    this.update(100.0);
  }
}
