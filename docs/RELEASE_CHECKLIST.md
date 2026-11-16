# 發行檢查清單（Release Checklist）：Circus Charlie v1.0.0（3D 體素經典版）

## 一、 發行總覽與上線決策（Go / No-Go Decision）
1. 專案名稱：Circus Charlie Web（Three.js 3D Voxel Arcade Edition）
2. 軟體版本：v1.0.0
3. 發行平台：HTML5 / WebGL（支援桌面與行動端現代網頁瀏覽器）
4. 評估日期：2026-11-16
5. 決策結果：[READY] 綜合評估指標全數合規，核准正式發行
6. 簽核角色：品質保證測試工程師、前端架構工程師、專案協調員

## 二、 程式碼健康度與靜態分析（Codebase Health）
掃描範圍涵蓋 `circus-charlie/src` 與 `circus-charlie/tests` 內共 28 個原始碼檔案與 40 個測試檔案：
- [x] 全專案 0 處 TODO 待辦註解（掃描結果精確為 0 筆）
- [x] 全專案 0 處 FIXME 缺陷標記（零遺留阻塞缺陷）
- [x] 全專案 0 處 HACK 臨時補丁標記（零臨時性應急代碼）
- [x] TypeScript 編譯無警告零錯誤（嚴格模式 `strict: true`、`noUnusedLocals: true`、`noUnusedParameters: true` 檢驗全數通過）

## 三、 生產環境建置與產物驗證（Build & Bundle Verification）
1. 建置指令：`npm run build`（依序執行 `tsc && vite build`）
2. 建置歷時：約 1.05 秒，程序結束代碼（Exit Code）為 0
3. 產物目錄結構與體積驗證（`circus-charlie/dist/`）：
   - [x] `dist/index.html`：2.19 kB（gzip 壓縮後為 0.92 kB）
   - [x] `dist/assets/index-vH_MubWm.css`：4.00 kB（gzip 壓縮後為 1.24 kB）
   - [x] `dist/assets/index-DocULwyq.js`：536.08 kB（gzip 壓縮後為 134.12 kB，包含 Three.js 核心函式庫與體素生成引擎）
4. 效能與網路預算評估：
   - [x] Gzip 總傳輸量約 136.28 kB，遠低於 HTML5 網頁應用程式 5 MB 預算上限，可在 3G 網路環境下於 1 秒內完成載入
   - [x] 靜態檔案相對路徑配置合規（`base: './'`），支援任意靜態伺服器目錄直接部署
   - [x] 零外部二進位資產相依：圖片（0）、外部 3D 幾何模型（0）、外部音訊（0），100% 由 TypeScript 純代碼程序化即時生成

## 四、 環境設定與連接埠規範（Environment & Devports Compliance）
1. [x] 嚴格落實工作區 `RULE[devports_enforcement]` 規範，指派專屬連接埠 5020，嚴禁任何通用預設連接埠（如 3000、5000、8000、8080、5173）
2. [x] 環境變數檔案配置合規：
   - `circus-charlie/.env`：包含 `PORT=5020` 與 `VITE_PORT=5020`
   - `circus-charlie/.env.devports`：包含 `DEVPORTS_PROJECT_NAME=circus-charlie` 與 `PORT={devports:circus-charlie:app}`
3. [x] 伺服器配置解析：`circus-charlie/vite.config.ts` 優先讀取環境變數連接埠，啟用 `strictPort: true` 與 `host: '127.0.0.1'`
4. [x] Windows 整合啟動腳本驗證（`start_circus_charlie.bat`）：
   - 具備舊有殘留程序自動清理機制（透過 `taskkill /F /PID` 釋放 5020 連接埠）
   - 以最小化背景模式執行前端服務
   - 具備 30 次循環連線輪詢健康檢查（`curl.exe -s -o nul http://127.0.0.1:5020`）
   - 服務就緒後自動開啟預設瀏覽器導向 `http://localhost:5020`
   - 於使用者終止腳本時再次乾淨釋放 5020 連接埠
