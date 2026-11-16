import { describe, it, expect, beforeEach } from 'vitest';
import { FireRing } from '../src/entities/fire_ring';
import { AABB, PlayerCharlie } from '../src/entities/player_charlie';
import { InputSnapshot } from '../src/core/input_manager';

describe('FireRing 碰撞幾何與安全通道檢驗測試', () => {
  let fireRing: FireRing;

  beforeEach(() => {
    // 預設火圈置於 X = 100，地面 Y = 32，寬 20，高 96
    // 底部火焰高 14 (Y: 32 ~ 46)，頂部火焰高 10 (Y: 118 ~ 128)
    // 安全通道: Y: 46 ~ 118 (淨高 72 px)
    fireRing = new FireRing({
      x: 100,
      groundY: 32,
      width: 20,
      height: 96,
      lowerFlameHeight: 14,
      upperFlameHeight: 10,
    });
  });

  it('幾何邊界與安全穿透窗計算正確', () => {
    const xBounds = fireRing.getXBounds();
    expect(xBounds.minX).toBe(90);
    expect(xBounds.maxX).toBe(110);

    expect(fireRing.safeYMin).toBe(46);
    expect(fireRing.safeYMax).toBe(118);

    const lowerBox = fireRing.getLowerFlameAABB();
    expect(lowerBox.minY).toBe(32);
    expect(lowerBox.maxY).toBe(46);

    const upperBox = fireRing.getUpperFlameAABB();
    expect(upperBox.minY).toBe(118);
    expect(upperBox.maxY).toBe(128);
  });

  it('水平軸尚未接觸時，任何高度皆不應判定為碰撞', () => {
    const outsideAABB: AABB = {
      minX: 20,
      maxX: 50,
      minY: 32,
      maxY: 64,
    };
    expect(fireRing.checkCollision(outsideAABB)).toBe(false);
    expect(fireRing.isSafeThrough(outsideAABB)).toBe(true);
  });

  it('案例 1：角色在地面未跳躍穿過火圈，應觸碰底部火焰判定碰撞 (Dead)', () => {
    // 角色水平置於 X=92~108 (與火圈 90~110 重疊)，Y=32~64
    // 底部 minY=32 小於安全窗下緣 safeYMin=46，且與底部火焰 [32, 46] 相交
    const groundWalkingAABB: AABB = {
      minX: 92,
      maxX: 108,
      minY: 32,
      maxY: 64,
    };
    expect(fireRing.isSafeThrough(groundWalkingAABB)).toBe(false);
    expect(fireRing.checkCollision(groundWalkingAABB)).toBe(true);
  });

  it('案例 2：角色精準跳躍穿過中央安全穿透通道，應判定安全無碰撞 (Safe)', () => {
    // 角色水平置於 X=92~108，垂直置於 Y=50~78
    // 完全落在 safeYMin=46 至 safeYMax=118 之間
    const safeJumpAABB: AABB = {
      minX: 92,
      maxX: 108,
      minY: 50,
      maxY: 78,
    };
    expect(fireRing.isSafeThrough(safeJumpAABB)).toBe(true);
    expect(fireRing.checkCollision(safeJumpAABB)).toBe(false);
  });

  it('案例 3：角色跳躍過高，頭部觸碰火圈上緣烈焰，應判定碰撞 (Dead)', () => {
    // 角色垂直 minY=110，maxY=122 (侵入上緣烈焰 [118, 128])
    const tooHighJumpAABB: AABB = {
      minX: 92,
      maxX: 108,
      minY: 110,
      maxY: 122,
    };
    expect(fireRing.isSafeThrough(tooHighJumpAABB)).toBe(false);
    expect(fireRing.checkCollision(tooHighJumpAABB)).toBe(true);
  });

  it('案例 4：角色完全越過火圈頂部烈焰 (Y > 128)，真實 AABB 判定空中安全無碰撞', () => {
    // 角色水平置於 X=92~108 (水平重疊)，垂直置於 Y=130~150 (高於火圈頂部 128)
    const highAboveAABB: AABB = {
      minX: 92,
      maxX: 108,
      minY: 130,
      maxY: 150,
    };
    expect(fireRing.checkCollision(highAboveAABB)).toBe(false);
  });

  it('案例 5：AABB 邊界剛好接觸時 (maxY = 118 或 minY = 46) 不觸發相交碰撞', () => {
    const touchUpperEdge: AABB = {
      minX: 92,
      maxX: 108,
      minY: 50,
      maxY: 118, // 剛好接觸 upperFlame.minY=118
    };
    expect(fireRing.checkCollision(touchUpperEdge)).toBe(false);

    const touchLowerEdge: AABB = {
      minX: 92,
      maxX: 108,
      minY: 46, // 剛好接觸 lowerFlame.maxY=46
      maxY: 80,
    };
    expect(fireRing.checkCollision(touchLowerEdge)).toBe(false);
  });

  it('火圈向左移動更新時，水平座標與邊界應依速度正確遞減', () => {
    const initialX = fireRing.x;
    const dt = 1.0;
    fireRing.update(dt);
    expect(fireRing.x).toBe(initialX - 45 * dt);
    expect(fireRing.getXBounds().minX).toBe(initialX - 45 * dt - 10);
  });
});

