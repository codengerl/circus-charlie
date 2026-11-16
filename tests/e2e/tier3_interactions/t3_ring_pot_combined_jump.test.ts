import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';

describe('Tier 3: Interaction 1 - 火圈與火壺複合障礙跨越 (Ring & Pot Combined Jump)', () => {
  let harness: HeadlessGameHarness;

  beforeEach(() => {
    // 預設火圈置於遠處，手動精確配置複合陣型
    harness = new HeadlessGameHarness({ customRingX: 999 });
  });

  it('I1-1: 火壺配置於火圈後方 (火圈 X=90, 火壺 X=130)，單次跳躍精確貫穿火圈安全窗並飛越火壺', () => {
    const ring = harness.addBigRing(90);
    const pot = harness.addFirePot(130);

    // 角色於 X=90 處高度 Y=48 (安全窗 48~80 內，minY=50, maxY=78)
    harness.player.x = 90;
    harness.player.y = 48;
    harness.step();
    expect(ring.checkCollision(harness.player.getHitAABB())).toBe(false);

    // 飛至 X=130 處高度 Y=56 (高於火壺頂部 52)
    harness.player.x = 130;
    harness.player.y = 56;
    harness.step();
    expect(pot.checkCollision(harness.player.getHitAABB())).toBe(false);

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(false);
  });

  it('I1-2: 成功穿過火圈但在火壺上方過早落地 (Y=47 ≤ 52)，觸火陣亡', () => {
    harness.addBigRing(90);
    harness.addFirePot(130);

    // 穿過火圈安全
    harness.player.x = 90;
    harness.player.y = 50;
    harness.step();
    expect(snapSafe(harness).charlie.isHit).toBe(false);

    // 落地在火壺上
    harness.player.x = 130;
    harness.player.y = 47; // 觸碰火壺頂部 (minY = 47 + 4 = 51 < 52)
    harness.step();
    expect(harness.getSnapshot().charlie.isHit).toBe(true);
    assertSoundTriggered(harness, 'hit');
  });

  it('I1-3: 完美一躍同時穿越火圈並飛越火壺，成功獲取 100 分得分且無碰撞傷害', () => {
    harness.addBigRing(80);
    harness.addFirePot(120);

    // 穿過火圈並越過火壺
    harness.player.x = 140;
    harness.player.y = 60;
    harness.step();

    const snap = harness.getSnapshot();
    expect(snap.charlie.isHit).toBe(false);
    expect(snap.score).toBe(100);
    assertSoundTriggered(harness, 'score');
  });

  function snapSafe(h: HeadlessGameHarness) {
    return h.getSnapshot();
  }
});