5. [x] 子目錄啟動腳本（`circus-charlie/run_frontend.bat`）明確傳入 `--port 5020 --host 127.0.0.1` 參數

## 五、 3D 體素幾何與渲染管線（3D Voxel Graphics & Rendering）
1. [x] 攝影機配置：採用 `OrthographicCamera` 微俯角設定（俯角約 5.71°，座標 (128, 124, 120) 凝視 (128, 112, 0)），兼具立體深度與 2D 橫向捲軸精準軸向判讀性
2. [x] 角色體素模型：查理騎獅（四肢、軀幹、頭部、鬃毛、高頂禮帽、領結）純方塊幾何結構完整
3. [x] 障礙物體素模型：大火圈拆分為前層（$Z = +4$）與後層（$Z = -4$）獨立網格，實現角色穿越時之自然環繞包覆感；小火圈附帶立體金幣錢袋；地面火壺配置獨立火焰噴發方塊
4. [x] 場景與里程看板：100 m 倒數至 0 m 之體素看板、0 m 終點跳台（$Y = 46$ 著陸平面）組裝完整
5. [x] 光影渲染設定：配置 `AmbientLight`（強度 0.6）與 `DirectionalLight`（強度 1.2），並啟用 `PCFSoftShadowMap` 陰影映射
6. [x] 色彩傳承與視覺風格：採用 25 組經典 NES 官方調色盤高飽和色票
7. [x] 像素清晰度保障：鎖定 `pixelRatio: 1` 搭配 `NearestFilter`，防止高解析度 Retina 螢幕產生抗鋸齒模糊失真
8. [x] 記憶體最佳化：實作全域材質快取池（`materialCache`）與幾何快取池（`geometryCache`），複用相同尺寸與顏色之幾何實例，消弭 GPU 記憶體碎片

## 六、 運動學與 60 FPS 確定性循環（Kinematics & Engine Loop）
1. [x] 固定時間步長累加器：`EngineLoop` 嚴格以 60 Hz（$\Delta t = 1/60$ 秒）進行物理狀態數值積分更新
2. [x] 死亡螺旋防護：設置 `maxFrameTime = 0.25` 秒上限鉗制，標籤頁凍結切回時單次最多補償 15 步，杜絕死循環崩潰
3. [x] 訊框渲染插值：輸出累加器餘數 `alpha` 提供渲染平滑插值，高更新率螢幕運作無抖動
4. [x] 運動學參數規格：
   - 跳躍初速 $V_{y0} = 240\text{ px/s}$
   - 重力加速度 $g = 600\text{ px/s}^2$
   - 跳躍頂點位移 $48\text{ px}$
   - 滯空時間 $0.80\text{ 秒}$（48 幀）
   - 大火圈安全穿越窗口 $Y \in [46, 118]$，具備 10 幀操作容錯裕度
5. [x] 物件池架構：通用實體物件池（`EntityPool<T>`）管理火圈、火壺與錢袋，消除執行期動態 GC 垃圾回收掉格

## 七、 Web Audio 8-bit APU 音效合成（Audio & Chiptune APU）
1. [x] 4 頻道晶片音訊合成架構：2 方波頻道（Pulse 1/2）+ 1 三角波頻道（Triangle）+ 1 白雜訊頻道（Noise）
2. [x] 零音訊檔案相依：所有波形與音效完全由 Web Audio API 於客戶端即時運算合成
3. [x] 符合現代瀏覽器自動播放政策：於使用者首次互動（點擊、觸控或按鍵）即時解鎖 `AudioContext`
4. [x] 背景音樂演繹：完整演繹公有領域經典名曲《American Patrol》（美國巡邏兵進行曲），配置前瞻排程（Lookahead）消除走音抖動
5. [x] 5 大類復古街機音效：跳躍滑頻、穿圈得分琶音、金幣錢袋鈴聲、受傷碰撞爆音、終點過關歡呼號角
6. [x] 獨立匯流排控制：具備 Master、BGM 與 SFX 獨立增益節點分流控制

