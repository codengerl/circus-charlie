import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 1: Feature 7 - 0m 終點跳台與過關結算 (Podium & Victory)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ initialDistance: 0.1, customRingX: 999 });
  });

  it('F7-1: 距離到達 0m 時狀態機自動轉換為 STAGE_CELEBRATION', () => {
    harness.pressRight();
    harness.stepFrames(10);
    const snap = harness.getSnapshot();
    expect(snap.distance).toBe(0);
    expect(snap.fsmState).toBe('STAGE_CELEBRATION');
  });

  it('F7-2: 登上終點跳台後，角色水平奔跑速度自動鎖定歸零 (vx = 0)', () => {
    harness.pressRight();
    harness.stepFrames(10);
    const snap = harness.getSnapshot();
    expect(snap.charlie.vx).toBe(0);
  });

  it('F7-3: 登上終點跳台後，角色進入歡呼慶祝動畫狀態 isCelebrating = true', () => {
    harness.pressRight();
    harness.stepFrames(10);
    const snap = harness.getSnapshot();
    expect(snap.charlie.isCelebrating).toBe(true);
  });

  it('F7-4: 登上跳台時剩餘 BONUS 數值立即結算並完整累加至總得分', () => {
    const currentBonus = harness.bonus;
    const currentScore = harness.score;
    harness.pressRight();
    harness.stepFrames(10);

    const snap = harness.getSnapshot();
    expect(snap.score).toBeGreaterThanOrEqual(currentScore + currentBonus - 10);
  });

  it('F7-5: 登上終點跳台過關觸發歡呼音效 cheer', () => {
    harness.pressRight();
    harness.stepFrames(10);
    assertSoundTriggered(harness, 'cheer');
  });
});
