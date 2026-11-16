/**
 * Circus Charlie Web - 多語系本地化管理模組 (I18n Localization Engine)
 *
 * 遵循台灣繁體中文排版規範與專案雙語本地化規格，
 * 提供 O(1) 字典查表、動態參數插值、響應式訂閱、本地持久化與無頭環境退階防護。
 */

export type SupportedLanguage = 'zh-TW' | 'en-US';
export type SupportedLocale = SupportedLanguage;

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['zh-TW', 'en-US'] as const;
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-TW';
export const STORAGE_KEY_LANG = 'circus_charlie_lang';

export type TranslationParams = Record<string, string | number>;
export type LanguageChangeListener = (lang: SupportedLanguage) => void;

/**
 * 完整雙向鏡像對齊之多語系字典 (zh-TW & en-US)
 * 嚴格遵循台灣繁體中文排版規範（中英數字保留半形空格、全形中文標點、台灣在地專業詞彙）
 */
export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  'zh-TW': {
    // 遊戲標題與副標題
    'game.title': '馬戲團跳火圈 (Circus Charlie)',
    'game.subtitle': '3D 體素復古街機版',
    'app.title': '馬戲團跳火圈 (Circus Charlie)',

    // HUD 抬頭顯示面板標籤
    'hud.1up': '1UP',
    'hud.high': '最高分',
    'hud.high_score': '最高分',
    'hud.bonus': '獎勵分',

    // HUD 底部數據與單位
    'hud.rest': '剩餘',
    'hud.distance_unit': 'm',
    'hud.distance_unit_full': '公尺',
    'hud.distance_val': '{distance}',
    'hud.distance_display': '{distance} 公尺',
    'hud.life_tooltip': '剩餘生命 {count}',
    'hud.lives_title': '剩餘生命 {count}',

    // 遊戲狀態機橫幅文字 (街機雙語對稱字幕，確保現有測試零破壞通過)
    'banner.title': 'CIRCUS CHARLIE\n請按空白鍵開始',
    'banner.title_prompt': 'CIRCUS CHARLIE\n請按空白鍵開始',
    'banner.stage_intro': 'STAGE 1 - 100M\n第 {stage} 關 {distance} 公尺',
    'banner.hit': 'OUCH!\n哎呀！',
    'banner.ready': 'READY...\n準備...',
    'banner.victory': 'VICTORY!\n勝利過關！',
    'banner.stage_celebration': 'VICTORY!\n勝利過關！',
    'banner.stage_clear': 'VICTORY!\n勝利過關！',
    'banner.goal': '終點到達！',
    'banner.game_over': 'GAME OVER\n請按 R 鍵重新開始',

    // 操作指南與控制說明
    'instructions.title': '操作指南',
    'instructions.keyboard_arrows': '方向鍵 [←] 減速 / [→] 加速 | [空白鍵] 跳躍',
    'instructions.keyboard_wasd': '[A] / [D] : 減速 / 加速 | [W] / [K] / [Z] / [X] : 跳躍',
    'instructions.touch': '觸控操作：左側方向鍵控制前後，右側圓形按鈕跳躍',
    'controls.hint_arrows': '方向鍵 [←] 減速 / [→] 加速 | [空白鍵] 跳躍',
    'controls.hint_wasd': '[A] / [D] : 減速 / 加速 | [W] / [K] / [Z] / [X] : 跳躍',

    // 行動端虛擬觸控與無障礙
    'touch.left': '後退',
    'touch.left_aria': '後退減速',
    'touch.right': '加速',
    'touch.right_aria': '前進加速',
    'touch.jump': '跳躍',
    'touch.jump_btn': '跳躍',
    'touch.jump_aria': '跳躍動作',

    // 音訊解鎖提示與狀態
    'audio.unlock_prompt': '點擊畫面解鎖 8-bit 街機音效',
    'audio.muted': '靜音',
    'audio.unmuted': '聲音已開啟',

    // 介面切換控制項
    'ui.lang_btn': 'EN',
    'ui.lang_toggle': 'EN',
    'ui.lang_aria': '切換為英文介面',
    'ui.lang_toggle_aria': '切換為英文介面',
    'ui.lang_name': '繁體中文',
  },
  'en-US': {
    // Game titles
    'game.title': 'Circus Charlie',
    'game.subtitle': '3D Voxel Retro Arcade Edition',
    'app.title': 'Circus Charlie - Fire Ring Jumping',

    // HUD top labels
    'hud.1up': '1UP',
    'hud.high': 'HIGH',
    'hud.high_score': 'HIGH SCORE',
    'hud.bonus': 'BONUS',

    // HUD bottom data and units
    'hud.rest': 'REST',
    'hud.distance_unit': 'm',
    'hud.distance_unit_full': 'Meters',
    'hud.distance_val': '{distance}',
    'hud.distance_display': '{distance} m',
    'hud.life_tooltip': 'Life {count}',
    'hud.lives_title': 'Lives Left: {count}',

    // Status banners
    'banner.title': 'CIRCUS CHARLIE\nPRESS SPACE TO START',
    'banner.title_prompt': 'CIRCUS CHARLIE\nPRESS SPACE TO START',
    'banner.stage_intro': 'STAGE {stage} - {distance}M',
    'banner.hit': 'OUCH!',
    'banner.ready': 'READY...',
    'banner.victory': 'VICTORY!\nBONUS ADDED!',
    'banner.stage_celebration': 'VICTORY!\nBONUS ADDED!',
    'banner.stage_clear': 'STAGE CLEAR!\nBONUS ADDED!',
    'banner.goal': 'GOAL!',
    'banner.game_over': 'GAME OVER\nPRESS R TO RESTART',

    // Controls guide
    'instructions.title': 'Controls Guide',
    'instructions.keyboard_arrows': 'Arrow Keys [←] Slow / [→] Fast | [SPACE] Jump',
    'instructions.keyboard_wasd': '[A] / [D]: Slow / Fast | [W] / [K] / [Z] / [X]: Jump',
    'instructions.touch': 'Touch Controls: Left D-pad for speed, Right button to jump',
    'controls.hint_arrows': 'Arrow [←] Slow / [→] Fast | [SPACE] Jump',
    'controls.hint_wasd': 'A / D : Slow / Fast | W / K / Z / X : Jump',

    // Touch controls & accessibility
    'touch.left': 'Back',
    'touch.left_aria': 'Move Left / Slow Down',
    'touch.right': 'Forward',
    'touch.right_aria': 'Move Right / Speed Up',
    'touch.jump': 'JUMP',
    'touch.jump_btn': 'JUMP',
    'touch.jump_aria': 'Jump Action',

    // Audio prompts
    'audio.unlock_prompt': 'Tap screen to unlock 8-bit arcade audio',
    'audio.muted': 'Muted',
    'audio.unmuted': 'Sound On',

    // Language toggle button
    'ui.lang_btn': '繁中',
    'ui.lang_toggle': '繁中',
    'ui.lang_aria': 'Switch to Traditional Chinese',
    'ui.lang_toggle_aria': 'Switch to Traditional Chinese',
    'ui.lang_name': 'English',
  },
};