describe('60 Hz 多幀連續動態軌跡穿圈與邊界碰撞測試', () => {
  const dt = 1 / 60;
  const idleInput: InputSnapshot = {
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false,
    startJustPressed: false,
  };

  interface SimulationResult {
    collided: boolean;
    collisionFrame: number;
    hitLower: boolean;
    hitUpper: boolean;
    passedCleanly: boolean;
    overlapFrameCount: number;
    minHitBoxYDuringOverlap: number;
    maxHitBoxYDuringOverlap: number;
  }

  function runDynamicSimulation(
    player: PlayerCharlie,
    ring: FireRing,
    jumpFrame: number | null,
    totalFrames: number = 120
  ): SimulationResult {
    let collided = false;
    let collisionFrame = -1;
    let hitLower = false;
    let hitUpper = false;
    let passedCleanly = false;
    let hadOverlap = false;
    let overlapFrameCount = 0;
    let minHitBoxYDuringOverlap = Infinity;
    let maxHitBoxYDuringOverlap = -Infinity;

    for (let f = 1; f <= totalFrames; f++) {
      const isJump = jumpFrame !== null && f === jumpFrame;
      const input: InputSnapshot = {
        ...idleInput,
        jumpJustPressed: isJump,
        jump: isJump,
      };

      player.update(dt, input);
      ring.update(dt, player.vx * 0.4);

      const hitBox = player.getHitAABB();
      const ringBounds = ring.getXBounds();
      const hasXOverlap = hitBox.maxX > ringBounds.minX && hitBox.minX < ringBounds.maxX;

      if (hasXOverlap) {
        hadOverlap = true;
        overlapFrameCount++;
        minHitBoxYDuringOverlap = Math.min(minHitBoxYDuringOverlap, hitBox.minY);
        maxHitBoxYDuringOverlap = Math.max(maxHitBoxYDuringOverlap, hitBox.maxY);

        if (ring.checkCollision(hitBox)) {
          collided = true;
          collisionFrame = f;

          const lowerAABB = ring.getLowerFlameAABB();
          const upperAABB = ring.getUpperFlameAABB();
          hitLower = FireRing.checkAABBOverlap(hitBox, lowerAABB);
          hitUpper = FireRing.checkAABBOverlap(hitBox, upperAABB);
          break;
        }
      } else if (hadOverlap && !collided && hitBox.minX > ringBounds.maxX) {
        passedCleanly = true;
      }
    }

    return {
      collided,
      collisionFrame,
      hitLower,
      hitUpper,
      passedCleanly,
      overlapFrameCount,
      minHitBoxYDuringOverlap,
      maxHitBoxYDuringOverlap,
    };
  }

  it('動態案例 1：正確時機起跳，角色在 60 Hz 多幀循環中乾淨穿過火圈全生命週期且零碰撞', () => {
    const player = new PlayerCharlie();
    // 預設火圈配置：安全通道 72 px (Y: 46 ~ 118)，頂點 Y=80 (HitBox Y: 84 ~ 106) 完美居中
    const ring = new FireRing({
      x: 120,
      groundY: 32,
      width: 20,
      height: 96,
      lowerFlameHeight: 14,
      upperFlameHeight: 10,
    });

    // 於第 38 幀起跳，拋物線頂點完美與火圈重疊交會
    const res = runDynamicSimulation(player, ring, 38);

    expect(res.collided).toBe(false);
    expect(res.passedCleanly).toBe(true);
    expect(res.overlapFrameCount).toBeGreaterThanOrEqual(30);
    expect(res.minHitBoxYDuringOverlap).toBeGreaterThan(46);
    expect(res.maxHitBoxYDuringOverlap).toBeLessThan(118);
  });

  it('動態案例 2：過早起跳，角色於穿越後半程提早下墜並觸碰底部火焰判定陣亡', () => {
    const player = new PlayerCharlie();
    const ring = new FireRing({
      x: 120,
      groundY: 32,
      width: 20,
      height: 96,
      lowerFlameHeight: 14,
      upperFlameHeight: 10,
    });

    // 於第 25 幀過早起跳，抵達頂點過早，於火圈尚未脫離前已墜落觸碰底焰
    const res = runDynamicSimulation(player, ring, 25);

    expect(res.collided).toBe(true);
    expect(res.hitLower).toBe(true);
    expect(res.hitUpper).toBe(false);
    expect(res.collisionFrame).toBeGreaterThanOrEqual(65);
    expect(res.passedCleanly).toBe(false);
  });

  it('動態案例 3：過晚起跳，火圈前緣逼近時角色尚未升起，進入即觸碰底部火焰判定陣亡', () => {
    const player = new PlayerCharlie();
    const ring = new FireRing({
      x: 120,
      groundY: 32,
      width: 20,
      height: 96,
      lowerFlameHeight: 14,
      upperFlameHeight: 10,
    });

    // 於第 48 幀過晚起跳，火圈於第 46 幀已到達角色水平範圍，角色高度不足直接撞擊
    const res = runDynamicSimulation(player, ring, 48);

    expect(res.collided).toBe(true);
    expect(res.hitLower).toBe(true);
    expect(res.collisionFrame).toBeLessThanOrEqual(47);
    expect(res.passedCleanly).toBe(false);
  });

  it('動態案例 4：高空跳躍飛越矮火圈頂部，角色完全高於頂部火焰，真實 AABB 不得判定碰撞', () => {
    const player = new PlayerCharlie();
    // 配置矮火圈 (總高 48 px，頂部火焰 Y: 70 ~ 80)
    const ring = new FireRing({
      x: 82.5,
      groundY: 32,
      width: 20,
      height: 48,
      lowerFlameHeight: 12,
      upperFlameHeight: 10,
    });

    // 角色於第 1 幀起跳，於第 24 幀抵達頂點 Y=80 (HitBox Y: 84 ~ 106)
    player.jump();
    for (let f = 1; f < 24; f++) {
      player.update(dt, idleInput);
      ring.update(dt, player.vx * 0.4);
    }

    // 檢驗水平重疊
    const hitBoxAtApex = player.getHitAABB();
    const xBounds = ring.getXBounds();
    const hasXOverlap = hitBoxAtApex.maxX > xBounds.minX && hitBoxAtApex.minX < xBounds.maxX;
    expect(hasXOverlap).toBe(true);

    // 角色判定盒下緣為 84，高於火圈最高頂部 80
    expect(hitBoxAtApex.minY).toBeGreaterThanOrEqual(ring.groundY + ring.height);

    // 關鍵驗證：真實相交演算法判定零碰撞 (成功消除捷徑反向誤判)
    expect(ring.checkCollision(hitBoxAtApex)).toBe(false);
  });

  it('動態案例 5：火圈安全窗頂部受限時，角色頭部侵入頂部火焰精確觸發上火焰碰撞', () => {
    const player = new PlayerCharlie();
    // 配置頂部火焰較低之火圈 (頂焰下移至 Y: 100 ~ 128，安全通道上限為 100)
    const ring = new FireRing({
      x: 120,
      groundY: 32,
      width: 20,
      height: 96,
      lowerFlameHeight: 14,
      upperFlameHeight: 28, // safeYMax = 32 + 96 - 28 = 100
    });

    // 於第 38 幀起跳，角色頂點 maxY 達 106，侵入頂部火焰 [100, 128]
    const res = runDynamicSimulation(player, ring, 38);

    expect(res.collided).toBe(true);
    expect(res.hitUpper).toBe(true);
    expect(res.hitLower).toBe(false);
    expect(res.passedCleanly).toBe(false);
  });
});
