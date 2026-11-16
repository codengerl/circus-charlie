# 3D 體素美術規格書（3D Voxel Art Bible）：馬戲團跳火圈（Circus Charlie）

## 1. 視覺核心風格與設計原則
- **風格定位**：Retro 3D Voxel Art（復古 3D 體素立體方塊風格）。
- **核心設計語彙**：
  - 將 1984 年任天堂紅白機（FC/NES）與大型街機的 8-bit 平面像素精靈，等比例立體化為離散的 3D 立方體（Voxel Cubes）。
  - 嚴格承襲 NES 原生高飽和度色彩體系，拒絕現代過度模糊的次表面散射或寫實紋理。
  - 採用純程式化生成引擎（Three.js `BoxGeometry` 與 `InstancedMesh` / 階層式群組），達成 100% 零外部 3D 檔案相依。
  - 透過微角度投影（Micro-angle Orthographic）與定向日光陰影，展現體素立方體的側面厚度與幾何倒角立體感，同時完全確保 2D 橫向捲軸玩法的高對比與低判讀疲勞。

## 2. 經典 NES 色票對照表（Palette Mapping）
本專案嚴格遵循 `src/assets/pixel_palette.ts` 色票定義，嚴禁自創非標準色彩：

| 色彩常數名稱 | 十六進位色碼 (Hex) | RGB 數值 | 用途說明 |
|---|---|---|---|
| `BLACK` | `#000000` | (0, 0, 0) | 獅子鼻頭、瞳孔、輪廓邊緣 |
| `WHITE` | `#FCFCFC` | (252, 252, 252) | 查理領結、手套、馬戲團帳篷白條紋、里程碑立柱 |
| `GRAY` | `#7C7C7C` | (124, 124, 124) | 陰影結構體、金屬欄杆支架 |
| `LIGHT_GRAY` | `#BCBCBC` | (188, 188, 188) | 亮面過渡體素 |
| `CHARLIE_SKIN` | `#FCB4A4` | (252, 180, 164) | 查理面部膚色、觀眾皮膚 |
| `CHARLIE_RED` | `#D82800` | (216, 40, 0) | 查理經典燕尾服、跳台裝飾、帳篷紅條紋 |
| `CHARLIE_BLUE` | `#0040A0` | (0, 64, 160) | 查理禮帽、褲子 |
| `CHARLIE_HAIR` | `#885400` | (136, 84, 0) | 查理頭髮、鞋履 |
| `LION_ORANGE` | `#E45C10` | (228, 92, 16) | 獅子身體主要毛色、四肢、尾巴 |
| `LION_MANE` | `#743800` | (116, 56, 0) | 獅子雄厚鬃毛（深棕褐色） |
| `LION_BELLY` | `#FCBC3C` | (252, 188, 60) | 獅子腹部與下顎柔和暖黃色 |
| `FIRE_RED` | `#D82800` | (216, 40, 0) | 火焰外層高溫烈焰 |
| `FIRE_ORANGE` | `#FC7400` | (252, 116, 0) | 火焰中層燃燒橘色 |
| `FIRE_YELLOW` | `#FCBC00` | (252, 188, 0) | 火焰核心極高溫金黃色 |
| `POT_DARK_RED` | `#881400` | (136, 20, 0) | 地面火壺鑄鐵壺體基底 |
| `POT_HIGHLIGHT` | `#E45C10` | (228, 92, 16) | 火壺壺口與頸部高光反光 |
| `MONEY_BAG_BLUE` | `#008088` | (0, 128, 136) | 空中金幣錢袋天青藍緞面 |
| `MONEY_BAG_GOLD` | `#FCBC00` | (252, 188, 0) | 錢袋中心金幣標誌與跳台金飾邊 |
| `MONEY_STRING` | `#FCFCFC` | (252, 252, 252) | 錢袋束口封繩 |
| `TENT_BLUE` | `#0040D8` | (0, 64, 216) | 背景馬戲團帳篷深藍條紋、跳台階梯 |
| `TENT_WHITE` | `#FCFCFC` | (252, 252, 252) | 帳篷白色交替條紋 |
| `GROUND_BROWN` | `#885400` | (136, 84, 0) | 泥土跑道基底、階梯底座 |
| `GROUND_GREEN` | `#00A800` | (0, 168, 0) | 跑道綠色圍欄與草坪裝飾 |
| `HUD_WHITE` | `#FCFCFC` | (252, 252, 252) | HUD 標準文字 |
| `HUD_YELLOW` | `#FCBC00` | (252, 188, 0) | HUD 得分與 BONUS 強調數值 |

## 3. 體素網格解析度與模型構建尺寸規範
- **基本體素單位**：以 1 體素單元立方體為基準（視覺厚度 $D = 2 \sim 8\text{ 單位}$）。
- **實體模型拆解表**（涵蓋全部 9 大實體）：

