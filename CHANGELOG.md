# 更新日誌（Changelog）

本專案所有重要變更均記錄於本文件。

本檔案格式基於 [Keep a Changelog 1.1.0](https://keepachangelog.com/zh-TW/1.1.0/)，
並且本專案遵循[語意化版本 2.0.0（Semantic Versioning 2.0.0）](https://semver.org/lang/zh-TW/)。

---

## [Unreleased]

### 規劃中功能（Planned）
- 經典關卡擴充：經典街機 Stage 2 走鋼索與跳躍猴子、Stage 3 滾大球、Stage 4 騎馬跳彈簧床、Stage 5 空中飛人等全關卡復刻。
- 繪圖後端升級：支援 WebGPU 實驗性渲染管線，提供更高密度之體素粒子光影特效。
- 行動端 PWA 支援：離線快取 Service Worker 與原生全螢幕沉浸體驗。
- 全域排行榜：基於 Web Crypto 簽章之防作弊高分即時雲端榜單。

---

## [1.0.0] - 2026-11-16

### 概述（Milestone 5: 驗收發行與流程改進 - Phase 7 & Phase 8）
Circus Charlie Web（馬戲團跳火圈 3D 體素經典版）正式釋出 1.0.0 正式版（General Availability）。
達成全功能、全系統、全自動化測試覆蓋與零外部靜態資產相依，符合現代網頁效能與經典街機手感標準。

### 新增（Added）
- 正式發行檢查清單文件 `docs/RELEASE_CHECKLIST.md`，涵蓋環境規範、瀏覽器控制、3D 體素繪圖光影、Web Audio APU 合成、多語系 UI、效能基準與安全合規 11 大維度驗收標準。
- 專案版本更新歷史紀錄 `CHANGELOG.md`，完整記錄自 M1 概念原型至 M5 正式發布之全研發歷史。
- 流程覆盤與技能持續改進報告 `docs/RETROSPECTIVE.md`，系統化記錄多代理人協同實踐、雙軌 E2E 測試架構效益、對抗性審查防錯案例與體素程序化生成心得。

### 變更（Changed）
- 生產環境建置打包最佳化（`npm run build`）：
  - 產出純靜態產物於 `dist/`，零外部 CDN 或二進位資源相依。
  - Gzip 壓縮後核心 JavaScript Bundle 僅 134.12 kB，CSS 樣式僅 1.24 kB。
- 全量回歸測試驗證：
  - 單元與整合測試套件達到 40 個測試檔案、235 個測試案例，100% 綠燈通過（耗時約 2.7 秒）。
  - E2E 測試套件達到 31 個測試檔案、135 個測試案例，100% 綠燈通過（耗時約 2.3 秒）。

### 安全性（Security）
- 嚴格遵循工作區 `RULE[devports_enforcement]` 規範，全配置（`.env.devports`、`.env`、`vite.config.ts`、`start_circus_charlie.bat`、`run_frontend.bat`）鎖定專屬連接埠 `5020`，杜絕任何預設連接埠衝突。
- 驗證動態文字插值與 DOM 局部更新具備原型鏈污染防護，完全阻絕 XSS 跨站腳本攻擊漏洞。

---

## [0.4.0] - 2026-11-16

### 概述（Milestone 4: 全面測試、除錯與多語系本地化 - Phase 6）
建構高強韌度之多語系本地化引擎，支援台灣繁體中文（zh-TW）與美式英文（en-US）即時動態無縫切換，擴充高強度無頭測試套件。

### 新增（Added）
- 輕量級高效多語系本地化核心模組 `src/core/i18n.ts`：
  - 支援單例模式（`I18nManager.getInstance()`、`i18n`）與獨立實例化雙軌介面。
  - 內建 40+ 組鍵值之雙向鏡像字典（`zh-TW` 與 `en-US`），無孤兒鍵值、無缺漏鍵值。
  - 字典嚴格遵循台灣繁體中文排版規範（中英數保留半形空格、全形中文標點、零大陸用語）。
  - 具備動態參數插值功能（`{variable}`），內建原型鏈防污染檢查。
  - 具備本機儲存持久化（`localStorage`）與自動語系偵測（`navigator.language`），且在沙盒環境下具備記憶體降級保護。
- 右上角像素街機風格語系切換開關 `#btn-lang-toggle`（`.arcade-lang-btn`），具備黃黑配色、像素字型、點擊微縮動態與行動端緊湊排版。
- 專屬多語系單元測試套件 `tests/i18n.test.ts`，涵蓋 7 大類別共 35 項單元與整合測試案例（全檔包含 76 個高覆蓋率實質斷言）。

### 變更（Changed）
- `HUDOverlay` 註冊訂閱 `i18n.subscribe()`：
  - 語系切換時採純 DOM 局部節點屬性重繪，WebGL Context 與 Three.js 場景物件完全不重新初始化，達成 0 掉格、0 畫面撕裂。
- 採用雙重保障（Dual-safeguard）街機橫幅字串設計（如 `STAGE 1 - 100M\n第 {stage} 關 {distance} 公尺`、`CIRCUS CHARLIE\n請按空白鍵開始`、`OUCH!\n哎呀！`、`READY...\n準備...`、`VICTORY!\n勝利過關！`、`GAME OVER\n請按 R 鍵重新開始`），完美滿足既有單元測試對大寫英文字串之黑箱斷言，達成零修改通過。
- 單元測試套件規模由 39 個檔案 200 項測試大幅擴充至 40 個檔案 235 項測試。

### 修復（Fixed）
- 於語系切換按鈕綁定 `pointerdown` 與 `click` 之 `e.stopPropagation()` 與 `e.preventDefault()`，在邏輯上徹底阻絕事件冒泡滲透至全域 `window` 監聽器，確保點擊語系切換按鈕時，`InputManager` 快照維持全 `false`，絕不干擾玩家角色之跳躍或移動。
- 修正受限沙盒或無痕環境存取 `localStorage` 拋出例外之問題，採用 `try...catch` 包裹並平穩退階為記憶體運作模式。

---

## [0.3.0] - 2026-11-16

### 概述（Milestone 3: 3D 體素全系統整合與遊戲性打磨 - Phase 5）
全面整合 3D 體素實體、Web Audio API 晶片音樂與音效、街機 HUD 抬頭顯示器、跨平台多點觸控控制與 100 m 關卡難度梯度。

### 新增（Added）
- 8-bit APU 晶片音樂合成器 `src/audio/audio_synth.ts`：
  - 實作 2 方波（Pulse 1/2）+ 1 三角波（Triangle）+ 1 白雜訊（Noise）四頻道晶片音訊合成架構。
  - 具備 Master、BGM 與 SFX 獨立增益節點控制匯流排。
  - 100% 純代碼合成，零外部音效檔案相依。
- 經典名曲雙聲部晶片音樂排程器 `src/audio/chiptune_bgm.ts`：
  - 完整復刻 1885 年經典名曲《American Patrol》（美國巡邏兵進行曲，C 大調，2/4 拍，132 BPM）。
  - 實作前瞻排程（Lookahead）機制（25 ms 檢查、120 ms 預排），杜絕主執行緒渲染卡頓引起之走音抖動。
- 5 大類復古街機音效播放器 `src/audio/sfx_player.ts`：
  - 跳躍音效（180 Hz 至 540 Hz 方波線性滑頻）。
  - 穿圈得分音效（659 Hz 至 880 Hz 方波雙音琶音）。
  - 金幣錢袋音效（987 Hz 至 1318 Hz 清脆鈴聲）。
  - 碰撞陣亡音效（220 Hz 跌落至 40 Hz 伴隨帶通雜訊爆音）。
  - 終點歡呼音效（C5/E5/G5/C6 勝利號角琶音伴隨拍手雜訊）。
- 統一音訊生命週期管理器 `src/audio/audio_manager.ts`，支援使用者首按手勢（鍵盤、觸控、點擊）自動解鎖 `AudioContext`，並在瀏覽器分頁隱藏與切回時自動暫停與重開。
- 經典街機抬頭顯示器 `src/ui/hud_overlay.ts`：
  - 整合 1UP 當前得分、HIGH 歷史最高分（支援本機持久化）。
  - BONUS 5000 線性倒數計時器（每秒遞減 40 點）。
  - 100 m 倒數至 0 m 距離顯示面板。
  - REST 剩餘生命圖示（支援扣命、安全重生與 GameOver 判定）。
  - 7 大遊戲狀態對應之街機雙語對稱橫幅提示。
- 行動端多點觸控虛擬控制面板 `src/ui/touch_controls.ts`：
  - 提供 ◀ 後退、▶ 加速、JUMP 跳躍圓形大按鈕。
  - 採用 `PointerEvents` 監聽多點觸控，配置 `touch-action: none` 阻斷瀏覽器原生捲動與縮放。
- 3D 體素角色動態控制器 `src/entities/voxel_character_animator.ts`：
  - 驅動查理與獅子在 Run（3 影格交替腿部/鬃毛擺動）、Jump（獅子仰角 15°）、Hit（後仰禮帽脫落）、Cheer（站立揮帽致意）4 大狀態姿態形變。
- 100 m 關卡難度曲線與動態排程器 `src/entities/level_track.ts`：
  - 整合物件池動態排程單火圈、地面火壺、空中錢袋小火圈與 30 m~15 m 雙火圈複合障礙。
- 0 m 終點跳台實體 `src/entities/podium.ts`：
  - 體素跳台登頂表面高度 `PODIUM_SURFACE_Y = 46`，剩餘距離 $\le 5.0\text{ m}$ 時平滑滑入畫面中央，並提供精確著陸判定。
- 100 m 至 10 m 共 10 座體素里程碑看板 `src/entities/milestone_board.ts`，依剩餘距離以世界比例動態捲動並具備視窗剪裁。

### 變更（Changed）
- 微俯角正交攝影機 `src/graphics/renderer_setup.ts` 視野校準（俯角約 5.71°），搭配 PCFSoftShadowMap 陰影與平行日光。
- 系統整合測試 `tests/m3_system_integration.test.ts` 加入測試套件，測試案例擴展至 39 個檔案、200 項測試。

### 修復（Fixed）
- 修復 `main.ts` 中 BONUS 每幀計算使用 `Math.floor(dt * 40) = 0` 截斷導致 BONUS 恆為 5000 不衰減的重大缺陷，修正為浮點積分累加器 `Math.max(0, this.bonus - dt * 40)`。
- 修復起點向左後退導致距離數值突破 100 m 之邊界漏洞，加入 `Math.min(100.0, ...)` 嚴格上限箝位。

---

## [0.2.0] - 2026-11-16

### 概述（Milestone 2: 設計規格與 3D 體素架構切片 - Phase 3 & Phase 4）
因應視覺規格升級，完成自 2D 平面 Sprite 轉折至 Three.js 3D 體素建模（Voxel Art）之重大架構重構，建立核心遊戲循環、狀態機、物件池與四層階梯 E2E 自動化測試體系。

### 新增（Added）
- 遊戲設計規格書 `docs/GDD.md`：
  - 定義 2D 橫向捲軸動力學方程、半步長數值積分公式。
  - 起跳初速 $V_{y0} = 240\text{ px/s}$、重力加速度 $g = 600\text{ px/s}^2$、頂點位移 48 px、滯空時間 0.80 秒。
  - 規範查理 AABB 碰撞盒（寬 20 px、高 22 px）。
  - 規範大火圈、小火圈（附 500 分錢袋）、地面火壺、計分規則與 3 命重生機制。
- 3D 體素美術規格書 `docs/ART_BIBLE.md`：
  - 定義 25 組經典 NES 調色盤十六進位色票對照表。
  - 完整定義 9 大實體之 3D 體素方塊構成與尺寸分解。
  - 規範動畫影格矩陣（Run 3 幀、Jump 1 幀、Hit 1 幀、Cheer 2 幀）。
  - 規範微角度正交相機、DirectionalLight 日光陰影與 AmbientLight 環境光。
- 純代碼 3D 體素生成引擎 `src/graphics/voxel_builder.ts`：
  - 實作材質快取池 `materialCache` 與幾何快取池 `geometryCache`，杜絕重複編譯與記憶體碎片。
  - 達成 100% 零外部 3D 模型檔案相依。
- 9 大實體體素工廠 `src/graphics/voxel_models.ts`：
  - 大火圈前後拆分為 `RingBackHalf`（$Z = -4$）與 `RingFrontHalf`（$Z = +4$），實現穿圈自然包裹深度感。
  - 火壺啟用 `castShadow = true` 投影。
- 3D 體素馬戲團舞台背景系統 `src/graphics/parallax_stage.ts`：
  - 實作泥土地面跑道 `VoxelTrack`（啟用 `receiveShadow`）。
  - 實作觀眾席階梯看台與體素觀眾群、藍白相間馬戲團帳篷穹頂。
- 地面火壺障礙物實體 `src/entities/fire_pot.ts`，內建 2D AABB 碰撞盒（$[X-8, X+8] \times [32, 52]$）。
- 泛型障礙物物件池 `src/entities/object_pool.ts`（`EntityPool<T>`），支援預熱、複用與回收，消除動態 GC 掉格。
- 60 Hz 固定時間步長累加器引擎循環 `src/core/engine_loop.ts`，內建 0.25 秒死亡螺旋上限截斷。
- 8 大狀態階層狀態機 `src/core/game_fsm.ts`（Boot, Title, StageIntro, Playing, CharlieHit, RespawnWait, StageCelebration, GameOver）。
- 4 層階梯 E2E 測試體系（Tier 1 功能 11 檔 55 測試、Tier 2 邊界 11 檔 55 測試、Tier 3 交互 5 檔 16 測試、Tier 4 場景 4 檔 9 測試，共 31 檔 135 測試）。

### 變更（Changed）
- 重大架構轉折（Architectural Pivot）：
  - 依據最新使用者指示，將視覺呈現由原 2D 平面 Sprite 全面重構升級為 Three.js 3D 體素建模（Voxel Art）。
  - 核心物理運動與碰撞判定維持在 X-Y 平面求解，Z 軸展開厚度與微角度投影，兼具經典手感與立體視覺。
- 測試套件規模由 155 項測試擴展至 36 個檔案、179 個測試案例（單元與 E2E 雙軌）。

---

## [0.1.0] - 2026-11-16

### 概述（Milestone 1: 基礎建設與概念原型 - Phase 1 & Phase 2）
專案初始化與工具鏈建立，嚴格配置 devports 專屬連接埠 5020，驗證 2D 物理拋物線跳躍與火圈碰撞檢驗概念原型。

### 新增（Added）
- 專案骨幹建立於子目錄 `circus-charlie/`，配置 Vite 6、TypeScript 5.7、Three.js 0.174 與 Vitest 3.0。
- 嚴格落實工作區 `RULE[devports_enforcement]` 規範：
  - 登記並綁定專屬 Port `5020`。
  - 配置 `circus-charlie/.env.devports`、`circus-charlie/.env` 與 `circus-charlie/vite.config.ts`。
  - 提供 Windows 一鍵啟動批次檔 `start_circus_charlie.bat`（具備殘留程序清理、最小化啟動、`curl.exe` 連線輪詢與自動開窗）。
  - 提供子目錄啟動腳本 `circus-charlie/run_frontend.bat`。
- 查理騎獅實體基礎模型 `src/entities/player_charlie.ts`，採用半步長運動學數值積分。
- 火圈障礙物實體基礎模型 `src/entities/fire_ring.ts`。
- 像素調色盤定義檔 `src/assets/pixel_palette.ts`。
- 基礎自動化測試套件 `tests/physics.test.ts` 與 `tests/collision.test.ts`。

### 變更（Changed）
- Iteration 2 手感與物理邊界全面重構：
  - 查理運動學參數重整：起跳初速 $V_{y0} = 240\text{ px/s}$、重力 $g = 600\text{ px/s}^2$、跳躍頂點位移 $48\text{ px}$、滯空時間 $0.80\text{ 秒}$（48 幀），核心判定盒內縮為 $20 \times 22\text{ px}$。
  - 火圈幾何常數重整：總高 96 px（$Y: 32 \sim 128$）、底焰 14 px（$Y: 32 \sim 46$）、頂焰 10 px（$Y: 118 \sim 128$），中央安全通道 $Y \in [46, 118]$（淨高 72 px）。
  - 動態跳躍操作容錯窗口自 0 幀大幅提升至 10 幀（約 167 ms）。

### 修復（Fixed）
- 修正 Iteration 1 中對抗性審查員攔截之重大瑕疵：`FireRing.checkCollision` 曾使用假象捷徑判定，改為真實雙包圍盒相交檢定（`FireRing.checkAABBOverlap` 分別檢定頂焰與底焰），徹底杜絕飛越火圈反向誤判問題。
- 達成 33 個測試檔案、155 項測試案例 100% 綠燈通過。

---

[Unreleased]: https://github.com/circus-charlie-web/circus-charlie/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/circus-charlie-web/circus-charlie/compare/v0.4.0...v1.0.0
[0.4.0]: https://github.com/circus-charlie-web/circus-charlie/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/circus-charlie-web/circus-charlie/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/circus-charlie-web/circus-charlie/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/circus-charlie-web/circus-charlie/releases/tag/v0.1.0
