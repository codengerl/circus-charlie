import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { setupHeadlessEnvironment } from './e2e/harness/mock_canvas_audio';
import { Podium, PODIUM_SURFACE_Y } from '../src/entities/podium';
import { MilestoneBoard } from '../src/entities/milestone_board';
import { VoxelCharacterAnimator } from '../src/entities/voxel_character_animator';
import { LevelTrack } from '../src/entities/level_track';
import { PlayerCharlie } from '../src/entities/player_charlie';
import { createVoxelCharlie, createVoxelLion } from '../src/graphics/voxel_models';

describe('Milestone 3: 系統整合與實體測試 (M3 System Integration & Entities Tests)', () => {
  beforeEach(() => {
    setupHeadlessEnvironment();
  });

  describe('Podium 終點跳台', () => {
    it('POD-1: 跳台初始隱藏，距離 <= 5m 時平滑進入畫面', () => {
      const podium = new Podium();
      expect(podium.getMesh().visible).toBe(false);

      podium.update(10.0);
      expect(podium.getMesh().visible).toBe(false);

      podium.update(4.0);
      expect(podium.getMesh().visible).toBe(true);
      expect(podium.x).toBe(200 - 4.0 * 24);

      podium.update(0.0);
      expect(podium.x).toBe(200);
    });

    it('POD-2: isPlayerOnPodium 正確判定著陸區間', () => {
      const podium = new Podium();
      podium.update(0.0);

      // 完美著陸
      expect(podium.isPlayerOnPodium(200, PODIUM_SURFACE_Y)).toBe(true);

      // 水平過遠
      expect(podium.isPlayerOnPodium(150, PODIUM_SURFACE_Y)).toBe(false);

      // 高度未達
      expect(podium.isPlayerOnPodium(200, 32)).toBe(false);
    });
  });

  describe('MilestoneBoard 里程碑標記看板', () => {
    it('MS-1: 成功生成 10 個體素看板 (100m ~ 10m)', () => {
      const board = new MilestoneBoard();
      const group = board.getMesh();
      expect(group.children.length).toBe(10);
    });

    it('MS-2: update 依據當前距離動態計算螢幕座標並執行視口裁切', () => {
      const board = new MilestoneBoard();

      // 在起點 100m 時，100m 看板可視
      board.update(100.0);
      const m100 = board.getMesh().getObjectByName('VoxelMilestone_100m');
      expect(m100?.visible).toBe(true);
      expect(m100?.position.x).toBe(60);

      // 當跑到 90m 時，100m 看板移出左側，90m 看板位於 60px
      board.update(90.0);
      const m90 = board.getMesh().getObjectByName('VoxelMilestone_90m');
      expect(m90?.visible).toBe(true);
      expect(m90?.position.x).toBe(60);
    });
  });

  describe('VoxelCharacterAnimator 3D 體素角色動畫', () => {
    it('ANIM-1: 支援 run (3 影格)、jump、hit、cheer 四大狀態姿態變化', () => {
      const playerGroup = new THREE.Group();
      const lion = createVoxelLion();
      const charlie = createVoxelCharlie();
      charlie.position.set(0, 10, 0);
      playerGroup.add(lion);
      playerGroup.add(charlie);

      const animator = new VoxelCharacterAnimator(playerGroup);

      // 奔跑 3 影格測試
      expect(() => {
        animator.update(0.1, 'run', 0);
        animator.update(0.1, 'run', 1);
        animator.update(0.1, 'run', 2);
      }).not.toThrow();

      // 跳躍定格測試
      expect(() => {
        animator.update(0.1, 'jump', 0);
      }).not.toThrow();
      const legFl = lion.getObjectByName('leg_fl');
      expect(legFl?.rotation.z).toBeCloseTo(0.5);

      // 受傷後仰測試（禮帽脫落）
      expect(() => {
        animator.update(0.1, 'hit', 0);
      }).not.toThrow();
      const hat = charlie.getObjectByName('charlie_hat');
      expect(hat?.position.x).toBeLessThan(0); // 禮帽脫落後移

      // 歡呼致意測試
      expect(() => {
        animator.update(0.1, 'cheer', 0);
      }).not.toThrow();
      expect(charlie.position.y).toBeGreaterThanOrEqual(13); // 站立於背上
    });
  });

  describe('LevelTrack 關卡難度曲線與物件池調度', () => {
    it('LT-1: 關卡障礙物更新、得分與碰撞判定', () => {
      const scene = new THREE.Scene();
      const levelTrack = new LevelTrack(scene);

      expect(levelTrack.activeBigRing).toBeDefined();
      expect(levelTrack.activeFirePot).toBeDefined();
      expect(levelTrack.activeSmallRing).toBeDefined();
      expect(levelTrack.activeMoneyBag).toBeDefined();

      // 無碰撞更新
      const hitBox = { minX: 40, maxX: 60, minY: 32, maxY: 64 };
      const res = levelTrack.update(0.016, 48, 60, 95.0, hitBox);
      expect(res.hit).toBe(false);

      // 重設至起始狀態
      levelTrack.reset();
      expect(levelTrack.activeBigRing.x).toBe(280);
      expect(levelTrack.activeFirePot.x).toBe(420);
    });
  });

  describe('PlayerCharlie 3 影格奔跑與動畫狀態相容性', () => {
    it('PC-1: setAnimationState 與 3 影格循環正常運作', () => {
      const player = new PlayerCharlie();
      expect(player.getAnimState()).toBe('run');
      expect(player.getAnimFrame()).toBe(0);

      player.setAnimationState('jump');
      expect(player.getAnimState()).toBe('jump');
      expect(player.isJumping).toBe(true);

      player.setAnimationState('cheer');
      expect(player.getAnimState()).toBe('cheer');
      expect(player.isCelebrating).toBe(true);

      player.reset();
      expect(player.getAnimState()).toBe('run');
      expect(player.isCelebrating).toBe(false);
    });
  });
});
