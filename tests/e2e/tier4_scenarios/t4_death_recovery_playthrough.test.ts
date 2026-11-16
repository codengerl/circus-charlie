import { describe, it, expect } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 4: Scenario 3 - 陣亡重生接續通關 (Death & Respawn Recovery)', () => {
  it('S3: 玩家中途不幸觸碰火壺陣亡、生命減 1、音效觸發、安全重生後繼續推進至 0m 成功過關', () => {
    const harness = new HeadlessGameHarness({
      initialDistance: 4.0,
      initialLives: 3,
      customRingX: 999,
    });

    const pot = harness.addFirePot(100);

    // 1. 前進並撞上火壺
    harness.pressRight();
    harness.scheduleAction(20, () => {
      harness.player.x = 100;
      harness.player.y = 32; // 地面觸火
    });
    harness.stepFrames(30);

    const hitSnap = harness.getSnapshot();
    expect(hitSnap.charlie.isHit).toBe(true);
    expect(hitSnap.lives).toBe(2);
    expect(hitSnap.fsmState).toBe('CHARLIE_HIT');
    assertSoundTriggered(harness, 'hit');

    // 2. 玩家重新就地安全重生 (移開該火壺，設定安全起跑座標)
    pot.x = -999;
    harness.respawn(48, 32);
    expect(harness.getSnapshot().fsmState).toBe('PLAYING');
    expect(harness.getSnapshot().charlie.isHit).toBe(false);

    // 3. 重生後繼續前進至 0m 終點跳台
    harness.pressRight();
    const cleared = harness.stepUntil((s) => s.fsmState === 'STAGE_CELEBRATION', 600);
    expect(cleared).toBe(true);

    const finalSnap = harness.getSnapshot();
    expect(finalSnap.lives).toBe(2); // 維持 2 命通關
    expect(finalSnap.distance).toBe(0);
    expect(finalSnap.charlie.isCelebrating).toBe(true);
    assertSoundTriggered(harness, 'cheer');
  });
});
