import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 2: Boundary 5 - 地面火壺微米級判定邊界 (Fire Pot Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ customRingX: 999 });
  });

  it('B5-1: 角色足部剛好高於火壺頂端 1px (minY = 53 > 52) 安全越過無碰撞', () => {
    // 火壺 Y: 32 ~ 52
    // 角色 y = 49, hitAABB.minY = 49 + 4 = 53
    const pot = harness.addFirePot(100);
    harness.player.x = 100;
    harness.player.y = 49;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(false);
    expect(pot.checkCollision(harness.player.getHitAABB())).toBe(false);
  });

  it('B5-2: 角色足部切入火壺頂端 1px (minY = 51 < 52) 即刻判定碰撞陣亡', () => {
    // 角色 y = 47, hitAABB.minY = 47 + 4 = 51
    harness.addFirePot(100);
    harness.player.x = 100;
    harness.player.y = 47;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(true);
  });

  it('B5-3: 角色向左後退 (vx = -35) 時背向撞入火壺，同樣正確觸發陣亡', () => {
    harness.addFirePot(60);
    harness.player.x = 75;
    harness.player.y = 32;
    harness.pressLeft();
    harness.stepFrames(10); // 後退至 60 處

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(true);
  });

  it('B5-4: 在起跑點附近配置火壺 (X = 40) 時，AABB 計算無越界或異常', () => {
    const pot = harness.addFirePot(40);
    const aabb = pot.getAABB();
    expect(aabb.minX).toBe(32);
    expect(aabb.maxX).toBe(48);
    expect(aabb.minY).toBe(32);
    expect(aabb.maxY).toBe(52);
  });

  it('B5-5: 緊密相鄰之雙火壺 (X=100 與 X=130)，跨越時獨立進行 AABB 判定', () => {
    harness.addFirePot(100);
    harness.addFirePot(130);

    harness.player.x = 100;
    harness.player.y = 60; // 越過第一個
    harness.step();
    expect(harness.getSnapshot().charlie.isHit).toBe(false);

    harness.player.x = 130;
    harness.player.y = 32; // 撞上第二個
    harness.step();
    expect(harness.getSnapshot().charlie.isHit).toBe(true);
  });
});
