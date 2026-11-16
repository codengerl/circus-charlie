import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 2: Boundary 7 - 終點跳台 0m 零距離極值邊界 (Podium Zero Distance)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ initialDistance: 0.05, customRingX: 999 });
  });

  it('B7-1: 距離跨越極微小閥值 (distance ≤ 0.0001) 即刻觸發跳台慶祝機制', () => {
    harness.distance = 0.00005;
    harness.pressRight();
    harness.step();
    expect(harness.distance).toBe(0);
    expect(harness.fsmState).toBe('STAGE_CELEBRATION');
  });

  it('B7-2: 進入跳台慶祝狀態後，所有後續跳躍輸入均被徹底忽略 (Lockout)', () => {
    harness.pressRight();
    harness.stepFrames(10); // 抵達跳台
    expect(harness.fsmState).toBe('STAGE_CELEBRATION');

    harness.triggerJump();
    harness.step();
    expect(harness.getSnapshot().charlie.isJumping).toBe(false);
  });

  it('B7-3: 進入跳台慶祝狀態後，後續方向鍵輸入無法改變查理水平位置', () => {
    harness.pressRight();
    harness.stepFrames(10);
    const posX = harness.player.x;

    harness.pressLeft();
    harness.stepFrames(20);
    expect(harness.player.x).toBe(posX);
  });

  it('B7-4: 登上跳台時若 BONUS 已衰減至 0，加總得分仍維持數值安全不崩潰', () => {
    const zeroBonusHarness = new HeadlessGameHarness({ initialDistance: 0.05, initialBonus: 0, customRingX: 999 });
    zeroBonusHarness.pressRight();
    zeroBonusHarness.stepFrames(10);
    expect(zeroBonusHarness.fsmState).toBe('STAGE_CELEBRATION');
    expect(zeroBonusHarness.score).toBe(0);
  });

  it('B7-5: 登上跳台後連續執行 300 訊框 (5 秒)，慶祝狀態與 0m 標記始終保持鎖定', () => {
    harness.pressRight();
    harness.stepFrames(300);
    const snap = harness.getSnapshot();
    expect(snap.distance).toBe(0);
    expect(snap.fsmState).toBe('STAGE_CELEBRATION');
    expect(snap.charlie.isCelebrating).toBe(true);
  });
});
