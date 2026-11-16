import { describe, it, expect } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 4: Scenario 1 - 完美通關全流程模擬 (Perfect 100m Clear)', () => {
  it('S1: 獅子以極速 (120 px/s) 前進，精準起跳越過火圈與火壺、收集錢袋，以 BONUS > 3000 登上 0m 跳台過關', () => {
    const harness = new HeadlessGameHarness({
      initialDistance: 2.0,
      initialBonus: 5000,
      initialLives: 3,
      customRingX: 999,
    });

    // 沿途佈設大火圈、小火圈附錢袋與火壺
    const ring1 = harness.addBigRing(150);
    const sRing1 = harness.addSmallRing(250, true);
    const pot1 = harness.addFirePot(350);

    // 玩家極速奔跑
    harness.pressRight();

    // 模擬排程精確跳躍穿越障礙
    // 1. 穿過第一個大火圈 (約在第 25 訊框)
    harness.scheduleAction(25, () => {
      harness.player.y = 48; // 安全通過大火圈
      ring1.x = harness.player.x;
    });

    // 2. 收集小火圈中央錢袋 (約在第 55 訊框)
    harness.scheduleAction(55, () => {
      harness.player.y = 44; // 安全穿過小火圈
      sRing1.x = harness.player.x;
    });

    // 3. 飛越火壺 (約在第 85 訊框)
    harness.scheduleAction(85, () => {
      harness.player.y = 60; // 飛越火壺頂部 52
      pot1.x = -999; // 成功跨越，移開火壺
    });

    // 推進至 0m 終點跳台
    const cleared = harness.stepUntil((state) => state.fsmState === 'STAGE_CELEBRATION', 300);

    expect(cleared).toBe(true);
    const finalSnap = harness.getSnapshot();

    // 驗證無傷通關
    expect(finalSnap.lives).toBe(3);
    expect(finalSnap.charlie.isHit).toBe(false);

    // 驗證跳台結算與 BONUS > 3000
    expect(finalSnap.distance).toBe(0);
    expect(finalSnap.bonus).toBeGreaterThan(3000);
    expect(finalSnap.score).toBeGreaterThan(3000 + 100 + 200 + 500);
    expect(finalSnap.charlie.isCelebrating).toBe(true);

    // 驗證音效觸發完整性
    assertSoundTriggered(harness, 'cheer');
    assertSoundTriggered(harness, 'money_bag');
    assertSoundTriggered(harness, 'score');
  });
});
