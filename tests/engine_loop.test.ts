import { describe, it, expect, vi } from 'vitest';
import { EngineLoop } from '../src/core/engine_loop';

describe('EngineLoop (60 Hz Fixed Timestep Accumulator Loop)', () => {
  it('1. 初始化常數驗證 (fixedDelta = 1/60s, accumulator = 0)', () => {
    const loop = new EngineLoop(
      () => {},
      () => {}
    );
    expect(loop.fixedDelta).toBeCloseTo(1 / 60, 5);
    expect(loop.getAccumulator()).toBe(0);
    expect(loop.running).toBe(false);
  });

  it('2. step() 手動確定性單步推進物理', () => {
    let updateCalls = 0;
    let accumulatedDt = 0;

    const loop = new EngineLoop(
      (dt) => {
        updateCalls++;
        accumulatedDt += dt;
      },
      () => {}
    );

    // 推進剛好 1 個步長 (1/60s)
    loop.step(1 / 60);
    expect(updateCalls).toBe(1);
    expect(accumulatedDt).toBeCloseTo(1 / 60, 5);
    expect(loop.getAccumulator()).toBeCloseTo(0, 5);

    // 推進不足 1 個步長 (0.01s < 0.01667s)，不應觸發物理更新，時間留存在 accumulator
    loop.step(0.01);
    expect(updateCalls).toBe(1);
    expect(loop.getAccumulator()).toBeCloseTo(0.01, 5);

    // 再推進 0.01s (合計 0.02s > 1/60s)，觸發 1 次物理更新
    loop.step(0.01);
    expect(updateCalls).toBe(2);
    expect(loop.getAccumulator()).toBeCloseTo(0.02 - 1 / 60, 5);
  });

  it('3. step() 支援傳入自定義 update 回呼函式', () => {
    const defaultUpdate = vi.fn();
    const customUpdate = vi.fn();

    const loop = new EngineLoop(defaultUpdate, () => {});
    loop.step(1 / 60, customUpdate);

    expect(defaultUpdate).not.toHaveBeenCalled();
    expect(customUpdate).toHaveBeenCalledTimes(1);
    expect(customUpdate).toHaveBeenCalledWith(loop.fixedDelta);
  });

  it('4. 多幀累積步進（例如 0.05s 觸發 3 次 60 Hz 步進）', () => {
    let steps = 0;
    const loop = new EngineLoop(
      () => {
        steps++;
      },
      () => {}
    );

    // 0.05 / (1/60) = 3 步，餘 0.05 - 0.05 = 0
    loop.step(0.05);
    expect(steps).toBe(3);
    expect(loop.getAccumulator()).toBeCloseTo(0.05 - 3 * (1 / 60), 5);
  });

  it('5. 死亡螺旋防禦上限截斷（maxFrameTime = 0.25s 截斷保護）', () => {
    let steps = 0;
    const loop = new EngineLoop(
      () => {
        steps++;
      },
      () => {}
    );

    // 傳入 1.0 秒（例如切換頁面後切回），應被強制截斷為 0.25 秒
    // 0.25 / (1/60) = 15 步
    loop.step(1.0);
    expect(steps).toBe(15);
    expect(loop.getAccumulator()).toBeCloseTo(0.25 - 15 * (1 / 60), 5);
  });

  it('6. reset() 清除累加器與時間戳記', () => {
    const loop = new EngineLoop(
      () => {},
      () => {}
    );
    loop.step(0.01);
    expect(loop.getAccumulator()).toBeGreaterThan(0);

    loop.reset();
    expect(loop.getAccumulator()).toBe(0);
  });

  it('7. tick() 時間戳推進與渲染插值因子 alpha 計算', () => {
    let updateCalls = 0;
    let renderAlpha = -1;

    const loop = new EngineLoop(
      () => {
        updateCalls++;
      },
      (alpha) => {
        renderAlpha = alpha;
      }
    );

    // 第一次 tick 僅記錄 initial timestamp
    loop.tick(1000);
    expect(updateCalls).toBe(0);
    expect(renderAlpha).toBe(-1);

    // 第二次 tick，間隔 20ms (0.02s) -> 觸發 1 次更新，剩餘 0.02 - 1/60 秒
    loop.tick(1020);
    expect(updateCalls).toBe(1);
    expect(renderAlpha).toBeGreaterThan(0);
    expect(renderAlpha).toBeLessThan(1);
  });
});
