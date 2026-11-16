import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertVoxelHierarchy } from '../harness/assertion_helpers';
import {
  createVoxelCharlie,
  createVoxelLion,
  createVoxelBigRing,
  createVoxelFirePot,
} from '../harness/voxel_models';

describe('Tier 1: Feature 11 - 3D 體素幾何與光影場景 (3D Voxel Models & Lights)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('F11-1: 查理 3D 體素模型包含藍褲、紅衣、膚色臉部與禮帽之有效幾何結構', () => {
    const charlie = createVoxelCharlie();
    assertVoxelHierarchy(charlie, 5);
    expect(charlie.name).toBe('VoxelCharlie');
  });

  it('F11-2: 獅子 3D 體素模型包含橘色軀幹、棕色鬃毛、黃色腹部與四肢', () => {
    const lion = createVoxelLion();
    assertVoxelHierarchy(lion, 8);
    expect(lion.name).toBe('VoxelLion');
  });

  it('F11-3: 大火圈 3D 體素模型拆分為前後 2.5D 深度子群組 (RingBackHalf, RingFrontHalf)', () => {
    const bigRing = createVoxelBigRing();
    expect(bigRing.name).toBe('VoxelBigRing');
    const backHalf = bigRing.getObjectByName('RingBackHalf');
    const frontHalf = bigRing.getObjectByName('RingFrontHalf');
    expect(backHalf).toBeDefined();
    expect(frontHalf).toBeDefined();
  });

  it('F11-4: 地面火壺 3D 體素包含暗紅基座與漸層烈焰，且各網格均開啟 castShadow', () => {
    const pot = createVoxelFirePot();
    assertVoxelHierarchy(pot, 4);
    let shadowCount = 0;
    pot.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).castShadow) {
        shadowCount++;
      }
    });
    expect(shadowCount).toBeGreaterThanOrEqual(4);
  });

  it('F11-5: 3D 體素場景具備環境光 (AmbientLight) 與平行陽光 (DirectionalLight 帶陰影)', () => {
    expect(harness.voxelSunLight).toBeDefined();
    expect(harness.voxelSunLight.isDirectionalLight).toBe(true);
    expect(harness.voxelSunLight.castShadow).toBe(true);
    expect(harness.voxelAmbLight).toBeDefined();
    expect(harness.voxelAmbLight.isAmbientLight).toBe(true);
  });
});
