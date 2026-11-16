export interface InputSnapshot {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpJustPressed: boolean;
  startJustPressed: boolean;
}

/**
 * 統一輸入管理器（Unified Input Manager）
 * 支援鍵盤、虛擬觸控與邊界觸發檢驗，並阻斷瀏覽器預設捲動行為
 */
export class InputManager {
  private keyState: Map<string, boolean> = new Map();
  private prevJump: boolean = false;
  private prevStart: boolean = false;

  // 虛擬觸控狀態
  private touchLeft: boolean = false;
  private touchRight: boolean = false;
  private touchJump: boolean = false;

  private onUserInteractionCallbacks: Array<() => void> = [];
  private hasInteracted: boolean = false;

  constructor() {
    this.setupKeyboardListeners();
    this.setupPointerListeners();
  }

  private setupPointerListeners(): void {
    if (typeof window === 'undefined') return;

    const onPointer = () => {
      this.notifyInteraction();
    };

    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('touchstart', onPointer, { passive: true });
    window.addEventListener('click', onPointer, { passive: true });
  }

  private setupKeyboardListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.notifyInteraction();

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      this.keyState.set(e.code, true);
    }, { passive: false });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keyState.set(e.code, false);
    });

    window.addEventListener('blur', () => {
      this.keyState.clear();
      this.touchLeft = false;
      this.touchRight = false;
      this.touchJump = false;
    });
  }

  public onFirstInteraction(cb: () => void): void {
    if (this.hasInteracted) {
      cb();
    } else {
      this.onUserInteractionCallbacks.push(cb);
    }
  }

  private notifyInteraction(): void {
    if (!this.hasInteracted) {
      this.hasInteracted = true;
      for (const cb of this.onUserInteractionCallbacks) {
        cb();
      }
      this.onUserInteractionCallbacks = [];
    }
  }

  public setTouchState(left: boolean, right: boolean, jump: boolean): void {
    this.notifyInteraction();
    this.touchLeft = left;
    this.touchRight = right;
    this.touchJump = jump;
  }

  public getSnapshot(): InputSnapshot {
    const leftPressed =
      this.keyState.get('ArrowLeft') === true ||
      this.keyState.get('KeyA') === true ||
      this.touchLeft;

    const rightPressed =
      this.keyState.get('ArrowRight') === true ||
      this.keyState.get('KeyD') === true ||
      this.touchRight;

    const jumpPressed =
      this.keyState.get('Space') === true ||
      this.keyState.get('ArrowUp') === true ||
      this.keyState.get('KeyW') === true ||
      this.keyState.get('KeyK') === true ||
      this.keyState.get('KeyZ') === true ||
      this.keyState.get('KeyX') === true ||
      this.touchJump;

    const startPressed =
      this.keyState.get('Enter') === true ||
      this.keyState.get('KeyR') === true;

    const jumpJustPressed = jumpPressed && !this.prevJump;
    const startJustPressed = startPressed && !this.prevStart;

    this.prevJump = jumpPressed;
    this.prevStart = startPressed;

    return {
      left: leftPressed,
      right: rightPressed,
      jump: jumpPressed,
      jumpJustPressed,
      startJustPressed,
    };
  }

  public reset(): void {
    this.keyState.clear();
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.prevJump = false;
    this.prevStart = false;
  }
}
