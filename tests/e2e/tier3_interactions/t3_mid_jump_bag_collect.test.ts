import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 3: Interaction 2 - 空中跳躍錢袋收集與穿圈 (Mid-Jump Bag Collect)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ customRingX: 999 });
  });

  it('I2-1: 在拋物線頂點 (Y ≈ 44 px) 同時穿過小火圈並收集錢袋，總得分累加 700 分 (200+500)', () => {
    const sRing = harness.addSmallRing(80, true);
    harness.player.x = 80;
    harness.player.y = 44; // 安全通道 44~76 內
    harness.step(); // 收集錢袋

    // 讓火圈向左移動穿過玩家
    harness.stepFrames(15);

    const snap = harness.getSnapshot();
    expect(snap.score).toBe(700);
    expect(sRing.passed).toBe(true);
    expect(snap.moneyBags[0].collected).toBe(true);
  });

  it('I2-2: 後退減速 (vx = -35) 下起跳抓取迎面而來之小火圈錢袋，精確收集', () => {
    harness.addSmallRing(80, true);
    harness.pressLeft();
    harness.player.x = 80;
    harness.player.y = 44;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.score).toBeGreaterThanOrEqual(500);
    assertSoundTriggered(harness, 'money_bag');
  });

  it('I2-3: 錢袋拾取與火圈過圈連續觸發 money_bag 與 score 兩種獨立音效', () => {
    harness.addSmallRing(80, true);
    harness.player.x = 80;
    harness.player.y = 44;
    harness.stepFrames(15);

    assertSoundTriggered(harness, 'money_bag');
    assertSoundTriggered(harness, 'score');
  });
});
