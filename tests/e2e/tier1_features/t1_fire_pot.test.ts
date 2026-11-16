import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 1: Feature 5 - 地面固定火壺障礙物 (Fire Pot Obstacle)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ customRingX: 999 });
  });

  it('F5-1: 地面火壺固定於地面 Y=32，具備高度 20 px 與寬度 16 px 的包圍盒', () => {
    const pot = harness.addFirePot(150);
    const box = pot.getAABB();
    expect(box.minY).toBe(32);
    expect(box.maxY).toBe(52);
    expect(box.maxX - box.minX).toBe(16);
  });

  it('F5-2: 角色在地面未跳躍走入火壺時，觸發碰撞陣亡', () => {
    harness.addFirePot(60);
    harness.player.x = 60;
    harness.player.y = 32;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(true);
    expect(snap.fsmState).toBe('CHARLIE_HIT');
    assertSoundTriggered(harness, 'hit');
  });

  it('F5-3: 角色起跳越過火壺頂部 (足部 Y > 52) 時判定安全無碰撞', () => {
    const pot = harness.addFirePot(80);
    harness.player.x = 80;
    harness.player.y = 56; // 足部高於 52
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(false);
    expect(pot.checkCollision(harness.player.getHitAABB())).toBe(false);
  });

  it('F5-4: 下降過程中若足部過早下墜觸及火壺 (Y ≤ 52)，判定碰撞陣亡', () => {
    harness.addFirePot(80);
    harness.player.x = 80;
    harness.player.y = 47; // 足部切入 32~52 區間 (minY = 47 + 4 = 51 < 52)
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(true);
  });

  it('F5-5: 觸碰火壺陣亡後生命數減 1', () => {
    harness.addFirePot(60);
    const initialLives = harness.lives;
    harness.player.x = 60;
    harness.player.y = 32;
    harness.step();

    expect(harness.lives).toBe(initialLives - 1);
  });
});
