import * as THREE from 'three';
import { PALETTE } from '../assets/pixel_palette';
import { createVoxelCube, VoxelSpec } from './voxel_builder';

export interface ParallaxStageOptions {
  trackWidth?: number;
}

/**
 * 3D 體素馬戲團舞台背景系統（ParallaxStage）
 * 包含：
 * 1. 泥土地面跑道（VoxelTrack）：表面 receiveShadow = true，接收角色與障礙物投影
 * 2. 觀眾席階梯看台與體素觀眾（VoxelCrowdBleachers）：3 層階梯與多彩觀眾群
 * 3. 馬戲團大帳篷穹頂（VoxelTent）：藍白相間長條體素拱棚
 */
export class ParallaxStage {
  public readonly group: THREE.Group;
  private trackGroup: THREE.Group;
  private crowdGroup: THREE.Group;
  private tentGroup: THREE.Group;

  private spectators: THREE.Mesh[] = [];
  private crowdTimer: number = 0;
  private trackWidth: number;

  constructor(options?: ParallaxStageOptions) {
    this.group = new THREE.Group();
    this.group.name = 'ParallaxStage';
    this.trackWidth = options?.trackWidth ?? 512;

    this.trackGroup = this.createTrack();
    this.crowdGroup = this.createBleachersAndCrowd();
    this.tentGroup = this.createTentCanopy();

    this.group.add(this.trackGroup);
    this.group.add(this.crowdGroup);
    this.group.add(this.tentGroup);
  }

  /**
   * 建立地面立體跑道
   * Y: 0 ~ 32, Z: [-15, +15]
   */
  private createTrack(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'VoxelTrack';

    // 泥土基底 (Y: 0 ~ 28)
    const dirtSpec: VoxelSpec = {
      x: 128,
      y: 14,
      z: 0,
      w: this.trackWidth,
      h: 28,
      d: 30,
      color: PALETTE.GROUND_BROWN,
    };
    const dirtMesh = createVoxelCube(dirtSpec, { castShadow: false, receiveShadow: true });
    group.add(dirtMesh);

    // 跑道頂層標線與草皮 (Y: 28 ~ 32)
    const surfaceSpec: VoxelSpec = {
      x: 128,
      y: 30,
      z: 0,
      w: this.trackWidth,
      h: 4,
      d: 30,
      color: PALETTE.GROUND_YELLOW,
    };
    const surfaceMesh = createVoxelCube(surfaceSpec, { castShadow: false, receiveShadow: true });
    group.add(surfaceMesh);

    // 邊界草坪護欄裝飾 (Z = -14 與 Z = +14)
    const backRailSpec: VoxelSpec = {
      x: 128,
      y: 33,
      z: -14,
      w: this.trackWidth,
      h: 2,
      d: 2,
      color: PALETTE.GROUND_GREEN,
    };
    group.add(createVoxelCube(backRailSpec, { castShadow: true, receiveShadow: false }));

    return group;
  }

  /**
   * 建立看台觀眾席與立體觀眾群
   * Y: 32 ~ 160, Z: -30
   */
  private createBleachersAndCrowd(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'VoxelCrowdBleachers';

    // 3 層階梯看台
    const bleacherTiers = [
      { y: 44, h: 24, z: -25, color: PALETTE.RAILING_RED },
      { y: 76, h: 40, z: -30, color: PALETTE.RAILING_WHITE },
      { y: 116, h: 40, z: -35, color: PALETTE.RAILING_RED },
    ];

    for (const tier of bleacherTiers) {
      const tierMesh = createVoxelCube(
        {
          x: 128,
          y: tier.y,
          z: tier.z,
          w: this.trackWidth,
          h: tier.h,
          d: 8,
          color: tier.color,
        },
        { castShadow: false, receiveShadow: true }
      );
      group.add(tierMesh);
    }

    // 階梯上陣列排布觀眾群
    const shirtColors = [PALETTE.CROWD_SHIRT_1, PALETTE.CROWD_SHIRT_2, PALETTE.CROWD_SHIRT_3];
    const spectatorRowYs = [58, 98, 138];
    const spectatorRowZs = [-23, -28, -33];

    for (let row = 0; row < 3; row++) {
      const rowY = spectatorRowYs[row];
      const rowZ = spectatorRowZs[row];

      for (let x = 8; x < this.trackWidth; x += 24) {
        // 觀眾身體 (寬 6, 高 8, 深 4)
        const color = shirtColors[(row + Math.floor(x / 24)) % shirtColors.length];
        const bodyMesh = createVoxelCube(
          { x, y: rowY, z: rowZ, w: 6, h: 8, d: 4, color },
          { castShadow: false, receiveShadow: false }
        );
        group.add(bodyMesh);

        // 觀眾頭部 (寬 4, 高 4, 深 4)
        const headMesh = createVoxelCube(
          { x, y: rowY + 6, z: rowZ, w: 4, h: 4, d: 4, color: PALETTE.CROWD_SKIN },
          { castShadow: false, receiveShadow: false }
        );
        group.add(headMesh);
        this.spectators.push(headMesh);
      }
    }

    return group;
  }

  /**
   * 建立馬戲團大帳篷穹頂帷幔
   * Y: 160 ~ 224, Z: -40
   */
  private createTentCanopy(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'VoxelTent';

    // 藍白相間長條拱形頂棚
    const stripeWidth = 16;
    let isBlue = true;

    for (let x = 0; x < this.trackWidth; x += stripeWidth) {
      const color = isBlue ? PALETTE.TENT_BLUE : PALETTE.TENT_WHITE;
      const stripeMesh = createVoxelCube(
        {
          x: x + stripeWidth / 2,
          y: 192,
          z: -40,
          w: stripeWidth,
          h: 64,
          d: 6,
          color,
        },
        { castShadow: false, receiveShadow: false }
      );
      group.add(stripeMesh);
      isBlue = !isBlue;
    }

    // 帳篷下緣金色飾邊垂簾 (Y: 160)
    const rimMesh = createVoxelCube(
      {
        x: 128,
        y: 161,
        z: -38,
        w: this.trackWidth,
        h: 2,
        d: 4,
        color: PALETTE.MONEY_BAG_GOLD,
      },
      { castShadow: false, receiveShadow: false }
    );
    group.add(rimMesh);

    return group;
  }

  /**
   * 更新舞台狀態（包含微幅歡呼跳動與背景捲動偏移）
   */
  public update(dt: number, scrollDistance: number = 0): void {
    // 觀眾歡呼跳動動畫
    this.crowdTimer += dt;
    if (this.crowdTimer > 0.3) {
      this.crowdTimer = 0;
      const bounceOffset = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0;
      for (let i = 0; i < this.spectators.length; i++) {
        if (i % 2 === 0) {
          this.spectators[i].position.y += bounceOffset * 0.2;
        }
      }
    }

    // 若有捲動量，更新跑道與背景相對位移（循環複用）
    if (scrollDistance !== 0) {
      this.trackGroup.position.x = -((scrollDistance * 0.5) % 32);
      this.crowdGroup.position.x = -((scrollDistance * 0.2) % 48);
      this.tentGroup.position.x = -((scrollDistance * 0.1) % 32);
    }
  }

  public getMesh(): THREE.Group {
    return this.group;
  }
}
