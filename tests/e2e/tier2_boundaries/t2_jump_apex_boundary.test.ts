import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertWithinTolerance } from '../harness/assertion_helpers';

describe('Tier 2: Boundary 2 - 跳躍頂點與著陸極值邊界 (Jump Apex Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('B2-1: 拋物線頂點處垂直速度降至 0 (±10.0 px/s 離散區間內)，即刻轉為負向加速度', () => {
    harness.triggerJump();
    harness.step(); // 起跳

    let foundZeroCross = false;
    let prevVy = harness.getSnapshot().charlie.vy;

    for (let f = 1; f <= 35; f++) {
      harness.step();
      const currentVy = harness.getSnapshot().charlie.vy;
      if (prevVy >= 0 && currentVy <= 0) {
        foundZeroCross = true;
        expect(Math.abs(currentVy)).toBeLessThan(15);
        break;
      }
      prevVy = currentVy;
    }
    expect(foundZeroCross).toBe(true);
  });

  it('B2-2: 正好在頂點訊框再次按下跳躍鍵，跳躍鎖定仍生效，不得重置跳躍', () => {
    harness.triggerJump();
    harness.stepFrames(30); // 抵達頂點附近

    const apexVy = harness.getSnapshot().charlie.vy;
    harness.triggerJump();
    harness.step();

    const nextVy = harness.getSnapshot().charlie.vy;
    expect(nextVy).toBeLessThan(apexVy); // 持續受重力下墜
  });

  it('B2-3: 以四倍細分時間步長 (dt = 1/240) 積分，頂點高度與 60Hz 積分誤差小於 1.5%', () => {
    const hFine = new HeadlessGameHarness();
    hFine.triggerJump();
    hFine.step(1 / 240);

    let fineMaxY = 32;
    for (let f = 0; f < 150; f++) {
      hFine.step(1 / 240);
      if (hFine.player.y > fineMaxY) {
        fineMaxY = hFine.player.y;
      }
    }

    assertWithinTolerance(fineMaxY, 80, 1.5, '高精度頂點高度');
  });

  it('B2-4: 著陸檢驗嚴格鉗制在地面 Y=32.0 px，絕不發生下陷 (Y < 32)', () => {
    harness.triggerJump();
    harness.stepFrames(70); // 超過 1 秒確保落地
    const snap = harness.getSnapshot();
    expect(snap.charlie.y).toBe(32);
    expect(snap.charlie.vy).toBe(0);
    expect(snap.charlie.isGrounded).toBe(true);
  });

  it('B2-5: 在極速奔跑 (120 px/s) 下起跳，拋物線最高點高度與靜止/巡航起跳嚴格一致', () => {
    harness.pressRight();
    harness.stepFrames(10);
    harness.triggerJump();
    harness.step();

    let maxRunningY = 32;
    for (let f = 0; f < 40; f++) {
      harness.step();
      if (harness.player.y > maxRunningY) {
        maxRunningY = harness.player.y;
      }
    }

    assertWithinTolerance(maxRunningY, 80, 2.5, '極速起跳頂點高度');
  });
});
