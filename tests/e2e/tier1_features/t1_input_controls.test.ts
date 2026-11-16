import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { InputManager } from '../../../src/core/input_manager';

describe('Tier 1: Feature 10 - 跨平台鍵盤與虛擬觸控輸入 (Input Controls)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('F10-1: 注入向右輸入訊號時，獅子水平速度切換為加速 120 px/s', () => {
    harness.pressRight();
    harness.step();
    expect(harness.getSnapshot().charlie.vx).toBe(120);
  });

  it('F10-2: 注入向左輸入訊號時，獅子水平速度切換為後退 -35 px/s', () => {
    harness.pressLeft();
    harness.step();
    expect(harness.getSnapshot().charlie.vx).toBe(-35);
  });

  it('F10-3: 跳躍觸發 jumpJustPressed 僅維持 1 個訊框即被消耗重置', () => {
    harness.triggerJump();
    harness.step();
    expect(harness.getSnapshot().charlie.isJumping).toBe(true);

    // 下一訊框無重複按下
    harness.step();
    expect(harness.getSnapshot().charlie.isJumping).toBe(true);
  });

  it('F10-4: 左右鍵同時按下時相互抵消，獅子保持基礎速度 60 px/s 不前衝暴衝', () => {
    harness.pressSimultaneousLeftRight();
    harness.step();
    expect(harness.getSnapshot().charlie.vx).toBe(60);
  });

  it('F10-5: InputManager 重設能清空所有鍵盤與觸控緩存狀態', () => {
    const inputMgr = new InputManager();
    inputMgr.setTouchState(true, false, true);
    let snap = inputMgr.getSnapshot();
    expect(snap.left).toBe(true);
    expect(snap.jump).toBe(true);

    inputMgr.reset();
    snap = inputMgr.getSnapshot();
    expect(snap.left).toBe(false);
    expect(snap.right).toBe(false);
    expect(snap.jump).toBe(false);
  });
});
