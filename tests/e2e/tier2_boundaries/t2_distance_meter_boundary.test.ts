import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 2: Boundary 6 - 距離計數邊界與整數防溢 (Distance Meter Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ initialDistance: 100.0, customRingX: 999 });
  });

  it('B6-1: 在 100.0m 起點持續倒退，距離絕不超過起點 100.0m', () => {
    harness.pressLeft();
    harness.stepFrames(120); // 後退 2 秒
    expect(harness.getSnapshot().distance).toBe(100.0);
  });

  it('B6-2: 抵達 0.0m 終點後，持續前進不會出現負數 (distance >= 0.0)', () => {
    harness.distance = 0.01;
    harness.pressRight();
    harness.stepFrames(60);
    expect(harness.getSnapshot().distance).toBe(0.0);
  });

  it('B6-3: 里程碑立柱事件在跨越臨界點時僅觸發一次，不會因浮點震盪重複呼叫', () => {
    harness.distance = 80.05;
    harness.pressRight();
    harness.stepFrames(20);

    const snap = harness.getSnapshot();
    const milestoneCount = snap.audioEvents.filter(e => e.name === 'milestone').length;
    expect(milestoneCount).toBe(1);
    expect(snap.lastTriggeredMilestone).toBe(80);
  });

  it('B6-4: 極大訊框步長 (dt = 0.25s) 快速推進時，距離積分維持數值精確無 NaN', () => {
    harness.pressRight();
    harness.step(0.25);
    const snap = harness.getSnapshot();
    expect(Number.isFinite(snap.distance)).toBe(true);
    expect(snap.distance).toBeLessThan(100.0);
  });

  it('B6-5: 水平速度為 0 時 (原地起跳)，距離數值維持絕對不變 (delta = 0)', () => {
    harness.player.config.baseSpeed = 0;
    harness.player.vx = 0;
    harness.triggerJump();
    const initDist = harness.distance;
    harness.stepFrames(30);
    expect(harness.distance).toBe(initDist);
  });
});
