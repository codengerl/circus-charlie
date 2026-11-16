/**
 * 遊戲流程狀態（8 大階層狀態）
 */
export type GameState =
  | 'Boot'
  | 'Title'
  | 'StageIntro'
  | 'Playing'
  | 'CharlieHit'
  | 'RespawnWait'
  | 'StageCelebration'
  | 'GameOver';

export interface StateChangePayload {
  previousState: GameState;
  currentState: GameState;
  data?: unknown;
}

export type StateListener = (payload: StateChangePayload) => void;

/**
 * 階層式遊戲狀態機（Hierarchical Game Flow FSM）
 * 管理狀態生命週期、合法轉移邊界守衛、狀態計時器與事件分發
 */
export class GameFSM {
  private currentState: GameState = 'Boot';
  private stateTimer: number = 0;
  private listeners: StateListener[] = [];

  // 合法狀態轉移邊界矩陣
  private static readonly ALLOWED_TRANSITIONS: Record<GameState, readonly GameState[]> = {
    Boot: ['Title'],
    Title: ['StageIntro'],
    StageIntro: ['Playing'],
    Playing: ['CharlieHit', 'StageCelebration'],
    CharlieHit: ['RespawnWait', 'GameOver'],
    RespawnWait: ['Playing'],
    StageCelebration: ['StageIntro', 'Title'],
    GameOver: ['Title', 'StageIntro'],
  };

  constructor(initialState: GameState = 'Boot') {
    this.currentState = initialState;
  }

  public getState(): GameState {
    return this.currentState;
  }

  public getStateTime(): number {
    return this.stateTimer;
  }

  public isInState(...states: GameState[]): boolean {
    return states.includes(this.currentState);
  }

  public canTransitionTo(target: GameState): boolean {
    const allowed = GameFSM.ALLOWED_TRANSITIONS[this.currentState];
    return allowed ? allowed.includes(target) : false;
  }

  public transitionTo(target: GameState, data?: unknown): boolean {
    if (!this.canTransitionTo(target)) {
      return false;
    }

    const previous = this.currentState;
    this.currentState = target;
    this.stateTimer = 0;

    const payload: StateChangePayload = {
      previousState: previous,
      currentState: target,
      data,
    };

    for (const listener of this.listeners) {
      listener(payload);
    }
    return true;
  }

  public update(dt: number): void {
    this.stateTimer += dt;
  }

  public onStateChange(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  public reset(state: GameState = 'Boot'): void {
    this.currentState = state;
    this.stateTimer = 0;
  }

  /**
   * 相容 HeadlessGameHarness 的大寫字串形式
   */
  public toHarnessState(): 'PLAYING' | 'CHARLIE_HIT' | 'STAGE_CELEBRATION' | 'GAME_OVER' | 'IDLE' {
    switch (this.currentState) {
      case 'Playing':
        return 'PLAYING';
      case 'CharlieHit':
        return 'CHARLIE_HIT';
      case 'StageCelebration':
        return 'STAGE_CELEBRATION';
      case 'GameOver':
        return 'GAME_OVER';
      default:
        return 'IDLE';
    }
  }
}
