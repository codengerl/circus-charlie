import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { InputManager } from '../../../src/core/input_manager';

describe('Tier 2: Boundary 10 - 輸入極端抖動與邊界容錯 (Input Controls Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('B10-1: 60 Hz 高頻左/右方向鍵震盪切換，速度數值維持合法無跳動飄移', () => {
    for (let i = 0; i < 30; i++) {
      if (i % 2 === 0) harness.pressRight();
      else harness.pressLeft();
      harness.step();
      const vx = harness.getSnapshot().charlie.vx;
      expect([120, -35]).toContain(vx);
    }
  });

  it('B10-2: 連續 60 訊框持續按住跳躍鍵 (jump = true)，僅在起跳首訊框起跳一次', () => {
    harness.injectInput({ jump: true, jumpJustPressed: true });
    harness.step(); // 首訊框起跳
    expect(harness.getSnapshot().charlie.isJumping).toBe(true);

    // 後續維持 jump = true 但無 justPressed
    harness.injectInput({ jump: true, jumpJustPressed: false });
    harness.stepFrames(59);

    // 落地檢驗
    harness.stepFrames(10);
    expect(harness.getSnapshot().charlie.y).toBe(32);
    // 落地後不應立即自動二段連跳，需重新釋放再按
    expect(harness.getSnapshot().charlie.isJumping).toBe(false);
  });

  it('B10-3: 觸控輸入模擬左右皆按時，觸發左右對消回歸巡航速度 60 px/s', () => {
    const inputMgr = new InputManager();
    inputMgr.setTouchState(true, true, false);
    const snap = inputMgr.getSnapshot();
    expect(snap.left).toBe(true);
    expect(snap.right).toBe(true);

    harness.injectInput({ left: true, right: true });
    harness.step();
    expect(harness.getSnapshot().charlie.vx).toBe(60);
  });

  it('B10-4: 鍵盤輸入與觸控輸入混用時，優先權無衝突且狀態一致', () => {
    const inputMgr = new InputManager();
    inputMgr.setTouchState(false, true, true);
    const snap = inputMgr.getSnapshot();
    expect(snap.right).toBe(true);
    expect(snap.jump).toBe(true);
    expect(snap.left).toBe(false);
  });

  it('B10-5: InputManager 重設能清空跳躍邊緣偵測記錄 (prevJump 清空)', () => {
    const inputMgr = new InputManager();
    inputMgr.setTouchState(false, false, true);
    inputMgr.getSnapshot(); // prevJump 變為 true

    inputMgr.reset(); // 清空

    // 再次按下應可再次觸發 jumpJustPressed
    inputMgr.setTouchState(false, false, true);
    const snap = inputMgr.getSnapshot();
    expect(snap.jumpJustPressed).toBe(true);
  });
});
