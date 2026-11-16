import { InputManager } from '../core/input_manager';

export class TouchControls {
  private inputManager: InputManager;
  private touchLeft: boolean = false;
  private touchRight: boolean = false;
  private touchJump: boolean = false;

  private btnLeft: HTMLElement | null = null;
  private btnRight: HTMLElement | null = null;
  private btnJump: HTMLElement | null = null;

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;
    if (typeof document === 'undefined') return;

    this.btnLeft = document.getElementById('btn-left');
    this.btnRight = document.getElementById('btn-right');
    this.btnJump = document.getElementById('btn-jump');

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.btnLeft || !this.btnRight || !this.btnJump) return;

    // 後退按鈕
    this.setupButton(this.btnLeft, (pressed) => {
      this.touchLeft = pressed;
      this.syncState();
    });

    // 前進加速按鈕
    this.setupButton(this.btnRight, (pressed) => {
      this.touchRight = pressed;
      this.syncState();
    });

    // 跳躍按鈕
    this.setupButton(this.btnJump, (pressed) => {
      this.touchJump = pressed;
      this.syncState();
    });
  }

  private setupButton(el: HTMLElement, onChange: (pressed: boolean) => void): void {
    const handleStart = (e: Event) => {
      e.preventDefault();
      el.classList.add('active');
      onChange(true);
    };

    const handleEnd = (e: Event) => {
      e.preventDefault();
      el.classList.remove('active');
      onChange(false);
    };

    el.addEventListener('pointerdown', handleStart, { passive: false });
    el.addEventListener('pointerup', handleEnd, { passive: false });
    el.addEventListener('pointercancel', handleEnd, { passive: false });
    el.addEventListener('pointerleave', handleEnd, { passive: false });
  }

  private syncState(): void {
    this.inputManager.setTouchState(this.touchLeft, this.touchRight, this.touchJump);
  }
}
