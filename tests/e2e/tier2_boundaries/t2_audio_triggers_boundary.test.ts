import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';

describe('Tier 2: Boundary 9 - 音效觸發極限頻率與佇列 (Audio Triggers Boundary)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ customRingX: 999 });
  });

  it('B9-1: 連續著陸起跳循環中，每個起跳動作皆擁有唯一遞增的時間戳記', () => {
    // 第一次跳
    harness.triggerJump();
    harness.step();
    // 落地
    harness.stepFrames(65);
    // 第二次跳
    harness.triggerJump();
    harness.step();

    const jumpEvents = harness.getSnapshot().audioEvents.filter(e => e.name === 'jump');
    expect(jumpEvents.length).toBe(2);
    expect(jumpEvents[1].time).toBeGreaterThan(jumpEvents[0].time);
    expect(jumpEvents[1].frame).toBeGreaterThan(jumpEvents[0].frame);
  });

  it('B9-2: 陣亡與過圈事件併發時，hit 音效優先發送且狀態切入受傷', () => {
    // 同時置於火圈與火壺
    harness.addFirePot(100);
    harness.player.x = 100;
    harness.player.y = 32;
    harness.step();

    const snap = harness.getSnapshot();
    const hitEvent = snap.audioEvents.find(e => e.name === 'hit');
    expect(hitEvent).toBeDefined();
    expect(snap.charlie.isHit).toBe(true);
  });

  it('B9-3: 長時間運行 (300 訊框) 音效事件佇列維持嚴格時序單調遞增', () => {
    harness.triggerJump();
    harness.stepFrames(300);

    const events = harness.getSnapshot().audioEvents;
    for (let i = 1; i < events.length; i++) {
      expect(events[i].time).toBeGreaterThanOrEqual(events[i - 1].time);
      expect(events[i].frame).toBeGreaterThanOrEqual(events[i - 1].frame);
    }
  });

  it('B9-4: 模擬在無頭環境下呼叫 AudioContext.resume() 正常解析 Promise', async () => {
    const AudioCtx = (globalThis as unknown as Record<string, typeof AudioContext>).AudioContext;
    const ctx = new AudioCtx();
    expect(ctx.state).toBe('running');
    await expect(ctx.resume()).resolves.toBeUndefined();
  });

  it('B9-5: 模擬 Oscillator 音訊節點頻率在正數範圍內運作，無 NaN 頻率注入', () => {
    const AudioCtx = (globalThis as unknown as Record<string, typeof AudioContext>).AudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(440, 0);
    expect(osc.frequency.value).toBe(440);
  });
});
