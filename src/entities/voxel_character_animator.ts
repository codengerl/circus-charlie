import * as THREE from 'three';

interface NodeTransform {
  pos: THREE.Vector3;
  rot: THREE.Euler;
}

/**
 * 3D 體素角色動畫控制器（VoxelCharacterAnimator）
 * 驅動查理與獅子在 Run (3 影格)、Jump (仰角定格)、Hit (後仰禮帽脫落)、Cheer (站立揮帽) 之動態
 */
export class VoxelCharacterAnimator {
  private playerGroup: THREE.Group;
  private lion: THREE.Object3D | null = null;
  private charlie: THREE.Object3D | null = null;

  // 獅子子節點
  private legFl: THREE.Object3D | null = null;
  private legFr: THREE.Object3D | null = null;
  private legBl: THREE.Object3D | null = null;
  private legBr: THREE.Object3D | null = null;
  private lionMane: THREE.Object3D | null = null;
  private lionTorso: THREE.Object3D | null = null;
  private lionTail: THREE.Object3D | null = null;

  // 查理子節點
  private charlieHat: THREE.Object3D | null = null;
  private charlieBody: THREE.Object3D | null = null;

  // 初始變換紀錄
  private baseTransforms: Map<THREE.Object3D, NodeTransform> = new Map();
  private cheerTimer: number = 0;

  constructor(playerGroup: THREE.Group) {
    this.playerGroup = playerGroup;
    this.initNodes();
  }

  private initNodes(): void {
    this.lion = this.playerGroup.getObjectByName('VoxelLion') || this.playerGroup.children[0] || null;
    this.charlie = this.playerGroup.getObjectByName('VoxelCharlie') || this.playerGroup.children[1] || null;

    if (this.lion) {
      this.legFl = this.lion.getObjectByName('leg_fl') || null;
      this.legFr = this.lion.getObjectByName('leg_fr') || null;
      this.legBl = this.lion.getObjectByName('leg_bl') || null;
      this.legBr = this.lion.getObjectByName('leg_br') || null;
      this.lionMane = this.lion.getObjectByName('lion_mane') || null;
      this.lionTorso = this.lion.getObjectByName('lion_torso') || null;
      this.lionTail = this.lion.getObjectByName('lion_tail') || null;
    }

    if (this.charlie) {
      this.charlieHat = this.charlie.getObjectByName('charlie_hat') || null;
      this.charlieBody = this.charlie.getObjectByName('charlie_body') || null;
    }

    // 儲存基準座標
    const nodes = [
      this.lion,
      this.charlie,
      this.legFl,
      this.legFr,
      this.legBl,
      this.legBr,
      this.lionMane,
      this.lionTorso,
      this.lionTail,
      this.charlieHat,
      this.charlieBody,
    ];

    for (const node of nodes) {
      if (node) {
        this.baseTransforms.set(node, {
          pos: node.position.clone(),
          rot: node.rotation.clone(),
        });
      }
    }
  }

  public resetPose(): void {
    for (const [node, base] of this.baseTransforms.entries()) {
      node.position.copy(base.pos);
      node.rotation.copy(base.rot);
    }
  }

  /**
   * 根據角色當前狀態與影格更新 3D 姿態
   */
  public update(dt: number, state: 'run' | 'jump' | 'hit' | 'cheer', frameIndex: number): void {
    this.resetPose();

    switch (state) {
      case 'run':
        this.animateRun(frameIndex % 3);
        break;
      case 'jump':
        this.animateJump();
        break;
      case 'hit':
        this.animateHit();
        break;
      case 'cheer':
        this.cheerTimer += dt;
        this.animateCheer(this.cheerTimer);
        break;
    }
  }

  private animateRun(frame: number): void {
    if (frame === 0) {
      // 影格 0: 前肢前邁，後肢後蹬
      if (this.legFl) this.legFl.rotation.z = 0.35;
      if (this.legFr) this.legFr.rotation.z = 0.35;
      if (this.legBl) this.legBl.rotation.z = -0.35;
      if (this.legBr) this.legBr.rotation.z = -0.35;
      if (this.charlie) this.charlie.position.y = 10;
    } else if (frame === 1) {
      // 影格 1: 四肢向腹底微縮，軀幹微沉
      if (this.legFl) {
        this.legFl.rotation.z = 0.1;
        this.legFl.position.x -= 1.0;
      }
      if (this.legFr) {
        this.legFr.rotation.z = 0.1;
        this.legFr.position.x -= 1.0;
      }
      if (this.legBl) {
        this.legBl.rotation.z = -0.1;
        this.legBl.position.x += 1.0;
      }
      if (this.legBr) {
        this.legBr.rotation.z = -0.1;
        this.legBr.position.x += 1.0;
      }
      if (this.lionTorso) this.lionTorso.position.y -= 0.5;
      if (this.charlie) this.charlie.position.y = 9.5;
    } else if (frame === 2) {
      // 影格 2: 前肢後蹬，後肢前邁，尾巴翹起
      if (this.legFl) this.legFl.rotation.z = -0.35;
      if (this.legFr) this.legFr.rotation.z = -0.35;
      if (this.legBl) this.legBl.rotation.z = 0.35;
      if (this.legBr) this.legBr.rotation.z = 0.35;
      if (this.lionTail) this.lionTail.rotation.z = 0.4;
      if (this.charlie) {
        this.charlie.position.y = 10;
        this.charlie.rotation.z = -0.08;
      }
    }
  }

  private animateJump(): void {
    // 獅子前肢仰起 15° (+0.5 rad)，後肢向後伸展
    if (this.legFl) {
      this.legFl.rotation.z = 0.5;
      this.legFl.position.y += 1.5;
    }
    if (this.legFr) {
      this.legFr.rotation.z = 0.5;
      this.legFr.position.y += 1.5;
    }
    if (this.legBl) {
      this.legBl.rotation.z = -0.5;
      this.legBl.position.y -= 0.5;
    }
    if (this.legBr) {
      this.legBr.rotation.z = -0.5;
      this.legBr.position.y -= 0.5;
    }
    // 鬃毛後揚
    if (this.lionMane) {
      this.lionMane.position.x -= 1.2;
    }
    // 查理騎手前傾抓緊鬃毛
    if (this.charlie) {
      this.charlie.rotation.z = -0.2;
      this.charlie.position.y = 10.5;
    }
  }

  private animateHit(): void {
    // 獅子四肢攤平
    if (this.legFl) this.legFl.rotation.z = 0.7;
    if (this.legFr) this.legFr.rotation.z = 0.7;
    if (this.legBl) this.legBl.rotation.z = -0.7;
    if (this.legBr) this.legBr.rotation.z = -0.7;

    // 查理禮帽脫落位移
    if (this.charlieHat) {
      this.charlieHat.position.x -= 4;
      this.charlieHat.position.y += 3;
      this.charlieHat.position.z += 1;
      this.charlieHat.rotation.z = 0.45;
    }
    // 查理後仰
    if (this.charlie) {
      this.charlie.rotation.z = 0.35;
      this.charlie.position.x -= 3;
    }
  }

  private animateCheer(timer: number): void {
    // 獅子安坐
    if (this.lionTorso) this.lionTorso.position.y -= 1.5;

    // 查理站立於獅背，高舉禮帽揮手
    if (this.charlie) {
      this.charlie.position.y = 13;
      const wave = Math.sin(timer * 8) * 0.22;
      this.charlie.rotation.z = wave;
    }

    if (this.charlieHat) {
      this.charlieHat.position.y += 3.5;
      this.charlieHat.position.x += 1.5;
      this.charlieHat.rotation.z = 0.3;
    }
  }
}
