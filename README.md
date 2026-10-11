# 暮色秘典 Twilight Codex — 官方網站

《暮色秘典》的介紹與下載頁。Next.js 16 + TypeScript + Tailwind v4。

遊戲本體在 `E:/card-game-demo(4.5)`（Godot 4.7）。目前網站玩法與雙人大廳文案依 canonical 專案 **2026.10.11-R4 / protocol 13** 核對；實際可下載版本以 `src/data/releases.ts` 為準。歷史戰場與卡圖仍保留 R3 匯入來源。這個 repo 只放網站，
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

1. 把驗證過的 Windows 匯出資料夾完整壓成版本化 ZIP，上傳到公開 GitHub Release 的附件。不要使用 GitHub 自動附的 Source code ZIP，也不要把大型遊戲包放入網站 `public`。
2. 把 `RELEASE_BASE` 填成該次版本的 HTTPS 附件目錄，例如 `https://github.com/<owner>/<releases-repo>/releases/download/<tag>`；`file` 必須與附件檔名相同。
3. 填入真實的 `version` / `size` / `updated` / `sha256`；先確認同一份 ZIP 解壓、啟動成功，並核對公開附件的檔名與 SHA-256，再把 Windows 的 `status` 改成 `"available"`。網站部署後，另驗收正式下載連結；換版仍需重新執行這些檢查。

