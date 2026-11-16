import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertWithinTolerance } from '../harness/assertion_helpers';

describe('Tier 1: Feature 2 - 跳躍拋物線與重力積分 (Jump Physics)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('F2-1: 觸發跳躍瞬間，起跳初速度應為 240 px/s 且離地', () => {
    harness.triggerJump();
    harness.step();
    const snap = harness.getSnapshot();
    expect(snap.charlie.isJumping).toBe(true);
    expect(snap.charlie.isGrounded).toBe(false);
    expect(snap.charlie.vy).toBeCloseTo(240 - 600 * (1 / 60), 1);
  });

  it('F2-2: 拋物線頂點在 t ≈ 0.4s 時達成，Y 座標達到最大約 80 px (位移 ≈ 48 px)', () => {
    harness.triggerJump();
    harness.step();

    let maxY = 32;
    let apexFrame = 0;

    for (let f = 1; f <= 35; f++) {
      harness.step();
      const snap = harness.getSnapshot();
      if (snap.charlie.y > maxY) {
        maxY = snap.charlie.y;
        apexFrame = f;
      }
    }

    // 0.4s 在 60Hz 約為 24 訊框
    expect(apexFrame).toBeGreaterThanOrEqual(22);
    expect(apexFrame).toBeLessThanOrEqual(26);
    assertWithinTolerance(maxY, 80, 2.5, '頂點高度');
  });

  it('F2-3: 完整滯空時間約為 0.8s (48 訊框)，精確落回地面 Y=32', () => {
    harness.triggerJump();
    harness.step();

    let framesInAir = 1;
    while (harness.getSnapshot().charlie.isJumping && framesInAir < 80) {
      harness.step();
      framesInAir++;
    }

    expect(framesInAir).toBeGreaterThanOrEqual(46);
    expect(framesInAir).toBeLessThanOrEqual(50);
    const snap = harness.getSnapshot();
    expect(snap.charlie.y).toBe(32);
    expect(snap.charlie.vy).toBe(0);
    expect(snap.charlie.isGrounded).toBe(true);
    expect(snap.charlie.isJumping).toBe(false);
  });

  it('F2-4: 垂直速度受重力 600 px/s^2 嚴格遞減，無突波異常', () => {
    harness.triggerJump();
    harness.step();

    let prevVy = harness.getSnapshot().charlie.vy;
    for (let i = 0; i < 20; i++) {
      harness.step();
      const currentVy = harness.getSnapshot().charlie.vy;
      const vyDiff = prevVy - currentVy;
      expect(vyDiff).toBeCloseTo(600 * (1 / 60), 1);
      prevVy = currentVy;
    }
  });

  it('F2-5: 空中二段跳防護：在滯空中再次按下跳躍鍵，垂直速度不得刷新', () => {
    harness.triggerJump();
    harness.stepFrames(15);
    const vyMidAir = harness.getSnapshot().charlie.vy;

    // 嘗試空中起跳
    harness.triggerJump();
    harness.step();
    const vyAfterSecondJump = harness.getSnapshot().charlie.vy;

    expect(vyAfterSecondJump).toBeLessThan(vyMidAir);
    expect(vyAfterSecondJump).not.toBeCloseTo(240, 10);
  });
});
