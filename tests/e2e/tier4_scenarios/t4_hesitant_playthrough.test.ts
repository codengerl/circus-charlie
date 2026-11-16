import { describe, it, expect } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 4: Scenario 2 - 猶豫停滯通關情境模擬 (Hesitant Run with Backtracking)', () => {
  it('S2: 玩家在火壺前向左急煞後退、等待火圈通過後再起跳，BONUS 隨時間消耗但仍成功通關', () => {
    const harness = new HeadlessGameHarness({
      initialDistance: 3.0,
      initialBonus: 5000,
      customRingX: 999,
    });

    const pot = harness.addFirePot(150);

    // 1. 先前進 30 訊框
    harness.pressRight();
    harness.stepFrames(30);

    // 2. 發現前方火壺，急煞向左後退 60 訊框 (猶豫觀望)
    harness.pressLeft();
    harness.stepFrames(60);
    const snapHesitant = harness.getSnapshot();
    expect(snapHesitant.bonus).toBeLessThan(4950); // BONUS 持續扣減
    expect(snapHesitant.charlie.vx).toBe(-35);

    // 3. 調整好時機，全力加速前進並起跳飛越火壺
    harness.pressRight();
    harness.scheduleAction(harness.getSnapshot().frame + 20, () => {
      harness.player.y = 65; // 安全跳過
      pot.x = harness.player.x;
    });

    // 4. 奔向 0m 終點跳台
    const cleared = harness.stepUntil((s) => s.fsmState === 'STAGE_CELEBRATION', 600);
    expect(cleared).toBe(true);

    const finalSnap = harness.getSnapshot();
    expect(finalSnap.distance).toBe(0);
    expect(finalSnap.charlie.isCelebrating).toBe(true);
    expect(finalSnap.lives).toBe(3);
    assertSoundTriggered(harness, 'cheer');
  });
});
