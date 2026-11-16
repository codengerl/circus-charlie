import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 2: Boundary 3 - 大火圈穿透與邊緣微差邊界 (Big Ring Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ customRingX: 100 });
  });

  it('B3-1: 頂部邊緣 1px 超限 (maxY = 119 px) 判定觸碰頂部烈焰陣亡', () => {
    // 角色 AABB maxY = 119 (超出 safeYMax=118)
    // 角色 y = 93, hitAABB.maxY = 93 + 26 = 119
    harness.player.x = 100;
    harness.player.y = 93;
    harness.fireRing.x = 100;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(true);
  });

  it('B3-2: 恰好在頂部安全上限 (maxY = 118 px) 判定安全穿過', () => {
    // 角色 y = 92, hitAABB.maxY = 92 + 26 = 118, minY = 92 + 4 = 96 (>= 46)
    harness.player.x = 100;
    harness.player.y = 92;
    harness.fireRing.x = 100;
    expect(harness.fireRing.isSafeThrough(harness.player.getHitAABB())).toBe(true);
    expect(harness.fireRing.checkCollision(harness.player.getHitAABB())).toBe(false);
  });

  it('B3-3: 底部邊緣 1px 超限 (minY = 45 px) 判定觸碰底部烈焰陣亡', () => {
    // 角色 y = 41, hitAABB.minY = 41 + 4 = 45 (< safeYMin=46)
    harness.player.x = 100;
    harness.player.y = 41;
    harness.fireRing.x = 100;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(true);
  });

  it('B3-4: 恰好在底部安全下限 (minY = 46 px) 判定安全穿過', () => {
    // 角色 y = 42, hitAABB.minY = 42 + 4 = 46, maxY = 42 + 26 = 68 (<= 118)
    harness.player.x = 100;
    harness.player.y = 42;
    harness.fireRing.x = 100;
    expect(harness.fireRing.isSafeThrough(harness.player.getHitAABB())).toBe(true);
    expect(harness.fireRing.checkCollision(harness.player.getHitAABB())).toBe(false);
  });

  it('B3-5: 火圈移出螢幕左側 (x < -30) 後被乾淨重置至右側重生區 (x = 286)', () => {
    harness.fireRing.x = -31;
    harness.step();
    expect(harness.fireRing.x).toBeGreaterThan(200);
    expect(harness.fireRing.passedByPlayer).toBe(false);
  });
});
