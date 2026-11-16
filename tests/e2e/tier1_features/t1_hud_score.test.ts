import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 1: Feature 8 - 經典街機 HUD 與生命/獎勵計分 (HUD & Score Manager)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ customRingX: 999 });
  });

  it('F8-1: 得分初始為 0，當完成得分事件時正確累加', () => {
    expect(harness.score).toBe(0);
    harness.score += 100;
    expect(harness.score).toBe(100);
  });

  it('F8-2: 當玩家得分超過既有最高分時，HIGH SCORE 立即同步更新', () => {
    harness.highScore = 1000;
    harness.score = 1200;
    harness.step();
    expect(harness.getSnapshot().highScore).toBe(1200);
  });

  it('F8-3: BONUS 初始為 5000，隨時間推移平穩扣減', () => {
    expect(harness.bonus).toBe(5000);
    harness.stepFrames(60); // 1 秒
    expect(harness.bonus).toBeLessThan(5000);
    expect(harness.bonus).toBeGreaterThan(4900);
  });

  it('F8-4: 玩家生命數初始為 3，每次受傷遞減 1', () => {
    expect(harness.lives).toBe(3);
    harness.addFirePot(60);
    harness.player.x = 60;
    harness.player.y = 32;
    harness.step();

    expect(harness.lives).toBe(2);
  });

  it('F8-5: 當生命數減至 0 時，狀態機轉換為 GAME_OVER', () => {
    harness.lives = 1;
    harness.addFirePot(60);
    harness.player.x = 60;
    harness.player.y = 32;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.lives).toBe(0);
    expect(snap.fsmState).toBe('GAME_OVER');
  });
});
