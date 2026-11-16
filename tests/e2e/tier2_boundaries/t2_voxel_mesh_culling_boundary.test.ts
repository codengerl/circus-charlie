import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import {
  createVoxelCharlie,
  createVoxelLion,
  createVoxelBigRing,
  createVoxelMoneyBag,
} from '../harness/voxel_models';

describe('Tier 2: Boundary 11 - 3D 體素視錐邊界與調色盤極限 (Voxel Geometry Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('B11-1: 體素物件位於攝影機視野遠端 (X > 500) 時，網格與變換矩陣維持數值穩定', () => {
    const farRing = createVoxelBigRing();
    farRing.position.set(1000, 32, 0);
    harness.voxelScene.add(farRing);

    farRing.updateMatrixWorld(true);
    expect(Number.isFinite(farRing.matrixWorld.elements[12])).toBe(true);
  });

  it('B11-2: 體素角色整體包圍盒尺寸受限於合理 3D 空間 (長寬高均不超過 64 單位)', () => {
    const charlie = createVoxelCharlie();
    const box = new THREE.Box3().setFromObject(charlie);
    const size = new THREE.Vector3();
    box.getSize(size);

    expect(size.x).toBeLessThan(64);
    expect(size.y).toBeLessThan(64);
    expect(size.z).toBeLessThan(64);
  });

  it('B11-3: 所有生成之體素網格材質顏色皆為合法 16 進位色彩值且不為黑洞無效值', () => {
    const lion = createVoxelLion();
    lion.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        expect(mat.color.isColor).toBe(true);
        expect(mat.color.getHex()).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(mat.color.getHex())).toBe(true);
      }
    });
  });

  it('B11-4: 定向光源強度限制在 1.2，陰影貼圖解析度為 512x512', () => {
    expect(harness.voxelSunLight.intensity).toBe(1.2);
    expect(harness.voxelSunLight.shadow.mapSize.width).toBe(512);
    expect(harness.voxelSunLight.shadow.mapSize.height).toBe(512);
  });

  it('B11-5: 批量實例化 50 個體素金幣袋模型，各節點 UUID 唯一且獨立互不干擾', () => {
    const bags: THREE.Group[] = [];
    const uuids = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const bag = createVoxelMoneyBag();
      bags.push(bag);
      uuids.add(bag.uuid);
    }
    expect(uuids.size).toBe(50);
  });
});
