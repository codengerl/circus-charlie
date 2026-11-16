import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 2: Boundary 8 - BONUS 計時歸零與生命耗盡 (Bonus & GameOver Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ initialBonus: 5, bonusDecayRate: 100, customRingX: 999 });
  });

  it('B8-1: BONUS 數值歸零瞬間觸發 bonus_timeout 逾時陣亡事件', () => {
    harness.stepFrames(10);
    const snap = harness.getSnapshot();
    expect(snap.bonus).toBe(0);
    expect(snap.charlie.isHit).toBe(true);
    assertSoundTriggered(harness, 'hit');
  });

  it('B8-2: BONUS 歸零後持續步進，BONUS 數值絕不下墜為負數 (bonus >= 0)', () => {
    harness.stepFrames(60);
    expect(harness.bonus).toBe(0);
  });

  it('B8-3: 分數累積突破 999,990 時，整數加總維持數值精確無 NaN 或 Infinity', () => {
    harness.score = 999990;
    harness.score += 100;
    harness.step();
    expect(harness.score).toBe(1000090);
    expect(Number.isSafeInteger(harness.score)).toBe(true);
  });

  it('B8-4: 0 生命狀態下，任何重生機制皆被鎖定且狀態維持 GAME_OVER', () => {
    harness.lives = 0;
    harness.fsmState = 'GAME_OVER';
    harness.step();

    harness.triggerJump();
    harness.step();
    expect(harness.fsmState).toBe('GAME_OVER');
    expect(harness.player.isJumping).toBe(false);
  });

  it('B8-5: 生命數減至 0 後再次觸發傷害，生命數不會變成負數 (lives >= 0)', () => {
    harness.lives = 1;
    harness.addFirePot(60);
    harness.player.x = 60;
    harness.player.y = 32;
    harness.step(); // 減為 0

    expect(harness.lives).toBe(0);
    // 再次嘗試傷害
    harness.step();
    expect(harness.lives).toBe(0);
  });
});