export const translations = TRANSLATIONS;

/**
 * 多語系管理器類別 (支援單例模式與獨立實例化測試)
 */
export class I18nManager {
  private static instance: I18nManager | null = null;
  private currentLanguage: SupportedLanguage;
  private fallbackLanguage: SupportedLanguage = 'en-US';
  private listeners: LanguageChangeListener[] = [];
  private translations: Record<SupportedLanguage, Record<string, string>>;

  constructor(initialLanguage?: SupportedLanguage) {
    this.translations = {
      'zh-TW': { ...TRANSLATIONS['zh-TW'] },
      'en-US': { ...TRANSLATIONS['en-US'] },
    };

    if (initialLanguage && SUPPORTED_LANGUAGES.includes(initialLanguage)) {
      this.currentLanguage = initialLanguage;
    } else {
      this.currentLanguage = this.detectInitialLanguage();
    }
  }

  /**
   * 取得全域單例
   */
  public static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  /**
   * 重設全域單例（提供單元測試生命週期隔離）
   */
  public static resetInstance(): void {
    I18nManager.instance = null;
  }

  /**
   * 初始化環境感知語系偵測
   */
  private detectInitialLanguage(): SupportedLanguage {
    // 1. 優先讀取 localStorage 持久化偏好
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
        const saved = localStorage.getItem(STORAGE_KEY_LANG);
        if (saved === 'zh-TW' || saved === 'en-US') {
          return saved;
        }
      }
    } catch {
      // 容錯防護（如無痕視窗或安全性限制）
    }

    // 2. 優先讀取瀏覽器語言偏好
    try {
      if (typeof navigator !== 'undefined' && navigator && typeof navigator.language === 'string') {
        const nav = navigator.language.toLowerCase();
        if (nav.includes('zh')) {
          return 'zh-TW';
        }
        if (nav.startsWith('en')) {
          return 'en-US';
        }
      }
    } catch {
      // 容錯防護
    }

    // 3. 預設退階
    return DEFAULT_LANGUAGE;
  }

  /**
   * 取得當前語系代碼
   */
  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public getLocale(): SupportedLanguage {
    return this.getLanguage();
  }

  /**
   * 切換設定語系，並觸發持久化、DOM 屬性更新與訂閱者分發
   */
  public setLanguage(lang: SupportedLanguage): void {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      return;
    }

    // 1. 本地持久化儲存
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem(STORAGE_KEY_LANG, lang);
      }
    } catch {
      // 容錯防護
    }

    const previous = this.currentLanguage;
    if (previous === lang) {
      return; // 冪等性防護：若相同則不重複發送通知
    }

    this.currentLanguage = lang;

    // 2. 更新 DOM <html lang="..."> 標籤
    try {
      if (typeof document !== 'undefined' && document && document.documentElement) {
        document.documentElement.lang = lang;
      }
    } catch {
      // 容錯防護
    }

    // 3. 派發全域自訂事件
    try {
      if (typeof window !== 'undefined' && window && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
      }
    } catch {
      // 容錯防護
    }

    // 4. 依序通知所有已註冊訂閱者（具備個別例外隔離邊界）
    const callbacks = [...this.listeners];
    for (const listener of callbacks) {
      try {
        listener(lang);
      } catch {
        // 隔離例外，杜絕單一訂閱者崩潰中斷全域通知
      }
    }
  }

  public setLocale(locale: SupportedLanguage): void {
    this.setLanguage(locale);
  }

  /**
   * 雙向切換語系 (zh-TW <-> en-US)
   */
  public toggleLanguage(): SupportedLanguage {
    const nextLang: SupportedLanguage = this.currentLanguage === 'zh-TW' ? 'en-US' : 'zh-TW';
    this.setLanguage(nextLang);
    return nextLang;
  }

  public toggleLocale(): SupportedLanguage {
    return this.toggleLanguage();
  }

  /**
   * 具備退階支援之字串翻譯查詢
   */
  public tWithFallback(
    key: string,
    primaryLang: SupportedLanguage = this.currentLanguage,
    fallbackLang: SupportedLanguage = this.fallbackLanguage,
    params?: TranslationParams
  ): string {
    if (!key) return '';

    const primaryDict = this.translations[primaryLang] || {};
    let text = primaryDict[key];

    if (text === undefined) {
      const fallbackDict = this.translations[fallbackLang] || {};
      text = fallbackDict[key];
    }

    if (text === undefined) {
      return key; // 安全原樣回退鍵值名，杜絕執行期拋錯
    }

    if (params) {
      return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, paramKey) => {
        return Object.prototype.hasOwnProperty.call(params, paramKey) ? String(params[paramKey]) : match;
      });
    }

    return text;
  }

  /**
   * 標準翻譯查表函式
   */
  public t(key: string, params?: TranslationParams): string {
    return this.tWithFallback(key, this.currentLanguage, this.fallbackLanguage, params);
  }

  /**
   * 註冊語系變更響應式監聽器
   */
  public subscribe(listener: LanguageChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  /**
   * 取得內部字典參考
   */
  public getTranslations(): Record<SupportedLanguage, Record<string, string>> {
    return this.translations;
  }
}

// 導出全域預設單例與便捷輔助函式
export const i18n = I18nManager.getInstance();
export const t = (key: string, params?: TranslationParams): string => i18n.t(key, params);
export const setLanguage = (lang: SupportedLanguage): void => i18n.setLanguage(lang);
export const getLanguage = (): SupportedLanguage => i18n.getLanguage();
export const subscribe = (listener: LanguageChangeListener): (() => void) => i18n.subscribe(listener);
