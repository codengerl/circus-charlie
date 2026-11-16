import { GameState } from '../core/game_fsm';
import { i18n, SupportedLanguage } from '../core/i18n';

export class HUDOverlay {
  private scoreElem: HTMLElement | null = null;
  private highScoreElem: HTMLElement | null = null;
  private bonusElem: HTMLElement | null = null;
  private distanceElem: HTMLElement | null = null;
  private livesContainer: HTMLElement | null = null;
  private statusBanner: HTMLElement | null = null;
  private langToggleBtn: HTMLElement | null = null;
  private unsubscribeI18n: (() => void) | null = null;
  private currentGameState: GameState = 'Title';

  private highScore: number = 20000;
  private readonly STORAGE_KEY = 'circus_charlie_high_score';

  constructor() {
    if (typeof document === 'undefined') return;

    this.scoreElem = document.getElementById('score-val');
    this.highScoreElem = document.getElementById('highscore-val');
    this.bonusElem = document.getElementById('bonus-val');
    this.distanceElem = document.getElementById('distance-val');
    this.livesContainer = document.getElementById('lives-icons');
    this.statusBanner = document.getElementById('status-banner');

    this.loadHighScore();
    this.createBannerIfNotExists();
    this.createLangToggleIfNotExists();
    this.setupLangToggle();

    this.unsubscribeI18n = i18n.subscribe(() => {
      this.applyLanguage();
    });

    this.applyLanguage();
  }

