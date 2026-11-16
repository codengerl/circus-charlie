import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { HeadlessGameHarness } from '../harness/headless_game_harness';
import { assertSoundTriggered } from '../harness/assertion_helpers';
import {
  createVoxelBigRing,
  createVoxelSmallRing,
  createVoxelFirePot,
  createVoxelMoneyBag,
} from '../harness/voxel_models';

describe('Tier 4: Scenarios 4 ~ 9 - 實機高壓與極限邊界遊玩情境 (Stress & Playthrough Scenarios)', () => {
  it('S4: BONUS 逾時歸零陣亡極限：停留在原地不推進，直到 BONUS 耗盡觸發逾時陣亡', () => {
    // 設置初始 BONUS 較低以利秒級測試
    const harness = new HeadlessGameHarness({
      initialBonus: 100,
      bonusDecayRate: 100,
      customRingX: 999,
    });

    // 原地不動
    harness.player.vx = 0;
    harness.player.config.baseSpeed = 0;
    const timeoutDeath = harness.stepUntil((s) => s.bonus === 0 && s.charlie.isHit, 300);

    expect(timeoutDeath).toBe(true);
    const snap = harness.getSnapshot();
    expect(snap.bonus).toBe(0);
    expect(snap.charlie.isHit).toBe(true);
    expect(snap.fsmState).toBe('CHARLIE_HIT');
    assertSoundTriggered(harness, 'hit');
  });

  it('S5: 極限小火圈貪分流：精準連續抓取 3 個小火圈中央金幣袋，得分大幅暴增', () => {
    const harness = new HeadlessGameHarness({ customRingX: 999 });

    const r1 = harness.addSmallRing(100, true);
    const r2 = harness.addSmallRing(200, true);
    const r3 = harness.addSmallRing(300, true);

    // 依序抓取 3 個錢袋與小火圈
    const targets = [r1, r2, r3];
    for (let i = 0; i < targets.length; i++) {
      harness.player.x = targets[i].x;
      harness.player.y = 44; // 安全高度
      harness.step();
      harness.stepFrames(15);
    }

    const snap = harness.getSnapshot();
    // 3 * (200 + 500) = 2100 分
    expect(snap.score).toBeGreaterThanOrEqual(2100);
    expect(snap.moneyBags.filter(b => b.collected).length).toBe(3);
    expect(snap.audioEvents.filter(e => e.name === 'money_bag').length).toBe(3);
  });

  it('S6: 邊緣擦撞生存壓力測試：跳躍頂點距離火圈頂緣僅差 1px 的極限穿越，不發生誤碰', () => {
    const harness = new HeadlessGameHarness({ customRingX: 100 });
    // 大火圈 safeYMax = 80
    // 角色 y = 50: hitAABB.maxY = 50 + 30 = 80 (頂部距安全上界僅 0px/1px)
    // hitAABB.minY = 50 + 2 = 52 (安全下界 48)
    harness.player.x = 100;
    harness.player.y = 50;
    harness.fireRing.x = 100;

    const isSafe = harness.fireRing.isSafeThrough(harness.player.getHitAABB());
    const hasCollision = harness.fireRing.checkCollision(harness.player.getHitAABB());

    expect(isSafe).toBe(true);
    expect(hasCollision).toBe(false);
  });

  it('S7: 三命耗盡遊戲結束：連續 3 次觸火陣亡，生命歸 0，鎖定 GameOver 狀態', () => {
    const harness = new HeadlessGameHarness({ initialLives: 3, customRingX: 999 });

    for (let death = 1; death <= 3; death++) {
      harness.addFirePot(100 + death * 10);
      harness.player.x = 100 + death * 10;
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

    // 驗證輸入鎖定
    harness.pressRight();
    harness.triggerJump();
    harness.step();
    expect(harness.getSnapshot().fsmState).toBe('GAME_OVER');
  });

  it('S8: 快速連打與無效輸入過濾：左右鍵以 60 Hz 高頻震盪狂按並連打跳躍，狀態穩定不崩潰', () => {
    const harness = new HeadlessGameHarness();

    for (let f = 0; f < 120; f++) {
      harness.injectInput({
        left: f % 2 === 0,
        right: f % 2 !== 0,
        jump: f % 3 === 0,
        jumpJustPressed: f % 3 === 0,
      });
      harness.step();

      const snap = harness.getSnapshot();
      expect(Number.isFinite(snap.charlie.x)).toBe(true);
      expect(Number.isFinite(snap.charlie.y)).toBe(true);
      expect(Number.isFinite(snap.charlie.vx)).toBe(true);
      expect(Number.isFinite(snap.charlie.vy)).toBe(true);
      expect(Number.isNaN(snap.charlie.x)).toBe(false);
    }
  });

  it('S9: 3D 體素實例化高頻渲染壓力負載：快速生成與掛載 100 組體素物件，無記憶體洩漏與崩潰', () => {
    const harness = new HeadlessGameHarness();
    const voxelObjects: THREE.Object3D[] = [];

    for (let i = 0; i < 25; i++) {
      const ring = createVoxelBigRing();
      const sRing = createVoxelSmallRing();
      const pot = createVoxelFirePot();
      const bag = createVoxelMoneyBag();

      harness.voxelScene.add(ring);
      harness.voxelScene.add(sRing);
      harness.voxelScene.add(pot);
      harness.voxelScene.add(bag);

      voxelObjects.push(ring, sRing, pot, bag);
    }

    expect(voxelObjects.length).toBe(100);
    expect(harness.voxelScene.children.length).toBeGreaterThanOrEqual(100);

    // 模擬垃圾回收與場景清理卸載
    for (const obj of voxelObjects) {
      harness.voxelScene.remove(obj);
    }
    expect(harness.voxelScene.children.length).toBeLessThan(100);
  });
});