## 八、 跨平台操控與視窗顯示（Controls & Viewport Compatibility）
1. [x] 鍵盤輸入相容：支援方向鍵與 WASD 雙鍵位（前後移動），空白鍵、W、Z、X、K 與向上鍵（跳躍），Enter 與 R（重新開始）
2. [x] 瀏覽器預設行為攔截：按鍵處理程序攔截方向鍵與空白鍵之預設頁面滾動行為
3. [x] 行動端虛擬觸控：配置後退按鈕（60x60 px）、前進加速按鈕（60x60 px）、跳躍圓形大按鈕（74x74 px），支援多點觸控
4. [x] 輸入狀態快照機制：提供確定性 `InputSnapshot`，支援持續輸入與邊緣觸發（`justPressed`）判斷
5. [x] 視窗失焦防護機制：監聽 `window.blur` 自動重置所有按鍵與觸控狀態，防止分頁切換後角色卡鍵失控
6. [x] 視窗適配：`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />`，CSS 配置 `aspect-ratio: 256 / 224` 與 `object-fit: contain`，確保畫面維持經典 256x224 像素比例無拉伸變形

## 九、 HUD 抬頭顯示與雙語本地化（HUD & Bilingual I18n）
1. [x] 頂部資訊看板：1UP 當前得分、HIGH SCORE 歷史最高紀錄（`localStorage` 本機持久化）、BONUS 5000 點線性時間衰減
2. [x] 底部狀態列：100 m 至 0 m 即時倒數距離面板、REST 剩餘生命圖示（初始 3 條生命）
3. [x] 狀態提示橫幅：Title、StageIntro、CharlieHit、StageCelebration、GameOver 狀態對應文字
4. [x] 雙語本地化實作：內建台灣繁體中文（`zh-TW`）與美式英文（`en-US`）40+ 組鍵值雙向鏡像對齊字典
5. [x] 語系動態切換：點擊右上角街機風格開關 `#btn-lang-toggle` 即時切換，純 DOM 局部節點更新，WebGL 畫布與 3D 場景零重建、零撕裂
6. [x] 雙重保障設計：橫幅採用大寫英文兼併中文顯示，完全相容既有自動化黑箱斷言

## 十、 品質防線與全量自動化測試回歸（Quality Gates & Test Regression）
1. [x] 全套件測試通過率 100%：40 個測試檔案，235 項測試案例全數通過（PASS），執行耗時 2.72 秒
2. [x] 單元與系統整合測試通過率 100%：9 個測試檔案，100 項測試案例全數通過
3. [x] 端到端 E2E 測試通過率 100%：31 個測試檔案，135 項測試案例全數通過，執行耗時 2.29 秒
   - Tier 1 核心功能黑箱測試：11 個模組，55 項測試案例通過
   - Tier 2 極值與邊界覆蓋測試：11 個模組，55 項測試案例通過
   - Tier 3 跨功能複合互動測試：5 個場景，16 項測試案例通過
   - Tier 4 真機遊玩情境測試：4 個情境，9 項測試案例通過
4. [x] 獨立審查機制：全專案歷經獨立審查員（Reviewer 1）、對抗性挑戰者（Reviewer 2）與法醫鑑識稽核員（Reviewer 3）三重裁決核准

## 十一、 發行審核結論與簽核意見（Sign-off & Conclusion）
Circus Charlie Web（v1.0.0）於功能完整性、經典街機手感還原度、3D 體素幾何呈現、程序化音效、跨平台輸入、程式碼純淨度、建置體積與全量自動化測試等各維度均達到最高標準。

- 阻塞缺陷（Blockers）：0
- 已知嚴重問題（Critical Bugs）：0
- 上線決策：**正式核准發行（APPROVED FOR PRODUCTION）**
