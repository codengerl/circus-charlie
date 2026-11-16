import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerCharlie } from '../src/entities/player_charlie';
import { InputSnapshot } from '../src/core/input_manager';

describe('PlayerCharlie 物理與運動學單元測試', () => {
  let player: PlayerCharlie;
  const idleInput: InputSnapshot = {
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false,
    startJustPressed: false,
  };

  beforeEach(() => {
    player = new PlayerCharlie();
  });

  it('初始狀態應停留在地面 Y=32，速度為預設巡航速度 60 px/s', () => {
    expect(player.y).toBe(32);
    expect(player.vx).toBe(60);
    expect(player.vy).toBe(0);
    expect(player.isJumping).toBe(false);
    expect(player.isGrounded).toBe(true);
  });

  it('按住右方向鍵時，水平速度應提升至前進加速速度 120 px/s', () => {
    const forwardInput: InputSnapshot = { ...idleInput, right: true };
    player.update(1 / 60, forwardInput);
    expect(player.vx).toBe(120);
  });

  it('按住左方向鍵時，水平速度應降至減速/後退速度 -35 px/s', () => {
    const backwardInput: InputSnapshot = { ...idleInput, left: true };
    player.update(1 / 60, backwardInput);
    expect(player.vx).toBe(-35);
  });

  it('起跳初速度應為 240 px/s，重力加速度為 600 px/s^2', () => {
    expect(player.config.jumpVelocity).toBe(240);
    expect(player.config.gravity).toBe(600);

    const jumpInput: InputSnapshot = { ...idleInput, jumpJustPressed: true };
    player.update(1 / 60, jumpInput);

    expect(player.isJumping).toBe(true);
    expect(player.isGrounded).toBe(false);
    expect(player.vy).toBeCloseTo(240 - 600 * (1 / 60), 1);
  });

  it('禁止二段跳：空中再次觸發 jumpJustPressed 不得重置跳躍速度', () => {
    // 首次起跳
    player.update(1 / 60, { ...idleInput, jumpJustPressed: true });
    const vyAfterFirstFrame = player.vy;
    expect(player.isJumping).toBe(true);

    // 空中嘗試二段跳
    player.update(1 / 60, { ...idleInput, jumpJustPressed: true });
    expect(player.vy).toBeLessThan(vyAfterFirstFrame);
  });

  it('拋物線頂點高度驗證：在 t ≈ 0.4 秒時抵達最高點，位移增加約 48 px (Y ≈ 80)', () => {
    // 起跳
    player.update(1 / 60, { ...idleInput, jumpJustPressed: true });

    const dt = 1 / 60;
    let maxY = player.y;
    let timeToApex = 0;
    let totalTime = dt;

    // 模擬至頂點 (速度降至接近 0)
    for (let frame = 1; frame < 60; frame++) {
      player.update(dt, idleInput);
      totalTime += dt;
      if (player.y > maxY) {
        maxY = player.y;
        timeToApex = totalTime;
      }
      if (player.vy <= 0) {
        break;
      }
    }

    // 理論計算: t = Vy0 / g = 240 / 600 = 0.40 s
    // 理論最高點: H = groundY + Vy0^2 / (2g) = 32 + 240^2 / 1200 = 32 + 48 = 80 px
    expect(timeToApex).toBeCloseTo(0.4, 0.05);
    expect(maxY).toBeGreaterThanOrEqual(79);
    expect(maxY).toBeLessThanOrEqual(81);
  });

  it('滯空時間驗證：在 t ≈ 0.8 秒時落地回到 Y=32，且垂直速度歸零', () => {
    player.update(1 / 60, { ...idleInput, jumpJustPressed: true });

    const dt = 1 / 60;
    let totalTime = dt;

    // 模擬完整拋物線運動直至落地
    while (player.isJumping && totalTime < 2.0) {
      player.update(dt, idleInput);
      totalTime += dt;
    }

    // 理論滯空時間: T = 2 * Vy0 / g = 2 * 240 / 600 = 0.80 s
    expect(totalTime).toBeCloseTo(0.8, 0.05);
    expect(player.y).toBe(32);
    expect(player.vy).toBe(0);
    expect(player.isJumping).toBe(false);
    expect(player.isGrounded).toBe(true);
  });
});