  private loadHighScore(): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
          const val = parseInt(saved, 10);
          if (!isNaN(val) && val > 0) {
            this.highScore = val;
          }
        }
      }
    } catch {
      // 容錯防護
    }
  }

  private saveHighScore(val: number): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem(this.STORAGE_KEY, val.toString());
      }
    } catch {
      // 容錯防護
    }
  }

  private createBannerIfNotExists(): void {
    if (this.statusBanner || typeof document === 'undefined') return;
    const overlay = document.getElementById('ui-overlay');
    if (!overlay || typeof overlay.appendChild !== 'function') return;

    try {
      this.statusBanner = document.createElement('div');
      this.statusBanner.id = 'status-banner';
      this.statusBanner.className = 'status-banner';
      overlay.appendChild(this.statusBanner);
    } catch {
      // 容錯防護
    }
  }

  private createLangToggleIfNotExists(): void {
    if (this.langToggleBtn || typeof document === 'undefined') return;
    this.langToggleBtn = document.getElementById('btn-lang-toggle');
    if (!this.langToggleBtn) {
      const overlay = document.getElementById('ui-overlay');
      if (overlay && typeof overlay.appendChild === 'function') {
        try {
          this.langToggleBtn = document.createElement('button');
          this.langToggleBtn.id = 'btn-lang-toggle';
          this.langToggleBtn.className = 'arcade-lang-btn';
          overlay.appendChild(this.langToggleBtn);
        } catch {
          // 容錯防護
        }
      }
    }
  }

  private setupLangToggle(): void {
    if (!this.langToggleBtn || typeof this.langToggleBtn.addEventListener !== 'function') return;

    this.langToggleBtn.addEventListener('pointerdown', (e: Event) => {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
    });

    this.langToggleBtn.addEventListener('click', (e: Event) => {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      const nextLang: SupportedLanguage = i18n.getLanguage() === 'zh-TW' ? 'en-US' : 'zh-TW';
      i18n.setLanguage(nextLang);
    });
  }

  /**
   * 應用多語系文字至所有 DOM 標籤與橫幅
   */
  public applyLanguage(): void {
    if (typeof document === 'undefined') return;

    if (this.langToggleBtn) {
      this.langToggleBtn.textContent = i18n.t('ui.lang_btn');
      if (typeof this.langToggleBtn.setAttribute === 'function') {
        this.langToggleBtn.setAttribute('aria-label', i18n.t('ui.lang_aria'));
      }
    }

    const label1up = document.getElementById('label-1up');
    if (label1up) label1up.textContent = i18n.t('hud.1up');

    const labelHigh = document.getElementById('label-high');
    if (labelHigh) labelHigh.textContent = i18n.t('hud.high');

    const labelBonus = document.getElementById('label-bonus');
    if (labelBonus) labelBonus.textContent = i18n.t('hud.bonus');

    const distanceUnit = document.getElementById('distance-unit');
    if (distanceUnit) distanceUnit.textContent = i18n.t('hud.distance_unit');

    const labelRest = document.getElementById('label-rest');
    if (labelRest) labelRest.textContent = i18n.t('hud.rest');

    const hintArrows = document.getElementById('hint-arrows');
    if (hintArrows) hintArrows.textContent = i18n.t('controls.hint_arrows');

    const hintWasd = document.getElementById('hint-wasd');
    if (hintWasd) hintWasd.textContent = i18n.t('controls.hint_wasd');

    const btnLeft = document.getElementById('btn-left');
    if (btnLeft && typeof btnLeft.setAttribute === 'function') {
      btnLeft.setAttribute('aria-label', i18n.t('touch.left'));
    }

    const btnRight = document.getElementById('btn-right');
    if (btnRight && typeof btnRight.setAttribute === 'function') {
      btnRight.setAttribute('aria-label', i18n.t('touch.right'));
    }

    const btnJump = document.getElementById('btn-jump');
    if (btnJump) {
      btnJump.textContent = i18n.t('touch.jump');
      if (typeof btnJump.setAttribute === 'function') {
        btnJump.setAttribute('aria-label', i18n.t('touch.jump_aria'));
      }
    }

    this.renderBannerText();
  }

  /**
   * 更新 HUD 數據呈現
   */
  public update(score: number, currentHighScore: number, bonus: number, lives: number, distance: number): void {
    if (score > this.highScore) {
      this.highScore = Math.floor(score);
      this.saveHighScore(this.highScore);
    }
    const displayHighScore = Math.max(this.highScore, currentHighScore);

    if (this.scoreElem) {
      this.scoreElem.textContent = String(Math.floor(score)).padStart(6, '0');
    }
    if (this.highScoreElem) {
      this.highScoreElem.textContent = String(Math.floor(displayHighScore)).padStart(6, '0');
    }
    if (this.bonusElem) {
      this.bonusElem.textContent = String(Math.floor(bonus)).padStart(4, '0');
    }
    if (this.distanceElem) {
      this.distanceElem.textContent = Math.max(0, Math.ceil(distance)).toString();
    }

    this.updateLives(lives);
  }

  private updateLives(lives: number): void {
    if (!this.livesContainer) {
      if (typeof document !== 'undefined') {
        this.livesContainer = document.getElementById('lives-icons');
      }
    }
    if (!this.livesContainer || typeof this.livesContainer.appendChild !== 'function') return;

    const safeLives = Math.max(0, Math.floor(lives));
    // 僅在圖標數量變化時重繪 DOM
    const currentCount = this.livesContainer.childElementCount ?? (this.livesContainer.children ? this.livesContainer.children.length : -1);
    if (currentCount !== safeLives) {
      this.livesContainer.innerHTML = '';
      while (this.livesContainer.firstChild) {
        this.livesContainer.removeChild(this.livesContainer.firstChild);
      }
      if (Array.isArray((this.livesContainer as unknown as { children?: unknown[] }).children)) {
        (this.livesContainer as unknown as { children: unknown[] }).children = [];
        (this.livesContainer as unknown as { childElementCount: number }).childElementCount = 0;
      }
      for (let i = 0; i < safeLives; i++) {
        const icon = document.createElement('span');
        icon.className = 'life-icon';
        icon.title = i18n.t('hud.life_tooltip', { count: i + 1 });
        this.livesContainer.appendChild(icon);
      }
    }
  }

  /**
   * 依據遊戲狀態更新橫幅文字
   */
  public setGameState(state: GameState): void {
    this.currentGameState = state;
    this.renderBannerText();
  }

  private renderBannerText(): void {
    if (!this.statusBanner) {
      this.createBannerIfNotExists();
    }
    if (!this.statusBanner) return;

    let text = '';
    let show = true;
    switch (this.currentGameState) {
      case 'Title':
        text = i18n.t('banner.title');
        break;
      case 'StageIntro':
        text = i18n.t('banner.stage_intro', { stage: 1, distance: 100 });
        break;
      case 'Playing':
        show = false;
        break;
      case 'CharlieHit':
        text = i18n.t('banner.hit');
        break;
      case 'RespawnWait':
        text = i18n.t('banner.ready');
        break;
      case 'StageCelebration':
        text = i18n.t('banner.victory');
        break;
      case 'GameOver':
        text = i18n.t('banner.game_over');
        break;
    }

    this.statusBanner.textContent = text;
    this.statusBanner.innerText = text;
    if (this.statusBanner.style) {
      this.statusBanner.style.display = show ? 'block' : 'none';
    }
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public destroy(): void {
    if (this.unsubscribeI18n) {
      this.unsubscribeI18n();
      this.unsubscribeI18n = null;
    }
  }
}
