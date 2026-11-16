import { expect } from 'vitest';
import * as THREE from 'three';
import { AABB } from '../../../src/entities/player_charlie';

export interface SoundRecorder {
  getSnapshot: () => {
    audioEvents: Array<{ name: string; type: string }>;
  };
}

/**
 * 驗證兩個 AABB 包圍盒是否相交重疊
 */
export function assertAABBOverlap(boxA: AABB, boxB: AABB, expectedOverlap: boolean, label?: string): void {
  const overlapX = boxA.maxX > boxB.minX && boxA.minX < boxB.maxX;
  const overlapY = boxA.maxY > boxB.minY && boxA.minY < boxB.maxY;
  const isOverlap = overlapX && overlapY;
  expect(isOverlap, `${label ?? 'AABB Overlap'} 判定不符預期 (expected: ${expectedOverlap}, actual: ${isOverlap})`).toBe(expectedOverlap);
}

/**
 * 數值物理容差判定
 */
export function assertWithinTolerance(actual: number, expected: number, tolerance: number, label?: string): void {
  const diff = Math.abs(actual - expected);
  expect(diff, `${label ?? 'Value'} 差異 ${diff} 超出容許容差 ${tolerance} (actual: ${actual}, expected: ${expected})`).toBeLessThanOrEqual(tolerance);
}

/**
 * 斷言特定音效觸發次數達到標準
 */
export function assertSoundTriggered(harness: SoundRecorder, soundName: string, minTimes: number = 1): void {
  const snapshot = harness.getSnapshot();
  const count = snapshot.audioEvents.filter(e => e.name === soundName).length;
  expect(count, `音效 "${soundName}" 觸發次數 (${count}) 未達預期下限 (${minTimes})`).toBeGreaterThanOrEqual(minTimes);
}

/**
 * 斷言特定音效未曾觸發
 */
export function assertSoundNotTriggered(harness: SoundRecorder, soundName: string): void {
  const snapshot = harness.getSnapshot();
  const count = snapshot.audioEvents.filter(e => e.name === soundName).length;
  expect(count, `音效 "${soundName}" 不應被觸發，但實際觸發次數為 (${count})`).toBe(0);
}

/**
 * 斷言 3D 體素場景階層與子節點結構健全性
 */
export function assertVoxelHierarchy(root: THREE.Object3D, minChildren: number = 1): void {
  expect(root).toBeDefined();
  expect(root.children.length, `3D 體素階層子節點數 (${root.children.length}) 未達下限 (${minChildren})`).toBeGreaterThanOrEqual(minChildren);

  let hasMesh = false;
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      hasMesh = true;
      const mesh = child as THREE.Mesh;
      expect(mesh.geometry).toBeDefined();
      expect(mesh.material).toBeDefined();
    }
  });
  expect(hasMesh, '3D 體素節點樹中未搜尋到有效 Mesh 網格').toBe(true);
}

/**
 * 斷言 AABB 邊界數值合法性
 */
export function assertAABBValid(box: AABB): void {
  expect(Number.isFinite(box.minX)).toBe(true);
  expect(Number.isFinite(box.maxX)).toBe(true);
  expect(Number.isFinite(box.minY)).toBe(true);
  expect(Number.isFinite(box.maxY)).toBe(true);
  expect(box.maxX).toBeGreaterThanOrEqual(box.minX);
  expect(box.maxY).toBeGreaterThanOrEqual(box.minY);
}
