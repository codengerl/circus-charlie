import { describe, it, expect, vi } from 'vitest';
import { GameFSM } from '../src/core/game_fsm';

describe('GameFSM (Hierarchical Game Flow Finite State Machine)', () => {
  it('1. 初始化預設為 Boot 狀態且計時器為 0', () => {
    const fsm = new GameFSM();
    expect(fsm.getState()).toBe('Boot');
    expect(fsm.getStateTime()).toBe(0);
    expect(fsm.isInState('Boot')).toBe(true);
    expect(fsm.isInState('Title', 'Playing')).toBe(false);
  });

  it('2. 支援指定初始狀態初始化', () => {
    const fsm = new GameFSM('Title');
    expect(fsm.getState()).toBe('Title');
    expect(fsm.isInState('Title')).toBe(true);
  });

  it('3. 合法狀態轉移邊界路徑驗證（完整涵蓋所有 8 大狀態）', () => {
    const fsm = new GameFSM('Boot');

    // Boot -> Title
    expect(fsm.canTransitionTo('Title')).toBe(true);
    expect(fsm.transitionTo('Title')).toBe(true);
    expect(fsm.getState()).toBe('Title');

    // Title -> StageIntro
    expect(fsm.canTransitionTo('StageIntro')).toBe(true);
    expect(fsm.transitionTo('StageIntro')).toBe(true);
    expect(fsm.getState()).toBe('StageIntro');

    // StageIntro -> Playing
    expect(fsm.canTransitionTo('Playing')).toBe(true);
    expect(fsm.transitionTo('Playing')).toBe(true);
    expect(fsm.getState()).toBe('Playing');

    // Playing -> CharlieHit
    expect(fsm.canTransitionTo('CharlieHit')).toBe(true);
    expect(fsm.transitionTo('CharlieHit')).toBe(true);
    expect(fsm.getState()).toBe('CharlieHit');

    // CharlieHit -> RespawnWait
    expect(fsm.canTransitionTo('RespawnWait')).toBe(true);
    expect(fsm.transitionTo('RespawnWait')).toBe(true);
    expect(fsm.getState()).toBe('RespawnWait');

    // RespawnWait -> Playing
    expect(fsm.canTransitionTo('Playing')).toBe(true);
    expect(fsm.transitionTo('Playing')).toBe(true);
    expect(fsm.getState()).toBe('Playing');

    // Playing -> StageCelebration
    expect(fsm.canTransitionTo('StageCelebration')).toBe(true);
    expect(fsm.transitionTo('StageCelebration')).toBe(true);
    expect(fsm.getState()).toBe('StageCelebration');

    // StageCelebration -> StageIntro
    expect(fsm.canTransitionTo('StageIntro')).toBe(true);
    expect(fsm.transitionTo('StageIntro')).toBe(true);
    expect(fsm.getState()).toBe('StageIntro');
  });

  it('4. 陣亡與遊戲結束路徑驗證 (CharlieHit -> GameOver -> Title)', () => {
    const fsm = new GameFSM('Playing');
    expect(fsm.transitionTo('CharlieHit')).toBe(true);
    expect(fsm.canTransitionTo('GameOver')).toBe(true);
    expect(fsm.transitionTo('GameOver')).toBe(true);
    expect(fsm.getState()).toBe('GameOver');

    expect(fsm.canTransitionTo('Title')).toBe(true);
    expect(fsm.transitionTo('Title')).toBe(true);
    expect(fsm.getState()).toBe('Title');
  });

  it('5. 非法狀態轉移防禦性阻斷', () => {
    const fsm = new GameFSM('Boot');

    // Boot 不可直接跳至 Playing 或 GameOver
    expect(fsm.canTransitionTo('Playing')).toBe(false);
    expect(fsm.transitionTo('Playing')).toBe(false);
    expect(fsm.getState()).toBe('Boot');

    expect(fsm.canTransitionTo('GameOver')).toBe(false);
    expect(fsm.transitionTo('GameOver')).toBe(false);
    expect(fsm.getState()).toBe('Boot');

    // 推進到 Title，Title 不可直接跳至 StageCelebration
    fsm.transitionTo('Title');
    expect(fsm.canTransitionTo('StageCelebration')).toBe(false);
    expect(fsm.transitionTo('StageCelebration')).toBe(false);
    expect(fsm.getState()).toBe('Title');
  });

  it('6. 狀態時間更新與躍遷時歸零重置', () => {
    const fsm = new GameFSM('StageIntro');
    fsm.update(0.5);
    expect(fsm.getStateTime()).toBeCloseTo(0.5);

    fsm.update(0.75);
    expect(fsm.getStateTime()).toBeCloseTo(1.25);

    // 轉移至 Playing，stateTimer 必須歸零
    fsm.transitionTo('Playing');
    expect(fsm.getStateTime()).toBe(0);

    fsm.update(0.1);
    expect(fsm.getStateTime()).toBeCloseTo(0.1);
  });

  it('7. 狀態監聽器（Listener）回發與取消訂閱', () => {
    const fsm = new GameFSM('Boot');
    const listener = vi.fn();
    const unsubscribe = fsm.onStateChange(listener);

    fsm.transitionTo('Title', { reason: 'start_screen' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      previousState: 'Boot',
      currentState: 'Title',
      data: { reason: 'start_screen' },
    });

    // 取消訂閱後不再接收事件
    unsubscribe();
    fsm.transitionTo('StageIntro');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('8. reset() 重置至指定狀態與計時器清零', () => {
    const fsm = new GameFSM('Playing');
    fsm.update(10.0);
    expect(fsm.getStateTime()).toBe(10.0);

    fsm.reset('Title');
    expect(fsm.getState()).toBe('Title');
    expect(fsm.getStateTime()).toBe(0);
  });

  it('9. toHarnessState() 大寫相容形式映射檢驗', () => {
    const fsm = new GameFSM('Boot');
    expect(fsm.toHarnessState()).toBe('IDLE');

    fsm.reset('Title');
    expect(fsm.toHarnessState()).toBe('IDLE');

    fsm.reset('StageIntro');
    expect(fsm.toHarnessState()).toBe('IDLE');

    fsm.reset('Playing');
    expect(fsm.toHarnessState()).toBe('PLAYING');

    fsm.reset('CharlieHit');
    expect(fsm.toHarnessState()).toBe('CHARLIE_HIT');

    fsm.reset('RespawnWait');
    expect(fsm.toHarnessState()).toBe('IDLE');

    fsm.reset('StageCelebration');
    expect(fsm.toHarnessState()).toBe('STAGE_CELEBRATION');

    fsm.reset('GameOver');
    expect(fsm.toHarnessState()).toBe('GAME_OVER');
  });
});
