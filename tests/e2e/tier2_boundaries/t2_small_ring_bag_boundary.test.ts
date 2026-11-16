import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 2: Boundary 4 - 小火圈窄窗口與金幣袋邊界 (Small Ring & Bag Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ customRingX: 999 });
  });

  it('B4-1: 角色垂直邊界在小火圈內僅剩 2px 寬裕容錯度時，仍可精確安全通過', () => {
    // 小火圈 safeYMin=44, safeYMax=76. 角色 y=44: minY=46, maxY=74
    // 距下緣差 2px，距上緣差 2px
    const sRing = harness.addSmallRing(100, false);
    harness.player.x = 100;
    harness.player.y = 44;
    expect(sRing.isSafeThrough(harness.player.getHitAABB())).toBe(true);
    expect(sRing.checkCollision(harness.player.getHitAABB())).toBe(false);
  });

  it('B4-2: 錢袋拾取判定箱在邊緣 1px 重疊時成功觸發收集', () => {
    // 錢袋中心 X=100, Y=50, 寬高 12 (X: 94~106, Y: 44~56)
    // 角色 hitAABB maxX = 95 (minX = 75, x = 85)
    const bag = harness.addMoneyBag('corner_bag', 100, 50);
    harness.player.x = 85; // maxX = 85 + 10 = 95 > 94
    harness.player.y = 45; // minY = 49, maxY = 71
    harness.step();

    expect(bag.collected).toBe(true);
    expect(harness.score).toBe(500);
  });

  it('B4-3: 錢袋判定箱在相距 1px 未碰觸時 (maxX = 93 < 94) 不觸發收集', () => {
    const bag = harness.addMoneyBag('miss_bag', 100, 50);
    harness.player.x = 83; // maxX = 83 + 10 = 93 < 94
    harness.player.y = 45;
    harness.step();

    expect(bag.collected).toBe(false);
    expect(harness.score).toBe(0);
  });

  it('B4-4: 同一訊框內既碰到錢袋又觸碰火圈火焰，優先判定陣亡且生命減 1', () => {
    harness.addSmallRing(100, true);
    // 角色 y=78 觸碰頂焰 (maxY = 78 + 30 = 108 > 76)
    harness.player.x = 100;
    harness.player.y = 78;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(true);
    expect(snap.fsmState).toBe('CHARLIE_HIT');
  });

  it('B4-5: 連續多個小火圈獨立擁有錢袋，各自收集狀態獨立不干擾', () => {
    harness.addSmallRing(100, true);
    harness.addSmallRing(250, true);

    // 先收集第一個
    harness.player.x = 100;
    harness.player.y = 46;
    harness.step();

    const snap = harness.getSnapshot();
    const b1 = snap.moneyBags.find(b => b.id === 'bag_1');
    const b2 = snap.moneyBags.find(b => b.id === 'bag_2');
    expect(b1?.collected).toBe(true);
    expect(b2?.collected).toBe(false);
  });
});
