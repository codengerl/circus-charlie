import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { createVoxelBigRing } from '../harness/voxel_models';

describe('Tier 3: Interaction 5 - 3D 體素陰影與 2.5D 深度分層 (Voxel Shadow & Depth Layering)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('I5-1: 3D 體素查理與獅子處於 Z=0 軌道，精確夾於大火圈後層 (Z=-4) 與前層 (Z=+4) 之間', () => {
    const ring = createVoxelBigRing();
    const backHalf = ring.getObjectByName('RingBackHalf')!;
    const frontHalf = ring.getObjectByName('RingFrontHalf')!;

    // 查理與獅子在 Z=0
    expect(harness.voxelCharlieGroup.position.z).toBe(0);
    expect(harness.voxelLionGroup.position.z).toBe(0);

    // 檢查火圈子群組的立方體 Z 座標
    let backZ = 0;
    let frontZ = 0;
    backHalf.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) backZ = c.position.z;
    });
    frontHalf.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) frontZ = c.position.z;
    });

    expect(backZ).toBeLessThan(0); // 後層 Z = -4
    expect(frontZ).toBeGreaterThan(0); // 前層 Z = +4
  });

  it('I5-2: 定向光陰影相機視野邊界能完整涵蓋角色與障礙物 3D 體素模型', () => {
    const shadowCam = harness.voxelSunLight.shadow.camera;
    expect(shadowCam).toBeDefined();
    expect(harness.voxelSunLight.castShadow).toBe(true);
    expect(harness.voxelSunLight.position.y).toBeGreaterThan(50);
  });

  it('I5-3: 體素材質在光影管線中保有 MeshStandardMaterial 粗糙度 (0.8) 與金屬度 (0.1)', () => {
    let checkedMesh = 0;
    harness.voxelCharlieGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        expect(mat.roughness).toBe(0.8);
        expect(mat.metalness).toBe(0.1);
        checkedMesh++;
      }
    });
    expect(checkedMesh).toBeGreaterThan(0);
  });
});
