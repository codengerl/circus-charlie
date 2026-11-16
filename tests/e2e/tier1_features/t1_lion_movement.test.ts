import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 1: Feature 1 - 獅子移動與慣性物理 (Lion Movement)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('F1-1: 無按鍵輸入時，地面巡航速度應穩定維持在 60 px/s', () => {
    harness.stepFrames(10);
    const snap = harness.getSnapshot();
    expect(snap.charlie.isGrounded).toBe(true);
    expect(snap.charlie.vx).toBe(60);
    expect(snap.charlie.isJumping).toBe(false);
  });

  it('F1-2: 按住右方向鍵時，水平前進速度應提升至 120 px/s', () => {
    harness.pressRight();
    harness.stepFrames(5);
    const snap = harness.getSnapshot();
    expect(snap.charlie.vx).toBe(120);
  });

  it('F1-3: 按住左方向鍵時，水平速度應轉為後退減速 -35 px/s', () => {
    harness.pressLeft();
    harness.stepFrames(5);
    const snap = harness.getSnapshot();
    expect(snap.charlie.vx).toBe(-35);
  });

  it('F1-4: 釋放方向鍵後，速度應立即回歸基礎巡航速度 60 px/s', () => {
    harness.pressRight();
    harness.stepFrames(10);
    expect(harness.getSnapshot().charlie.vx).toBe(120);

    harness.releaseHorizontal();
    harness.step();
    expect(harness.getSnapshot().charlie.vx).toBe(60);
  });

  it('F1-5: 空中跳躍時維持原起跳之水平速度並持續推移', () => {
    harness.pressRight();
    harness.triggerJump();
    harness.step(); // 起跳

    expect(harness.getSnapshot().charlie.isJumping).toBe(true);
    expect(harness.getSnapshot().charlie.vx).toBe(120);

    // 空中推進 20 訊框
    harness.stepFrames(20);
    const snap = harness.getSnapshot();
    expect(snap.charlie.isJumping).toBe(true);
    expect(snap.charlie.vx).toBe(120);
    expect(snap.charlie.y).toBeGreaterThan(32);
  });
});