`RELEASE_BASE` 是空字串、不是有效 HTTPS 網址、或 `status` 不是 `available` 時，不會產生下載連結。
首頁、下載按鈕與狀態欄都使用同一個判定。目前 Windows 下載資料已切到 R4，其餘平台「尚未提供」。[R4 Windows 試玩版 Release](https://github.com/wuharry/twilight-codex-downloads/releases/tag/v2026.10.11-r4) 的 ZIP 與檢查碼附件已公開發布，下載按鈕使用該版本的固定附件網址。

目前成品是 `TwilightCodex-Windows-20261011-R4.zip`，版本 `2026.10.11-R4 / protocol 13`，大小 **611,548,015 bytes（583.2 MiB）**，SHA-256 為 `14243c2f1b5e397fdc468c335252f39e709ca25bcd7c8c53ef47c02d290b8f48`。完整解壓後執行 `TwilightCodex.exe`。

R4 附件網址：[Windows ZIP](https://github.com/wuharry/twilight-codex-downloads/releases/download/v2026.10.11-r4/TwilightCodex-Windows-20261011-R4.zip)；[SHA-256 檢查碼](https://github.com/wuharry/twilight-codex-downloads/releases/download/v2026.10.11-r4/TwilightCodex-Windows-20261011-R4.zip.sha256)。本機 ZIP 的 CRC 與內含 EXE 的 SHA-256 已核對，Windows EXE 與伺服器 PCK 的封裝資源檢查各通過 293 項；公開 GitHub API 的附件大小與 SHA-256 也一致。尚未完整重新下載公開 ZIP，亦未完成兩個正式 JWT 帳號的真人對局，不能把封裝檢查當成這兩項驗收。

GitHub 私有 repo 的附件也需要權限。給朋友免登入下載時，可另外建只放發佈檔的公開 repo，不必公開遊戲原始碼。
建議使用固定版本的附件網址，避免 `latest` 換版後，網站上的版本與檔案不一致。

```powershell
Get-FileHash -LiteralPath '完整路徑\TwilightCodex-Windows-20261011-R4.zip' -Algorithm SHA256
```

**新增平台**就是往 `BUILDS` 加一筆，版面自己長出來，不用動 component。

### 改更新紀錄

同一個檔案的 `RELEASE_NOTES`，最新的排最前面。這裡是程式開發進度，不代表那些變更已經包含在可下載執行檔。

### 改遊戲規則的敘述

檔案：[src/data/game.ts](src/data/game.ts)。四路前後排的推演步驟、六種卡型、
規則帳、收藏與組牌、對戰模式、戰場、陣容全部在這裡。**版面吃資料，改數字不用改版面。**
目前依 R4 專案核對：Godot 4.7、244 種正式卡、21 種衍生物或形態、連線協定 13。六種卡型包含結界（Domain），每側最多一張，不佔從者卡槽，新結界替換舊結界並令舊卡入墓。

新建玩家先完成 150 次新手抽卡，再用持有卡自組合法六十張、每卡最多三張，保存並選用後進入單人。19 副內部預組只供 AI 使用，不是玩家可選範本；既有收藏不重置。

正式真人 PvP 正常勝出後，勝者從敗者本局起始牌組挑一張，勝者收藏 +1、敗者實際 −1；勝者已持有三張不能領。有可領戰利品要先處理才能開始下一場。AI、區網與訪客練習不列正式戰績；正式對戰開賽後離開或斷線會記敗，但不產生奪卡戰利品。

正式外網需要帳號持卡驗證與相容的專用伺服器。R4 線上大廳提供連線玩家數、即時公開等待房及雙人準備流程。人數合併已握手的大廳玩家與已進入戰鬥房的玩家，不重複計算；轉場期間尚未接上戰鬥連線時可能短暫下降。公開列表只列等待房，滿兩人禁止加入，私人房碼不公開；已在房內可查看其他房，須先離房再加入。真人帳號與完整正式對局的驗收結果需另留證據，本機啟動成功不能替代。

### 建議部署方式

網站使用 Vercel 的 Next.js 預設建置；遊戲 ZIP 放 GitHub Releases，下載按鈕直接導向附件，不經過網站 API 轉送。
網站與遊戲檔可各自更新。參考 [Vercel 的 Next.js 部署](https://vercel.com/docs/frameworks/full-stack/nextjs)、[GitHub Release 附件連結](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases)。

分享預覽圖的網址會優先使用部署設定 `SITE_URL`，在 Vercel 也會自動使用正式網域；其他主機請設定 `SITE_URL` 為網站的完整 HTTPS 網址。
本機預設為 `http://localhost:3100`。網站部署與遊戲附件發布分開驗收；本 README 不作為線上狀態公告。

### 部署紀錄（2026-10-11）

R4 遊戲來源 commit 為 `386776742db463c553758414252e96fdbb1bfca5`；Windows ZIP、Server TAR.GZ 及兩份檢查碼已於 `v2026.10.11-r4` 公開發布。下載檔名、大小與 SHA-256 見上方下載段落，匿名 GitHub API 已核對四個附件的名稱、上傳狀態與兩份遊戲包的 digest。

Google Cloud 既有伺服器於 2026-10-11 09:57:43 UTC 更新成功，線上 PCK SHA-256 為 `fec51a5cfee27d1814f7660adc58109c7d56b3849d02ed2453f5d418543cc1ac`，更新前備份位於 `/opt/card-game-server-backups/20261011T095741Z-35159`。公開外網大廳檢查通過 11 項；完整兩個正式帳號的真人對局仍為 NOT RUN。

網站由 `wuharry/cardGame-site` 的 `main` 推送觸發既有 Vercel 正式部署。正式下載區必須另核對 R4 版本、583.2 MiB、SHA-256 與完整 ZIP 網址，不能只看建置完成。R4 證據保存在遊戲專案 `build/release-r4/` 的 `release-api-verification.json` 與網站正式驗收紀錄。以下保留 R3 的歷史部署紀錄。

正式網址是 [twilight-codex.vercel.app](https://twilight-codex.vercel.app/)，既有 Vercel 專案為 [twilight-codex](https://vercel.com/wuharrys-projects/twilight-codex)。首版使用 Chrome 的 Vercel 檔案上傳流程部署，當時已驗收桌機、手機版與四路教學互動。

本輪已透過 GitHub 網頁更新公開的 [網站來源 repo](https://github.com/wuharry/cardGame-site) `main`，包含 R3 規則、素材、公開 Windows 下載網址與維護說明。首個 Git 正式部署使用 commit `3bd1fa12719e8a4f54dda9f674ad204e21fe8f95`；後續新增 GitHub 版本頁連結及完整 ZIP 檔名指引，目前正式部署使用 commit `1f2dc436b4ab92705c0682d44839d83784a695b0`。遊戲附件使用獨立的 [twilight-codex-downloads](https://github.com/wuharry/twilight-codex-downloads) repo，未上傳遊戲原始碼。

既有 Vercel 專案已連接 `wuharry/cardGame-site`，並確認 `main` 提交可自動觸發正式部署。最新 deployment `dpl_CNdyNz5KeR6JtHXQmZyaiqHww4QA` 在 Vercel 顯示 `Ready / Production`，[本次固定部署網址](https://twilight-codex-5ryacvlwf-wuharrys-projects.vercel.app/) 可供追溯。正式網址重新載入後，R3 ZIP 下載連結、新增的 GitHub 版本頁連結及完整檔名指引均可見；版本、大小、SHA-256 與 ZIP 附件網址一致。先前 deployment `dpl_TpzU5YXmeqZphfpXsY5YXbo9myv4` 保留為歷史部署。

R3 公開 ZIP 已透過匿名 CLI 完整下載並驗證。下載檔為 **611,672,435 bytes**，SHA-256 為 `b4807044b0e40b33b681c1e625270b0805e573b70e2e4189ca2d57da8803aa2f`，與發布包一致；ZIP CRC 檢查與完整解壓 19 個檔案均通過。下載包內 `TwilightCodex.exe` 的 SHA-256 為 `4104ade949d1e0ac1589bf7580da349506afa42e3a91cf4c6b4ec1d501fdcc7b`，亦與原發布 EXE 相符。

此電腦的 Chrome 人工下載、完整解壓與執行已通過：使用者從官網點擊下載，完成後親手啟動，回報「正常進入主選單」。首輪 Chrome 下載檢查碼曾在 `release-assets.githubusercontent.com` 出現 `ERR_BLOCKED_BY_CLIENT`，自動化下載等待也未完成；這些保留為歷史限制，後續匿名 CLI 完整下載與使用者人工啟動均已成功。朋友其他電腦的下載與執行仍為 `NOT RUN`。

公開下載包的一般 GUI 啟動驗證為 `PASS`。未啟用 Movie Maker，執行 600 frames 後 exit code 為 0，零 ERROR、零 WARNING；EXE SHA-256 在執行前後一致，且隔離的新訪客資料確實產生 `guest_profile.cfg`。證據為下述公開下載 QA 資料夾內的 `normal-gui-verification.json`；headless 啟動亦為 exit code 0、沒有 ERROR。

Godot Movie Maker 的退出清理錯誤尚未處理，嚴格錄影 QA 總報告保留 `FAIL`。錄影雖成功擷取 30 張主選單畫面，退出 stdout 仍有 4 筆 ObjectDB 警告與 1 筆 `resources still in use` ERROR；一般 GUI 啟動沒有重現這些訊息，不能因此將錄影 QA 改為通過。真人連線與完整對局仍為 `NOT RUN`。

公開下載驗證的完整證據位於 `E:\card-game-demo(4.5)\build\windows-zip-20261011-1244\qa\public-download-20261011-01`。網站畫面證據為下述 QA 資料夾內的 `website-download-live.jpg`。

後續提交並 push 網站變更到 `main` 會觸發 Vercel 建置；只改本機檔案不會更新網站。每次發布都要確認 Vercel 顯示 `Ready`，再到正式網址驗收新版內容與下載連結。

換遊戲版本時，先在下載 repo 發布新的版本附件，再修改網站的 `src/data/releases.ts` 並部署。只上傳新 Release 不會自動更換網站的固定版本網址；例如本輪指定 `v2026.10.11-r3`，日後仍會下載 R3，直到網站資料更新。

來源清單、部署識別與驗收截圖保存在 `E:\card-game-demo(4.5)\build\windows-zip-20261011-1244\qa`。其中 `frontend-deployment.json` 保留首版檔案上傳部署，`release-deployment.json` 記錄本輪公開 Release、Git 自動部署與下載驗收限制。本輪未執行本機 git commit 或 push；上述網站來源提交由 GitHub 網頁完成。本段最終驗收補記僅更新本機 README，未再公開提交。

---

## 素材怎麼來的

`public/media/screens/` 是實際遊戲截圖，`cards/` 是遊戲卡牌資源。來源與 SHA-256 見 [匯入清單](public/media/import-manifest.json)。

- 首頁與森林使用四路戰場的原生驗收截圖；主選單為 R3 Windows 解壓包的實際新玩家畫面。
- 洞窟使用 R3 Windows 解壓包的四路實際單人對局；冰原仍使用較早五路場景預覽，網站已明示配置以四路教學為準。
- 卡圖依 R3 快照 `data/cards/*.tres` 的 `art` 引用匯入，包含「妖精之森」結界。網站圖示沿用遊戲的 `assets/ui/twilight_codex.svg`。
- 城鎮無 UI 背景保留既有素材；匯入清單註記來源限制。

重新匯入／壓縮：

```bash
node scripts/import-assets.mjs "E:\card-game-demo(4.5)\build\windows-zip-20261011-1244\source" --cards-only --menu "E:\card-game-demo(4.5)\build\windows-zip-20261011-1244\qa\gui-fresh-main-menu.jpg" --caverns "E:\card-game-demo(4.5)\build\windows-zip-20261011-1244\qa\gui-singleplayer-turn3.jpg"
```

可把參數換成其他遊戲 checkout。`--cards-only` 更新卡圖並保留有來源清單的截圖，適用不含 `docs` 的封版快照；`--menu` 與 `--caverns` 指定已驗證的新畫面。省略選項時，完整 checkout 會依腳本列出的 QA 路徑匯入歷史截圖。腳本會從本機 Git LFS cache 解析尚未展開的圖片，缺檔時清楚失敗，不自動下載或改寫遊戲資源。
網站會把匯入清單中的圖片 SHA-256 加到圖片網址；內容變更後就會要求新版圖片，無需手動刪除 Next/image 快取。
如果開著開發伺服器，匯入完請重新整理預覽。

### 拍網站截圖驗版面

```bash
npm run build && npx next start -p 3100
node scripts/shoot-top.mjs      out/                 # 首屏、戰場帶、陣容
node scripts/shoot-sections.mjs out/ 1440 900 desk   # 各段落
node scripts/shoot.mjs          out/                 # 含四路戰場的逐步推演
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
| II | 四路前後排 | 站位與攻擊目標如何決定 |
| III | 六種卡型 | 牌組裡有什麼 |
| IV | 規則帳 | 一回合能做多少事 |
| V | 收藏與組牌 | 如何建立自己的牌組 |
| VI | 戰場與陣容 | 打起來長什麼樣、有誰 |
| VII | 對戰模式 | 跟誰打 |
| VIII | 下載 | 怎麼拿到 |
| IX | 開發更新 | 程式最近改了什麼 |

只有兩個 client component，各自只有一個真的 state：

- `LaneDoctrine` — 捲到第幾步（IntersectionObserver）
- `CardTypeShowcase` — 伏印翻開沒有

其餘都是 Server Component，動畫走 CSS。沒有裝 Framer Motion。

### 手機版不是把桌機版壓扁

四條路線在桌機與手機都保留雙方前後排，並用框線與說明標示攻擊者、目標和保護關係。
桌機可捲動或按步驟；手機按步驟顯示對應說明，棋盤不固定覆蓋文字。
卡牌數值依目前 `.tres` 資料，嘲諷示範使用具有該關鍵字的重甲斧兵。
