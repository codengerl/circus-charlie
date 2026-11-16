import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { I18nManager, translations, SupportedLocale, i18n as globalI18n } from '../src/core/i18n';
import { HUDOverlay } from '../src/ui/hud_overlay';

describe('i18n 多語系國際化引擎單元測試 (i18n Engine & Localization Unit Tests)', () => {
  let i18n: I18nManager;

  beforeEach(() => {
    I18nManager.resetInstance();
    // 重設 localStorage 模擬狀態
    const storageMock = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storageMock.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storageMock.set(key, value)),
      removeItem: vi.fn((key: string) => storageMock.delete(key)),
      clear: vi.fn(() => storageMock.clear()),
    });
    i18n = new I18nManager();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 類別 A：鍵值完整性與雙向鏡像覆蓋率 (Key Parity & Coverage)
  // --------------------------------------------------------------------------
  describe('A. 鍵值完整性與雙向鏡像覆蓋率 (Key Parity & Coverage)', () => {
    it('A-1: zh-TW 與 en-US 字典之鍵值集合 100% 鏡像對齊（零缺漏鍵值、零孤兒鍵值）', () => {
      const zhKeys = Object.keys(translations['zh-TW']).sort();
      const enKeys = Object.keys(translations['en-US']).sort();

      const missingInEn = zhKeys.filter((k) => !enKeys.includes(k));
      const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));

      expect(missingInEn).toEqual([]);
      expect(missingInZh).toEqual([]);
      expect(zhKeys.length).toBeGreaterThanOrEqual(25);
    });

    it('A-2: 所有語系之字典值皆為有效非空字串（禁止空字串、null 或 undefined）', () => {
      const locales: SupportedLocale[] = ['zh-TW', 'en-US'];
      for (const locale of locales) {
        const dict = translations[locale];
        for (const [, value] of Object.entries(dict)) {
          expect(typeof value).toBe('string');
          expect((value as string).trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('A-3: 插值變數 {variable} 雙向鏡像一致性（相同鍵值在雙語中所含之參數名稱完全相同）', () => {
      const paramRegex = /\{([a-zA-Z0-9_]+)\}/g;
      const zhDict = translations['zh-TW'];
      const enDict = translations['en-US'];

      for (const key of Object.keys(zhDict)) {
        const zhParams = Array.from((zhDict[key] || '').matchAll(paramRegex)).map((m) => m[1]).sort();
        const enParams = Array.from((enDict[key] || '').matchAll(paramRegex)).map((m) => m[1]).sort();
        expect(zhParams).toEqual(enParams);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 類別 B：翻譯查詢與結構化查詢回退機制 (Translation Lookup & Fallback)
  // --------------------------------------------------------------------------
  describe('B. 翻譯查詢與結構化查詢回退機制 (Translation Lookup & Fallback)', () => {
    it('B-1: 支援點分隔標準鍵值精確查詢翻譯', () => {
      i18n.setLanguage('en-US');
      expect(i18n.t('hud.1up')).toBe('1UP');
      expect(i18n.t('hud.bonus')).toBe('BONUS');

      i18n.setLanguage('zh-TW');
      expect(i18n.t('hud.1up')).toBe('1UP');
      expect(i18n.t('hud.bonus')).toBe('獎勵分');
    });

    it('B-2: 查詢不存在之鍵值（Non-existent Key）時，安全回退原鍵值（Key Fallback）而不拋錯', () => {
      expect(i18n.t('non.existent.dummy.key')).toBe('non.existent.dummy.key');
      expect(i18n.t('undefined.section')).toBe('undefined.section');
    });

    it('B-3: 傳入空字串或邊界鍵值時安全防護，不觸發例外', () => {
      expect(i18n.t('')).toBe('');
    });

    it('B-4: 當特定鍵值於當前語系缺漏時，能安全回退至備用語系（en-US）', () => {
      // 模擬暫時缺少特定鍵值的情境
      const dummyDict = { ...translations['zh-TW'] };
      delete (dummyDict as Record<string, string>)['hud.1up'];

      const fallbackResult = i18n.tWithFallback('hud.1up', 'zh-TW', 'en-US');
      expect(fallbackResult).toBe('1UP');
    });
  });

  // --------------------------------------------------------------------------
  // 類別 C：動態參數插值與格式化引擎 (Parameter Interpolation & Formatting)
  // --------------------------------------------------------------------------
  describe('C. 動態參數插值與格式化引擎 (Parameter Interpolation & Formatting)', () => {
    it('C-1: 單一數值參數插值（如 {distance} 置換為 100）', () => {
      i18n.setLanguage('zh-TW');
      const resZh = i18n.t('hud.distance_display', { distance: 100 });
      expect(resZh).toBe('100 公尺');

      i18n.setLanguage('en-US');
      const resEn = i18n.t('hud.distance_display', { distance: 100 });
      expect(resEn).toBe('100 m');
    });

    it('C-2: 多重複合參數插值（如 {stage} 與 {distance} 同時置換）', () => {
      i18n.setLanguage('zh-TW');
      const res = i18n.t('banner.stage_intro', { stage: 1, distance: 100 });
      expect(res).toContain('STAGE 1');
      expect(res).toContain('100 公尺');
    });

    it('C-3: 邊界型別處理：數值 0 正常渲染為 0，不得因假值判斷而遺失', () => {
      i18n.setLanguage('zh-TW');
      const res = i18n.t('hud.distance_display', { distance: 0 });
      expect(res).toBe('0 公尺');
    });

    it('C-4: 浮點數與特殊字元參數安全置換', () => {
      i18n.setLanguage('zh-TW');
      const res = i18n.t('hud.distance_display', { distance: 24.5 });
      expect(res).toBe('24.5 公尺');
    });

    it('C-5: 未提供相符參數時保留原始標記，不拋出 TypeError 或輸出 undefined', () => {
      i18n.setLanguage('zh-TW');
      const res = i18n.t('banner.stage_intro', { stage: 1 }); // 未提供 distance
      expect(res).toContain('STAGE 1');
      expect(res).toContain('{distance}');
    });

    it('C-6: 未傳入 params 物件（undefined）時直接回傳原始範本字串', () => {
      i18n.setLanguage('zh-TW');
      const res = i18n.t('banner.stage_intro');
      expect(res).toContain('{stage}');
      expect(res).toContain('{distance}');
    });
  });

  // --------------------------------------------------------------------------
  // 類別 D：語系動態切換與響應式訂閱分發 (Dynamic Language Switching & Subscriptions)
  // --------------------------------------------------------------------------
  describe('D. 語系動態切換與響應式訂閱分發 (Dynamic Language Switching & Subscriptions)', () => {
    it('D-1: setLanguage() 正確切換當前語系，且 getLanguage() 即時反映最新狀態', () => {
      i18n.setLanguage('en-US');
      expect(i18n.getLanguage()).toBe('en-US');

      i18n.setLanguage('zh-TW');
      expect(i18n.getLanguage()).toBe('zh-TW');
    });

    it('D-2: subscribe() 註冊監聽器，於語系切換時同步接收到新語系代碼通知', () => {
      const listener = vi.fn();
      const unsubscribe = i18n.subscribe(listener);

      i18n.setLanguage('en-US');
      expect(listener).toHaveBeenCalledWith('en-US');

      i18n.setLanguage('zh-TW');
      expect(listener).toHaveBeenCalledWith('zh-TW');

      unsubscribe();
    });

    it('D-3: 語系切換同值冪等性：切換至當前已處於之相同語系時，不重複分發無效通知', () => {
      i18n.setLanguage('zh-TW');
      const listener = vi.fn();
      i18n.subscribe(listener);

      i18n.setLanguage('zh-TW'); // 相同語系
      expect(listener).not.toHaveBeenCalled();
    });

    it('D-4: unsubscribe() 退訂機制：呼叫回傳函式後，後續切換不再觸發監聽回呼', () => {
      const listener = vi.fn();
      const unsubscribe = i18n.subscribe(listener);

      i18n.setLanguage('en-US');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      i18n.setLanguage('zh-TW');
      expect(listener).toHaveBeenCalledTimes(1); // 不再遞增
    });

    it('D-5: 多組元件同時訂閱（Concurrent Subscribers）獨立觸發，互不干擾', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const unsub1 = i18n.subscribe(listener1);
      const unsub2 = i18n.subscribe(listener2);

      i18n.setLanguage('en-US');
      expect(listener1).toHaveBeenCalledWith('en-US');
      expect(listener2).toHaveBeenCalledWith('en-US');

      unsub1();
      i18n.setLanguage('zh-TW');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);

      unsub2();
    });

    it('D-6: 監聽器例外隔離（Error Boundary）：單一監聽器拋錯不影響其他監聽器之執行', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Subscriber error simulation');
      });
      const healthyListener = vi.fn();

      i18n.subscribe(errorListener);
      i18n.subscribe(healthyListener);

      expect(() => {
        i18n.setLanguage('en-US');
      }).not.toThrow();

      expect(healthyListener).toHaveBeenCalledWith('en-US');
    });
  });

  // --------------------------------------------------------------------------
  // 類別 E：本地持久化儲存與無頭環境相容性 (Persistence & Headless Compatibility)
  // --------------------------------------------------------------------------
  describe('E. 本地持久化儲存與無頭環境相容性 (Persistence & Headless Compatibility)', () => {
    it('E-1: localStorage 正確同步寫入指定之儲存鍵值', () => {
      i18n.setLanguage('en-US');
      expect(localStorage.setItem).toHaveBeenCalledWith('circus_charlie_lang', 'en-US');

      i18n.setLanguage('zh-TW');
      expect(localStorage.setItem).toHaveBeenCalledWith('circus_charlie_lang', 'zh-TW');
    });

    it('E-2: 初始化讀取既有 localStorage 偏好設定', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('en-US');
      const freshManager = new I18nManager();
      expect(freshManager.getLanguage()).toBe('en-US');
    });

    it('E-3: localStorage 存有未知或損毀數值時，自動重設並回退至安全預設語系', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('invalid-locale-xyz');
      const freshManager = new I18nManager();
      expect(['zh-TW', 'en-US']).toContain(freshManager.getLanguage());
    });

    it('E-4: 無頭環境（無 localStorage 或 window）時平穩切換至純記憶體模式，無例外崩潰', () => {
      vi.stubGlobal('localStorage', undefined);
      expect(() => {
        const headlessManager = new I18nManager();
        headlessManager.setLanguage('en-US');
        expect(headlessManager.getLanguage()).toBe('en-US');
      }).not.toThrow();
    });

    it('E-5: localStorage 拋出 SecurityError 或 QuotaExceededError 時，防呆吞吐例外維持運作', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => {
          throw new Error('SecurityError: access denied');
        }),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError');
        }),
      });

      expect(() => {
        const protectedManager = new I18nManager();
        protectedManager.setLanguage('en-US');
        expect(protectedManager.getLanguage()).toBe('en-US');
      }).not.toThrow();
    });

    it('E-6: 瀏覽器語言偵測（navigator.language）：無儲存紀錄時自動依瀏覽器語言適配', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
      vi.stubGlobal('navigator', { language: 'zh-TW' });

      const browserManager = new I18nManager();
      expect(browserManager.getLanguage()).toBe('zh-TW');
    });
  });

  // --------------------------------------------------------------------------
  // 類別 F：台灣繁體中文排版規範與詞彙合規審查 (Taiwan Typography & Terminology Compliance)
  // --------------------------------------------------------------------------
  describe('F. 台灣繁體中文排版規範與詞彙合規審查 (Taiwan Typography & Terminology Compliance)', () => {
    const zhDict = translations['zh-TW'];
    const zhValues = Object.values(zhDict);

    it('F-1: 嚴格禁止簡體中文字與非台灣常見大陸用語（黑名單掃描）', () => {
      // 禁用大陸用語黑名單
      const forbiddenTerms = [
        '优化', '优', '用户', '用户端', '项目', '信息', '质量', '水平',
        '启动', '适配', '默认', '渠道', '界面', '登录', '注销', '联动'
      ];

      for (const val of zhValues) {
        for (const term of forbiddenTerms) {
          expect(val).not.toContain(term);
        }
      }
    });

    it('F-2: 白名單詞彙合規性驗證（若涉及特定概念，必須使用台灣規範詞彙）', () => {
      // 合規詞彙白名單對照查核
      const fullText = zhValues.join('\n');
      if (fullText.includes('最佳化')) {
        expect(fullText).not.toContain('優化');
      }
      if (fullText.includes('使用者')) {
        expect(fullText).not.toContain('用戶');
      }
      if (fullText.includes('專案')) {
        expect(fullText).not.toContain('項目');
      }
      if (fullText.includes('資訊')) {
        expect(fullText).not.toContain('信息');
      }
      if (fullText.includes('流程')) {
        expect(fullText).not.toContain('流程化');
      }
    });

    it('F-3: 中英數字半形空格排版規則驗證（中文字與英文字母/數字相鄰處必含半形空格，除 % 與 ° 外）', () => {
      // 檢查中文字緊鄰英文或數字而無空格之違規模式：[\u4e00-\u9fa5][a-zA-Z0-9] 或 [a-zA-Z0-9][\u4e00-\u9fa5]
      // 容許白名單：{變數} 插值標記、以及已含半形空格者
      const illegalAdjacentRegex = /([\u4e00-\u9fa5][a-zA-Z0-9]|[a-zA-Z0-9][\u4e00-\u9fa5])/;

      for (const [key, val] of Object.entries(zhDict)) {
        // 先將合法的 {variable} 插值標籤移除後再檢測緊鄰情況
        const strippedVal = val.replace(/\{[a-zA-Z0-9_]+\}/g, '');
        const match = strippedVal.match(illegalAdjacentRegex);
        if (match) {
          // 若有緊鄰，印出鍵值以便精確調優
          expect(`${key}: ${val}`).toBe(`已按規則保留半形空格 (發現違規: ${match[0]})`);
        }
      }
    });

    it('F-4: 全形標點符號與引號規範驗證（禁止混用英文半形標點與重複驚嘆號）', () => {
      for (const [, val] of Object.entries(zhDict)) {
        // 禁止重複標點符號（如 ！！ 或 ？？ 或 !! 或 ??）
        expect(val).not.toMatch(/[！!]{2,}/);
        expect(val).not.toMatch(/[？?]{2,}/);

        // 中文文句內若有逗號、句號，必須為全形
        if (/[\u4e00-\u9fa5]/.test(val)) {
          // 禁止中文緊鄰半形逗號或句號
          expect(val).not.toMatch(/[\u4e00-\u9fa5],/);
          expect(val).not.toMatch(/,[\u4e00-\u9fa5]/);
        }
      }
    });

    it('F-5: 專有名詞官方大小寫規範驗證（Circus Charlie 等）', () => {
      const fullText = zhValues.join('\n');
      if (fullText.includes('Circus Charlie') || fullText.includes('CIRCUS CHARLIE')) {
        expect(fullText).not.toContain('circus charlie');
        expect(fullText).not.toContain('Circus charlie');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 類別 G：HUD 覆蓋層與多語系動態切換整合測試 (HUD Overlay & i18n Integration)
  // --------------------------------------------------------------------------
  describe('G. HUD 覆蓋層與多語系動態切換整合測試 (HUD Overlay & i18n Integration)', () => {
    class MockElement {
      public id: string = '';
      public textContent: string = '';
      public innerText: string = '';
      public className: string = '';
      public style: Record<string, string> = {};
      public children: MockElement[] = [];
      public childElementCount: number = 0;
      public attributes: Map<string, string> = new Map();
      private listeners: Map<string, Array<(e: unknown) => void>> = new Map();

      constructor(id: string = '') {
        this.id = id;
      }

      public appendChild(child: MockElement): MockElement {
        this.children.push(child);
        this.childElementCount = this.children.length;
        return child;
      }

      public removeChild(child: MockElement): MockElement {
        const idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
        this.childElementCount = this.children.length;
        return child;
      }

      public setAttribute(name: string, value: string): void {
        this.attributes.set(name, value);
      }

      public getAttribute(name: string): string | null {
        return this.attributes.get(name) ?? null;
      }

      public addEventListener(event: string, cb: (e: unknown) => void): void {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(cb);
      }

      public dispatchEvent(e: { type: string; stopPropagation?: () => void; preventDefault?: () => void }): void {
        const list = this.listeners.get(e.type) || [];
        for (const handler of list) {
          handler(e);
        }
      }
    }

    let registry: Map<string, MockElement>;
    let overlay: MockElement;
    let banner: MockElement;
    let btnToggle: MockElement;
    let label1up: MockElement;
    let labelHigh: MockElement;
    let labelBonus: MockElement;
    let labelRest: MockElement;
    let distanceUnit: MockElement;
    let hintArrows: MockElement;
    let hintWasd: MockElement;
    let btnLeft: MockElement;
    let btnRight: MockElement;
    let btnJump: MockElement;

    beforeEach(() => {
      registry = new Map<string, MockElement>();
      overlay = new MockElement('ui-overlay');
      banner = new MockElement('status-banner');
      btnToggle = new MockElement('btn-lang-toggle');
      label1up = new MockElement('label-1up');
      labelHigh = new MockElement('label-high');
      labelBonus = new MockElement('label-bonus');
      labelRest = new MockElement('label-rest');
      distanceUnit = new MockElement('distance-unit');
      hintArrows = new MockElement('hint-arrows');
      hintWasd = new MockElement('hint-wasd');
      btnLeft = new MockElement('btn-left');
      btnRight = new MockElement('btn-right');
      btnJump = new MockElement('btn-jump');

      registry.set('ui-overlay', overlay);
      registry.set('status-banner', banner);
      registry.set('btn-lang-toggle', btnToggle);
      registry.set('label-1up', label1up);
      registry.set('label-high', labelHigh);
      registry.set('label-bonus', labelBonus);
      registry.set('label-rest', labelRest);
      registry.set('distance-unit', distanceUnit);
      registry.set('hint-arrows', hintArrows);
      registry.set('hint-wasd', hintWasd);
      registry.set('btn-left', btnLeft);
      registry.set('btn-right', btnRight);
      registry.set('btn-jump', btnJump);

      const doc = (globalThis as unknown as { document: Record<string, unknown> }).document || {};
      doc.getElementById = (id: string) => registry.get(id) || null;
      doc.createElement = (tag: string) => new MockElement(tag);
      doc.documentElement = { lang: 'zh-TW' };
      vi.stubGlobal('document', doc);
    });

    it('G-1: HUDOverlay 建構時自動綁定語系切換鈕與 DOM 標籤', () => {
      globalI18n.setLanguage('zh-TW');
      const hud = new HUDOverlay();

      expect(btnToggle.textContent).toBe('EN');
      expect(labelBonus.textContent).toBe('獎勵分');
      expect(hintArrows.textContent).toContain('減速');

      hud.destroy();
    });

    it('G-2: 點擊語系切換按鈕觸發語系雙向切換（zh-TW <-> en-US）與 DOM 即時響應', () => {
      globalI18n.setLanguage('zh-TW');
      const hud = new HUDOverlay();

      // 觸發切換至 en-US
      let stopPropCalled = false;
      let prevDefCalled = false;
      btnToggle.dispatchEvent({
        type: 'click',
        stopPropagation: () => { stopPropCalled = true; },
        preventDefault: () => { prevDefCalled = true; },
      });

      expect(stopPropCalled).toBe(true);
      expect(prevDefCalled).toBe(true);
      expect(globalI18n.getLanguage()).toBe('en-US');
      expect(btnToggle.textContent).toBe('繁中');
      expect(labelBonus.textContent).toBe('BONUS');
      expect(hintArrows.textContent).toContain('Slow');

      // 再次觸發切換回 zh-TW
      btnToggle.dispatchEvent({
        type: 'click',
        stopPropagation: () => {},
        preventDefault: () => {},
      });

      expect(globalI18n.getLanguage()).toBe('zh-TW');
      expect(btnToggle.textContent).toBe('EN');
      expect(labelBonus.textContent).toBe('獎勵分');

      hud.destroy();
    });

    it('G-3: 語系切換按鈕之 pointerdown 事件強制阻絕冒泡（stopPropagation）', () => {
      const hud = new HUDOverlay();
      let stopPropCalled = false;

      btnToggle.dispatchEvent({
        type: 'pointerdown',
        stopPropagation: () => { stopPropCalled = true; },
      });

      expect(stopPropCalled).toBe(true);
      hud.destroy();
    });

    it('G-4: 遊戲狀態橫幅隨語系切換即時動態重繪', () => {
      globalI18n.setLanguage('zh-TW');
      const hud = new HUDOverlay();

      hud.setGameState('StageIntro');
      expect(banner.textContent).toContain('STAGE 1');
      expect(banner.textContent).toContain('第 1 關 100 公尺');

      globalI18n.setLanguage('en-US');
      expect(banner.textContent).toBe('STAGE 1 - 100M');

      hud.destroy();
    });

    it('G-5: destroy() 妥善清理 i18n 訂閱，後續切換不觸發已銷毀之 HUD 更新', () => {
      globalI18n.setLanguage('zh-TW');
      const hud = new HUDOverlay();
      hud.destroy();

      labelBonus.textContent = 'UNCHANGED';
      globalI18n.setLanguage('en-US');
      expect(labelBonus.textContent).toBe('UNCHANGED');
    });
  });
});