### A. 查理騎手（Charlie Voxel Sprite）
- **總體尺寸**：寬 8 體素、高 18 體素、深 6 體素。
- **組件構成**：
  1. 藍色禮帽頂部：$5 \times 4 \times 4$（`CHARLIE_BLUE`），帽子帽沿：$7 \times 1 \times 6$（`CHARLIE_HAIR`）。
  2. 面部頭顱：$6 \times 5 \times 5$（`CHARLIE_SKIN`），五官眼部點綴（`BLACK`）。
  3. 燕尾服上身：$8 \times 7 \times 5$（`CHARLIE_RED`），前襟白色領結：$3 \times 2 \times 1$（`CHARLIE_WHITE`，置於 $Z = +2.6$）。
  4. 雙腿與褲子：左腿與右腿各為 $3 \times 6 \times 4$（`CHARLIE_BLUE`，分布於 $X = \pm 2$）。

### B. 坐騎雄獅（Lion Voxel Sprite）
- **總體尺寸**：寬 20 體素、高 14 體素、深 8 體素。
- **組件構成**：
  1. 軀幹主體：$20 \times 10 \times 8$（`LION_ORANGE`）。
  2. 腹部軟組織：$16 \times 3 \times 6$（`LION_BELLY`，置於腹底）。
  3. 前後四肢：4 隻獅爪各為 $3 \times 5 \times 3$（`LION_ORANGE`，分布於 $X = \pm 7, Z = \pm 3$）。
  4. 雄性鬃毛：$8 \times 12 \times 10$（`LION_MANE`，環繞頸部，呈現豐富體積厚度）。
  5. 獅頭與下顎：$5 \times 6 \times 6$（`LION_ORANGE`），黑鼻頭 $2 \times 2 \times 2$（`LION_NOSE`）。
  6. 翹起尾巴：$4 \times 3 \times 2$（`LION_ORANGE`，向後方微翹）。

### C. 大火圈（Big Fire Ring）
- **總體尺寸**：寬 20 體素、高 96 體素、深度分層前後各 2 體素。
- **2.5D 前後分層結構**：
  - 後半圈群組：位於 $Z = -4$，角色跳躍時位於查理後方。
  - 前半圈群組：位於 $Z = +4$，角色跳躍時位於查理前方，形成極具臨場感之穿透層次。
- **階梯火焰體素配置**：
  - 底部火焰（$Y: 32 \sim 46$）：底層外焰 $6 \times 8 \times 2$（`FIRE_RED`）、中層內焰 $4 \times 6 \times 2$（`FIRE_ORANGE`）、核心焰心 $2 \times 4 \times 2$（`FIRE_YELLOW`）。
  - 頂部火焰（$Y: 118 \sim 128$）：頂層外焰 $6 \times 8 \times 2$（`FIRE_RED`）、中層內焰 $4 \times 6 \times 2$（`FIRE_ORANGE`）、核心焰心 $2 \times 4 \times 2$（`FIRE_YELLOW`）。

### D. 小火圈（Small Fire Ring）
- **小火圈尺寸**：寬 20 體素、高 56 體素、深 4 體素（前後分層 $Z = \pm 3$）。
- **結構配置**：
  - 底火焰高 12 體素、頂火焰高 12 體素，中央保留 32 體素安全窗口。
  - 底部較窄火焰：$4 \times 6 \times 2$（$Z = \pm 3$）與中央 $3 \times 4 \times 4$（$Z = 0$）。
  - 頂部火焰：$4 \times 6 \times 2$（$Z = \pm 3$）與中央 $3 \times 4 \times 4$（$Z = 0$）。

### E. 獎勵金幣錢袋（Money Bag）
- **金幣錢袋尺寸**：寬 8 體素、高 8 體素、深 6 體素。
- **組件構成**：
  1. 束口袋主體：$8 \times 8 \times 6$（`MONEY_BAG_BLUE`）。
  2. 束繩結構：$6 \times 2 \times 5$（`MONEY_STRING`）。
  3. 荷葉袋口：$7 \times 2 \times 5$（`MONEY_BAG_BLUE`）。
  4. 金幣浮雕印記：$4 \times 4 \times 1$（`MONEY_BAG_GOLD`，凸出於正面 $Z = +3.1$）。

### F. 地面固定火壺（Ground Fire Pot）
- **總體尺寸**：寬 14 體素、高 20 體素、深 8 體素。
- **組件構成**：
  1. 壺身基座：$14 \times 4 \times 8$（`POT_DARK_RED`）。
  2. 壺腹圓弧：$12 \times 5 \times 7$（`POT_DARK_RED`）。
  3. 壺口金屬頸圈：$10 \times 3 \times 6$（`POT_HIGHLIGHT`）。
  4. 噴發火焰：基底 $8 \times 5 \times 4$（`FIRE_RED`）、中段 $6 \times 4 \times 3$（`FIRE_ORANGE`）、焰尖 $3 \times 3 \times 2$（`FIRE_YELLOW`）。
- **陰影規範**：所有網格節點開啟 `castShadow = true`。

### G. 0 m 終點跳台（Victory Podium）
- **總體尺寸**：寬 36 體素、高 14 體素、深 16 體素。
- **組件構成**：
  1. 底層棕色踏階：$36 \times 4 \times 16$（`GROUND_BROWN`）。
  2. 中層藍色階梯：$28 \times 5 \times 14$（`TENT_BLUE`）。
  3. 頂層紅色跳台：$22 \times 6 \times 12$（`RAILING_RED`）。
  4. 頂部金色收邊飾條：$20 \times 1 \times 10$（`MONEY_BAG_GOLD`）。

