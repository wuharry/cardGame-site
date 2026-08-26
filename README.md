# 卡牌對決 CardGame Demo — 官方網站

《卡牌對決》的介紹與下載頁。Next.js 16 + TypeScript + Tailwind v4。

遊戲本體在 `e:/Game/card-game-demo(4.5)`（Godot 4.5）。這個 repo 只放網站，
刻意獨立於遊戲專案之外——否則 `node_modules` 會被 Godot 的 FileSystem 掃進去。

---

## 跑起來

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm start
```

---

## 常見修改

### 換下載連結（最常改的）

檔案：[src/data/releases.ts](src/data/releases.ts)

1. 把 `RELEASE_BASE` 填成實際存放安裝檔的網址（GitHub Releases / itch.io / 自架）。
2. 把該平台的 `status` 改成 `"available"`，並填上 `version` / `size` / `updated`。

`RELEASE_BASE` 是空字串、或 `status` 不是 `available` 時，按鈕會顯示成
「建置中 / 規劃中」，不會產生死連結。

**新增平台**就是往 `BUILDS` 加一筆，版面自己長出來，不用動 component。

### 改更新紀錄

同一個檔案的 `RELEASE_NOTES`，最新的排最前面。

### 改遊戲規則的敘述

檔案：[src/data/game.ts](src/data/game.ts)。五條路線的推演步驟、五種卡型、
規則帳、對戰模式、戰場、陣容全部在這裡。**版面吃資料，改數字不用改版面。**

---

## 素材怎麼來的

`public/media/` 底下的圖**全部是實際執行遊戲擷取的**，沒有示意圖、沒有抽象裝飾。

- `screens/` — 用遊戲專案 `tests/` 裡的截圖工具拍的：
  - `tests/screenshot_clean.gd` — 跑戰場、召喚幾隻，然後把 UI 圖層與 3D 文字標籤
    全部藏起來再拍。首屏與戰場帶用這支（遊戲自己的 HUD 文字會跟網站文字打架）。
  - `tests/screenshot_town.gd` — 主選單的城鎮背景，同樣藏掉選單 UI。
  - `tests/screenshot_arena.gd` — 帶 UI 的完整遊戲畫面。
- `cards/` — 卡池的真實卡圖，來自遊戲的 `assets/ui/card_art/`。

重新匯入／壓縮：

```bash
node scripts/import-assets.mjs
```

> 換過 `public/media/` 的圖之後，`next/image` 的最佳化快取會留著舊的。
> 本機驗證前先清：`rm -rf .next/cache/images`。

### 拍網站截圖驗版面

```bash
npm run build && npx next start -p 3100
node scripts/shoot-top.mjs      out/                 # 首屏、戰場帶、陣容
node scripts/shoot-sections.mjs out/ 1440 900 desk   # 各段落
node scripts/shoot.mjs          out/                 # 含五條路線的逐步推演
```

用本機安裝的 Chrome（playwright-core，不另外下載瀏覽器）。

---

## 設計系統

全部集中在 [src/app/globals.css](src/app/globals.css) 的 `@theme`，來源是遊戲本身：

| 角色 | 值 | 為什麼 |
|---|---|---|
| 地 | `--color-ink` `#0d0b09` | 暖調暗木，不是純黑 |
| 字 | `--color-parchment` `#e8dec8` | 羊皮紙，不是白 |
| 主色 | `--color-brass` `#c8a23c` | 卡框、魔力、我方陣線 |
| 輔助色 | `--color-crimson` `#b0362b` | 伏印警戒、攻擊、危險 |
| 敵方 | `--color-steel` `#667281` | 中性冷色，只用來分敵我 |

字體：`Cinzel`（銘刻感，只給徽標與段落編號）、`Noto Serif TC`（遊戲自己的明體，
標題與中文）、`Barlow` / `Barlow Condensed`（內文與 HUD 數值）。

**圓角刻意清掉 Tailwind 的預設**（`--radius-*: initial`），只留 `0 / 2px / 3px`，
逼每一處自己決定——這裡的東西是金屬板、卡牌、規則書，不是 SaaS 卡片。

材質靠 `.plate`（內陰影模擬受光的金屬板）、`.card-frame`（雙線印刷邊）、
`.notch`（切角）、`.grain`（紙／石顆粒）。全站只有一處大面積漸層：`.vignette`，
它模擬鏡頭暗角，不是裝飾。

動作只有三個，每個都對應一條遊戲規則：`.ward-alert`（伏印埋設後的紅色脈動）、
`.animate-mana-fill`（魔力每回合 +1、上限 10）、`.animate-card-play`（卡片落到卡槽）。

---

## 版面

段落順序照玩家的認知順序排，每一段回答一個問題——不為了填版面加段落。

| # | 段落 | 回答什麼 |
|---|---|---|
| I | 入口 | 這是什麼、怎麼拿 |
| II | 五條路線 | 它跟別的卡牌遊戲差在哪 |
| III | 五種卡型 | 牌組裡有什麼 |
| IV | 規則帳 | 一回合能做多少事 |
| V | 戰場與陣容 | 打起來長什麼樣、有誰 |
| VI | 對戰模式 | 跟誰打 |
| VII | 下載 | 怎麼拿到 |
| VIII | 更新紀錄 | 改了什麼 |

只有兩個 client component，各自只有一個真的 state：

- `LaneDoctrine` — 捲到第幾步（IntersectionObserver）
- `CardTypeShowcase` — 伏印翻開沒有

其餘都是 Server Component，動畫走 CSS。沒有裝 Framer Motion。

### 手機版不是把桌機版壓扁

五條路線在桌機是五個直欄（敵方在上、我方在下），在手機翻成五個橫列
（我方在左、攻擊往右推）。同一份 DOM，靠 `flex-col-reverse` 翻軸，不複製版面。
