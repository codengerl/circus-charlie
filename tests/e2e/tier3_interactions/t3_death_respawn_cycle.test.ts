import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 3: Interaction 4 - 陣亡重生生命週期與狀態機 (Death & Respawn Cycle)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ initialLives: 3, customRingX: 999 });
  });

  it('I4-1: 陣亡扣除生命數 1，遊戲暫停距離推移，但玩家既有得分完整保留', () => {
    harness.score = 500;
    harness.distance = 75.0;
    harness.addFirePot(60);
    harness.player.x = 60;
    harness.player.y = 32;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.lives).toBe(2);
    expect(snap.score).toBe(500);
    expect(snap.fsmState).toBe('CHARLIE_HIT');

    const distanceAtDeath = snap.distance;
    // 受傷狀態下不再推進距離
    harness.stepFrames(30);
    expect(harness.getSnapshot().distance).toBe(distanceAtDeath);
  });

  it('I4-2: 呼叫 respawn() 能清除受傷狀態，重設角色安全位置並允許繼續遊玩', () => {
    harness.addFirePot(60);
    harness.player.x = 60;
    harness.player.y = 32;
    harness.step();
    expect(harness.getSnapshot().charlie.isHit).toBe(true);

    harness.respawn(48, 32);
    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(false);
    expect(snap.fsmState).toBe('PLAYING');
    assertSoundTriggered(harness, 'respawn');
  });

  it('I4-3: 連續陣亡 3 次生命數歸零，狀態機正確轉換至 GAME_OVER', () => {
    for (let death = 1; death <= 3; death++) {
      harness.addFirePot(60 + death * 10);
      harness.player.x = 60 + death * 10;
      harness.player.y = 32;
      harness.step();

      if (death < 3) {
        harness.respawn(48, 32);
      }
    }

    const snap = harness.getSnapshot();
    expect(snap.lives).toBe(0);
    expect(snap.fsmState).toBe('GAME_OVER');
    assertSoundTriggered(harness, 'game_over');
  });

  it('I4-4: 進入 GAME_OVER 狀態後，一切跳躍與奔跑輸入失效，鎖定死亡結尾', () => {
    harness.lives = 0;
    harness.fsmState = 'GAME_OVER';

    harness.pressRight();
    harness.triggerJump();
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.fsmState).toBe('GAME_OVER');
    expect(snap.charlie.isJumping).toBe(false);
  });
});
