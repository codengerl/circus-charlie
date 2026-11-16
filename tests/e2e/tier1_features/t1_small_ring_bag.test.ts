import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 1: Feature 4 - 小火圈與空中金幣錢袋 (Small Ring & Bag)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    // 初始無大火圈干擾，專注於小火圈
    harness = new HeadlessGameHarness({ customRingX: 999 });
  });

  it('F4-1: 小火圈具備更窄的安全通道 (Y: 44 ~ 76 px，高度 32 px)', () => {
    const sRing = harness.addSmallRing(160, true);
    expect(sRing.safeYMin).toBe(44);
    expect(sRing.safeYMax).toBe(76);
    expect(sRing.safeYMax - sRing.safeYMin).toBe(32);
  });

  it('F4-2: 成功穿過小火圈獲得 200 分', () => {
    const sRing = harness.addSmallRing(90, false);
    harness.player.x = 120;
    harness.player.y = 44; // 安全高度
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.score).toBe(200);
    expect(sRing.passed).toBe(true);
  });

  it('F4-3: 拾取小火圈中央錢袋獲得 500 分並觸發 money_bag 音效', () => {
    harness.addSmallRing(100, true);
    harness.player.x = 100;
    harness.player.y = 46;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.score).toBe(500);
    assertSoundTriggered(harness, 'money_bag');
    const bag = snap.moneyBags.find(b => b.id === 'bag_1');
    expect(bag?.collected).toBe(true);
  });

  it('F4-4: 雖抓取到錢袋但若身體碰觸小火圈火焰，仍判定陣亡', () => {
    const sRing = harness.addSmallRing(100, true);
    harness.player.x = 100;
    harness.player.y = 78; // 高於 safeYMax=76，觸碰頂焰
    harness.step();

    const snap = harness.getSnapshot();
    expect(sRing.checkCollision(harness.player.getHitAABB())).toBe(true);
    expect(snap.charlie.isHit).toBe(true);
    expect(snap.fsmState).toBe('CHARLIE_HIT');
  });

  it('F4-5: 無錢袋之獨立小火圈，穿透後僅增加 200 分無錢袋加成', () => {
    harness.addSmallRing(90, false);
    harness.player.x = 120;
    harness.player.y = 44;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.score).toBe(200);
    expect(snap.audioEvents.some(e => e.name === 'money_bag')).toBe(false);
  });
});
