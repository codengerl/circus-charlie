import { describe, it, expect, beforeEach } from 'vitest';
import { setupHeadlessEnvironment } from './e2e/harness/mock_canvas_audio';
import { HUDOverlay } from '../src/ui/hud_overlay';
import { TouchControls } from '../src/ui/touch_controls';
import { InputManager } from '../src/core/input_manager';

class MockDOMElement {
  public id: string = '';
  public textContent: string = '';
  public innerText: string = '';
  private _innerHTML: string = '';
  public get innerHTML(): string { return this._innerHTML; }
  public set innerHTML(val: string) {
    this._innerHTML = val;
    if (val === '') {
      this.children = [];
      this.childElementCount = 0;
    }
  }
  public style: Record<string, string> = {};
  public children: MockDOMElement[] = [];
  public childElementCount: number = 0;
  public classList = {
    add: () => {},
    remove: () => {},
  };
  private listeners: Map<string, Array<(e: { preventDefault?: () => void }) => void>> = new Map();

  constructor(id: string = '') {
    this.id = id;
  }

  public appendChild(child: MockDOMElement): MockDOMElement {
    this.children.push(child);
    this.childElementCount = this.children.length;
    return child;
  }

  public addEventListener(event: string, cb: (e: { preventDefault?: () => void }) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(cb);
  }

  public removeEventListener(): void {}

  public dispatchEvent(e: { type: string; preventDefault?: () => void }): void {
    const list = this.listeners.get(e.type) || [];
    for (const handler of list) {
      handler(e);
    }
  }
}

describe('Milestone 3: HUD 抬頭顯示器與觸控操作測試 (HUD Overlay & Touch Controls Tests)', () => {
  beforeEach(() => {
    setupHeadlessEnvironment();
  });

  describe('HUDOverlay 抬頭顯示器', () => {
    it('HUD-1: 無 DOM 環境下安全實例化無崩潰', () => {
      expect(() => {
        const hud = new HUDOverlay();
        hud.update(100, 20000, 5000, 3, 100);
      }).not.toThrow();
    });

    it('HUD-2: 在虛擬 DOM 下正確更新分數、歷史最高分、倒數 BONUS 與剩餘生命', () => {
      const registry = new Map<string, MockDOMElement>();
      const scoreElem = new MockDOMElement('score-val');
      const highScoreElem = new MockDOMElement('highscore-val');
      const bonusElem = new MockDOMElement('bonus-val');
      const distanceElem = new MockDOMElement('distance-val');
      const livesIcons = new MockDOMElement('lives-icons');
      const overlay = new MockDOMElement('ui-overlay');

      registry.set('score-val', scoreElem);
      registry.set('highscore-val', highScoreElem);
      registry.set('bonus-val', bonusElem);
      registry.set('distance-val', distanceElem);
      registry.set('lives-icons', livesIcons);
      registry.set('ui-overlay', overlay);

      const doc = (globalThis as unknown as { document: Record<string, unknown> }).document;
      doc.getElementById = (id: string) => registry.get(id) || null;
      doc.createElement = (tag: string) => new MockDOMElement(tag);

      const hud = new HUDOverlay();

      hud.update(2500, 20000, 4800, 3, 94.2);
      expect(scoreElem.textContent).toBe('002500');
      expect(highScoreElem.textContent).toBe('020000');
      expect(bonusElem.textContent).toBe('4800');
      expect(distanceElem.textContent).toBe('95');
      expect(livesIcons.children.length).toBe(3);

      // 當分數超越最高分時，最高分同步更新
      hud.update(25000, 20000, 3500, 2, 50.0);
      expect(scoreElem.textContent).toBe('025000');
      expect(highScoreElem.textContent).toBe('025000');
      expect(livesIcons.children.length).toBe(2);

      // 負數邊界安全保護
      hud.update(0, 0, 0, 0, -5);
      expect(distanceElem.textContent).toBe('0');
      expect(livesIcons.children.length).toBe(0);
    });

    it('HUD-3: setGameState 正確切換各狀態之狀態橫幅文字', () => {
      const registry = new Map<string, MockDOMElement>();
      const overlay = new MockDOMElement('ui-overlay');
      const banner = new MockDOMElement('status-banner');
      registry.set('ui-overlay', overlay);
      registry.set('status-banner', banner);

      const doc = (globalThis as unknown as { document: Record<string, unknown> }).document;
      doc.getElementById = (id: string) => registry.get(id) || null;
      doc.createElement = (tag: string) => new MockDOMElement(tag);

      const hud = new HUDOverlay();

      hud.setGameState('Title');
      expect(banner.textContent).toContain('CIRCUS CHARLIE');

      hud.setGameState('StageIntro');
      expect(banner.textContent).toContain('STAGE 1');

      hud.setGameState('Playing');
      expect(banner.style.display).toBe('none');

      hud.setGameState('CharlieHit');
      expect(banner.textContent).toContain('OUCH!');

      hud.setGameState('RespawnWait');
      expect(banner.textContent).toContain('READY...');

      hud.setGameState('StageCelebration');
      expect(banner.textContent).toContain('VICTORY!');

      hud.setGameState('GameOver');
      expect(banner.textContent).toContain('GAME OVER');
    });
  });

  describe('TouchControls 虛擬觸控控制器', () => {
    it('TC-1: 無 DOM 環境下安全實例化', () => {
      const inputManager = new InputManager();
      expect(() => {
        new TouchControls(inputManager);
      }).not.toThrow();
    });

    it('TC-2: 模擬按鈕 Pointer 事件觸發與 InputManager 狀態同步', () => {
      const registry = new Map<string, MockDOMElement>();
      const btnLeft = new MockDOMElement('btn-left');
      const btnRight = new MockDOMElement('btn-right');
      const btnJump = new MockDOMElement('btn-jump');

      registry.set('btn-left', btnLeft);
      registry.set('btn-right', btnRight);
      registry.set('btn-jump', btnJump);

      const doc = (globalThis as unknown as { document: Record<string, unknown> }).document;
      doc.getElementById = (id: string) => registry.get(id) || null;

      const inputManager = new InputManager();
      new TouchControls(inputManager);

      // 模擬按住右鍵加速
      btnRight.dispatchEvent({ type: 'pointerdown', preventDefault: () => {} });
      let snap = inputManager.getSnapshot();
      expect(snap.right).toBe(true);
      expect(snap.left).toBe(false);

      // 放開右鍵
      btnRight.dispatchEvent({ type: 'pointerup', preventDefault: () => {} });
      snap = inputManager.getSnapshot();
      expect(snap.right).toBe(false);

      // 模擬按住跳躍鍵
      btnJump.dispatchEvent({ type: 'pointerdown', preventDefault: () => {} });
      snap = inputManager.getSnapshot();
      expect(snap.jump).toBe(true);
      expect(snap.jumpJustPressed).toBe(true);

      btnJump.dispatchEvent({ type: 'pointerup', preventDefault: () => {} });
      snap = inputManager.getSnapshot();
      expect(snap.jump).toBe(false);
    });
  });
});
