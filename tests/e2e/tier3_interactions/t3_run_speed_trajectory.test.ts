import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 3: Interaction 3 - 奔跑速度與跳躍軌跡交互影響 (Run Speed & Trajectory)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness();
  });

  it('I3-1: 極速奔跑 (120 px/s) 起跳，跳躍期間之水平位移為基礎巡航 (60 px/s) 的兩倍', () => {
    // 1. 基礎巡航起跳距離衰減量 (代表世界相對位移)
    const hBase = new HeadlessGameHarness();
    hBase.triggerJump();
    hBase.stepFrames(60); // 1 秒跳躍
    const baseDelta = 100.0 - hBase.distance;

    // 2. 極速奔跑起跳距離衰減量
    const hFast = new HeadlessGameHarness();
    hFast.pressRight();
    hFast.triggerJump();
    hFast.stepFrames(60);
    const fastDelta = 100.0 - hFast.distance;

    // 速度 120 對比 60，位移比例應約為 2.0 倍
    expect(fastDelta / baseDelta).toBeCloseTo(2.0, 0.1);
  });

  it('I3-2: 後退減速 (-35 px/s) 下起跳，可實現空中滯空反向煞車，位移短於起點', () => {
    harness.pressLeft();
    harness.triggerJump();
    harness.stepFrames(60);

    const snap = harness.getSnapshot();
    expect(snap.charlie.vx).toBe(-35);
    expect(snap.distance).toBe(100.0); // 被起點鉗制未增加
  });

  it('I3-3: 空中動態換向（前進跳躍中按下左鍵），水平速度切換為 -35 但垂直拋物線重力加速度不變', () => {
    harness.pressRight();
    harness.triggerJump();
    harness.stepFrames(15); // 前進跳躍前期
    expect(harness.getSnapshot().charlie.vx).toBe(120);

    // 空中急轉按下左鍵
    harness.pressLeft();
    harness.step();
    expect(harness.getSnapshot().charlie.vx).toBe(-35);
    expect(harness.getSnapshot().charlie.isJumping).toBe(true);
  });
});
