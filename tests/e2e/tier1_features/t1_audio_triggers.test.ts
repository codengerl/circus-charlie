import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 1: Feature 9 - Web Audio 8-bit 音效觸發器 (Chiptune Audio Triggers)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    harness = new HeadlessGameHarness({ customRingX: 999 });
  });

  it('F9-1: 跳躍動作觸發 jump 晶片音效', () => {
    harness.triggerJump();
    harness.step();
    assertSoundTriggered(harness, 'jump');
  });

  it('F9-2: 障礙物碰撞觸發 hit 爆音音效', () => {
    harness.addFirePot(60);
    harness.player.x = 60;
    harness.player.y = 32;
    harness.step();
    assertSoundTriggered(harness, 'hit');
  });

  it('F9-3: 成功穿過火圈觸發 score 得分音效', () => {
    harness.addBigRing(80);
    harness.player.x = 110;
    harness.player.y = 48;
    harness.step();
    assertSoundTriggered(harness, 'score');
  });

  it('F9-4: 收集空中錢袋觸發 money_bag 音效', () => {
    harness.addMoneyBag('test_bag', 60, 50);
    harness.player.x = 60;
    harness.player.y = 50;
    harness.step();
    assertSoundTriggered(harness, 'money_bag');
  });

  it('F9-5: 遊戲啟動時記錄 bgm_american_patrol 背景音樂事件', () => {
    const snap = harness.getSnapshot();
    const bgmEvent = snap.audioEvents.find(e => e.name === 'bgm_american_patrol');
    expect(bgmEvent).toBeDefined();
    expect(bgmEvent?.type).toBe('bgm');
  });
});
