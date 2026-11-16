import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 2: Boundary 1 - 獅子移動極限邊界 (Lion Movement Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('B1-1: 長時間按住右鍵，前進速度嚴格限制在最高 120 px/s 不得無上限暴衝', () => {
    harness.pressRight();
    harness.stepFrames(300); // 5 秒
    expect(harness.getSnapshot().charlie.vx).toBe(120);
  });

  it('B1-2: 長時間按住左鍵，後退速度嚴格下限在 -35 px/s 不得無限負向加速', () => {
    harness.pressLeft();
    harness.stepFrames(300);
    expect(harness.getSnapshot().charlie.vx).toBe(-35);
  });

  it('B1-3: 連續訊框內瞬間由極速前進 (120) 切換為急煞後退 (-35)，無過渡 NaN 或未定義狀態', () => {
    harness.pressRight();
    harness.stepFrames(30);
    expect(harness.getSnapshot().charlie.vx).toBe(120);

    harness.pressLeft();
    harness.step();
    const snap = harness.getSnapshot();
    expect(snap.charlie.vx).toBe(-35);
    expect(Number.isFinite(snap.charlie.vx)).toBe(true);
  });

  it('B1-4: 由高速 120 px/s 瞬間釋放按鍵，下一訊框立即平穩回到基礎巡航 60 px/s', () => {
    harness.pressRight();
    harness.stepFrames(60);
    harness.releaseHorizontal();
    harness.step();
    expect(harness.getSnapshot().charlie.vx).toBe(60);
  });

  it('B1-5: 微步長時間步進 (dt = 0.001) 與大步長 (dt = 0.1) 下，水平運動狀態保持數值收斂', () => {
    harness.pressRight();
    harness.step(0.001);
    expect(harness.getSnapshot().charlie.vx).toBe(120);

    harness.step(0.1);
    expect(harness.getSnapshot().charlie.vx).toBe(120);
    expect(Number.isFinite(harness.getSnapshot().charlie.x)).toBe(true);
  });
});
