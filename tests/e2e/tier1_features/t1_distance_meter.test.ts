import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 1: Feature 6 - 100m 距離倒數與里程碑看板 (Distance & Milestones)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ initialDistance: 100.0, customRingX: 999 });
  });

  it('F6-1: 關卡開始時初始距離為 100.0m', () => {
    expect(harness.getSnapshot().distance).toBe(100.0);
  });

  it('F6-2: 角色前進奔跑時，距離數值平滑遞減', () => {
    harness.pressRight();
    harness.stepFrames(60); // 前進 1 秒
    const snap = harness.getSnapshot();
    expect(snap.distance).toBeLessThan(100.0);
    expect(snap.distance).toBeGreaterThan(95.0);
  });

  it('F6-3: 角色向左後退時，距離不得反向暴增超過關卡初始距離 100.0m', () => {
    harness.pressLeft();
    harness.stepFrames(60);
    const snap = harness.getSnapshot();
    expect(snap.distance).toBeLessThanOrEqual(100.0);
  });

  it('F6-4: 距離跨越 10m 整數倍（如 90m）時觸發里程碑事件與音效', () => {
    harness.distance = 90.05;
    harness.pressRight();
    harness.stepFrames(5);

    const snap = harness.getSnapshot();
    expect(snap.distance).toBeLessThanOrEqual(90.0);
    expect(snap.lastTriggeredMilestone).toBe(90);
    assertSoundTriggered(harness, 'milestone');
  });

  it('F6-5: 抵達終點時距離數值嚴格歸零，不會變為負數', () => {
    harness.distance = 0.05;
    harness.pressRight();
    harness.stepFrames(30);

    const snap = harness.getSnapshot();
    expect(snap.distance).toBe(0.0);
  });
});
