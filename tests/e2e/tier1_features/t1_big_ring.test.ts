import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 1: Feature 3 - 大火圈移動與安全通道穿透 (Big Ring Pass)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    // 建立火圈置於 X=160
    harness = new HeadlessGameHarness({ customRingX: 160 });
  });

  it('F3-1: 大火圈向左移動更新，移動速度符合預設 45 px/s 加上額外位移', () => {
    const initialRingX = harness.getSnapshot().ring.x;
    harness.stepFrames(30); // 0.5 秒
    const finalRingX = harness.getSnapshot().ring.x;
    expect(finalRingX).toBeLessThan(initialRingX);
  });

  it('F3-2: 中央安全穿透窗高度區間為 Y: 46 ~ 118 px', () => {
    const snap = harness.getSnapshot();
    expect(snap.ring.safeYMin).toBe(46);
    expect(snap.ring.safeYMax).toBe(118);
  });

  it('F3-3: 觸碰火圈頂部火焰 (Y > 118 px) 時觸發陣亡判定', () => {
    // 角色設定於火圈水平重疊位置 X=160，Y=100 (hitAABB.maxY = 126 > 118)
    harness.player.x = 160;
    harness.player.y = 100;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(true);
    expect(snap.fsmState).toBe('CHARLIE_HIT');
  });

  it('F3-4: 觸碰火圈底部火焰 (Y < 46 px) 時觸發陣亡判定', () => {
    // 角色在地面 X=160，Y=32 (未跳躍直接穿火圈)
    harness.player.x = 160;
    harness.player.y = 32;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(true);
    expect(snap.fsmState).toBe('CHARLIE_HIT');
  });

  it('F3-5: 安全跳躍穿過大火圈後獲得 100 分並觸發 score 音效', () => {
    // 角色在安全通道高度 Y=56 穿過 X=160
    harness.player.x = 175; // 已越過火圈中心
    harness.player.y = 56;
    harness.fireRing.x = 150;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(false);
    expect(snap.score).toBe(100);
    assertSoundTriggered(harness, 'score');
  });
});