### H. 里程碑告示看板（Milestone Signboard）
- **總體尺寸**：寬 18 體素、高 24 體素、深 2 體素。
- **組件構成**：
  1. 白色支撐立柱：$3 \times 16 \times 2$（`RAILING_WHITE`）。
  2. 藍色距離看板：$16 \times 10 \times 2$（`TENT_BLUE`）。
  3. 紅色告示外框：$18 \times 12 \times 0.5$（`RAILING_RED`）。

### I. 背景大帳篷與看台觀眾席（Circus Tent & Bleachers）
- **馬戲團大帳篷**：置於遠景深度 $Z \in [-40, -35]$，由交替紅白藍長條體素方塊組成的拱形帳篷帷幔。
- **立體觀眾席**：置於中景深度 $Z \in [-30, -20]$，分為 3 層階梯式看台，散佈不同上衣顏色（紅、藍綠、綠色）與膚色面部的體素觀眾方塊。
- **立體跑道**：置於 $Z \in [-15, +15]$，地面頂層開啟 `receiveShadow = true` 接收角色與障礙物陰影。

## 4. 動畫影格矩陣（Animation Frame Matrix）
體素角色透過旋轉鉸鏈（Hierarchical Pivot Nodes）或交替置換網格達成復古 8-bit 動畫手感：

| 動畫狀態 | 影格數量 | 影格更新週期 | 肢體變形與姿態描述 |
|---|---|---|---|
| **奔跑動作 (Run)** | 3 幀循環 | 每 0.10 ~ 0.12 秒切換 | **Frame 1**：前腿前跨、後腿後伸、鬃毛自然挺立；查理直立端坐。<br>**Frame 2**：四肢向腹底微縮收攏、軀幹高度下沉 1 體素；鬃毛微擺。<br>**Frame 3**：四肢反向張開、尾巴微幅揚起；查理上半身微幅前傾。 |
| **跳躍起跳 (Jump)** | 1 幀定格 | 滯空期間全程維持 | 獅子前肢高舉仰起（向上傾角約 15°）、後肢向後筆直伸展；鬃毛因迎面氣流向後飄散；查理雙手緊握韁繩、身體微前傾。 |
| **受傷撞擊 (Hit)** | 1 幀定格 | 陣亡直到重生 | 獅子失去重心四腳朝天癱平於地面；查理禮帽向後掉落脫位、雙臂外攤呈大字形癱倒受傷狀。 |
| **通關歡呼 (Cheer)** | 2 幀交替 | 抵達終點每 0.2 秒循環 | 獅子穩坐於 0 m 跳台頂部；查理從獅背上站立起身，雙手朝天空高高舉起比出勝利姿勢，禮帽高舉揮舞慶祝。 |

## 5. 攝影機微角度與光影陰影架構（Camera & Lighting）
### A. 微角度正交攝影機配置
- **投射模式**：`THREE.OrthographicCamera`（保持 2D 精準無透視形變橫向捲軸玩法）。
- **可視視口邊界**：
  - Left: -128, Right: +128, Top: +112, Bottom: -112, Near: 0.1, Far: 1000。
- **鏡頭微角度定位**：
  - 鏡頭座標：`position.set(128, 124, 120)`（$Y = 112 + 12$）。
  - 瞄準焦點：`lookAt(128, 112, 0)`。
  - 視角俯仰角（Pitch Angle）：$\theta = \arctan(12 / 120) \approx 5.71^\circ$。
  - 視覺成效：使正對畫面的體素方塊頂面顯露約 10% 的立方體斜向立體厚度，呈現精靈方塊模型手感，且水平 $X$ 軸與垂直 $Y$ 軸無任何非線性形變。

### B. 體素光照與陰影配置
- **環境光（AmbientLight）**：
  - 規格：`new THREE.AmbientLight(0xffffff, 0.60)`。
  - 目的：提供充足全局漫射照明，防止體素背光面過暗死黑，確保暗部色票依然忠實呈現。
- **定向日光（DirectionalLight 帶陰影）**：
  - 規格：`new THREE.DirectionalLight(0xfff8e7, 1.20)`（微溫暖日光色調）。
  - 名稱：`SunLight`。
  - 光源位置：`position.set(50, 100, 50)`，斜向照射地面基準點。
  - 投影設定：
    - `castShadow = true`。
    - 陰影貼圖解析度：`shadow.mapSize.width = 512`, `shadow.mapSize.height = 512`。
    - 陰影偏置量（Bias）：`-0.0005`（避免自體陰影粉刺 Acne）。
- **材質渲染設定**：
  - 材質類型：`THREE.MeshStandardMaterial`。
  - 粗糙度：`roughness = 0.8`、金屬度：`metalness = 0.1`。
  - 陰影類型：`THREE.PCFSoftShadowMap`（軟陰影邊緣）。
