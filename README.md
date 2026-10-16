# 王牌戰線 Deckmarch — 官方網站

《王牌戰線 Deckmarch》的介紹與下載頁。Next.js 16 + TypeScript + Tailwind v4。

遊戲本體使用 Godot 4.7.2；本機來源為 `E:\card-game-demo(4.5)`。各平台目前可取得的版本、大小、校驗碼與原生驗證限制，以 `src/data/releases.ts` 的 `BUILDS` 為準。下載 UI 依實際可用成品列出平台，不因加入 Linux／Android 說明就宣稱已有下載包；iPhone 暫未提供安裝入口。

網站只放介紹、下載資料與 WebP 預覽。大型遊戲 ZIP／APK 放公開 GitHub Releases，勿加入 `public/`。網站卡圖與原生場景截圖的實際來源及擷取版本，保存在 `public/media/import-manifest.json`；改下載 UI 不會更新圖片或宣稱重拍。

### 2026-10-16 官網圖片同步

目前主選單、首頁戰場、森林／洞窟／冰原與封面背景均已換成 R11 來源 `9ffbfd47` 的原生擷取。擷取日期為 2026-10-16，平台 macOS／Forward+、1280×720；戰場使用六名從者與六張手牌的展示配置，沒有當成真人自然對局或 Android 驗收。主選單背景換為目前遊戲使用的天文台畫作；英雄保留 HD-2D，場上仍是四路前後排。

R11 版本名與附件 tag 沿用 `2026.10.15-R11`／`v2026.10.15-r11`；GitHub 的 `published_at` 為 `2026-10-16T00:56:14Z`，即台灣 10/16 08:56，因此桌面下載更新日期與 R11 公開更新紀錄標為 10/16。版號、BUILD、最低連線版本、附件與檢查碼不因官網更新而更動。Android 仍未開放。

之後先在隔離 Godot 專案使用 `scripts/capture-game-media.gd`（外部 `--script` 路徑）產出六張 PNG 與 `capture-manifest.json`，再同步：

```bash
node scripts/import-assets.mjs <game-path> --screens-dir <capture-directory>
```

擷取工具使用背景 SubViewport、暫存帳戶與關閉的匿名回報；隔離專案的 `application/config/version` 應先透過 Godot API 對齊 `ReleaseInfo.VERSION`。普通匯入或 `--cards-only` 會保留已部署場景圖及其來源清單，不再從寫死的舊 QA 圖回填。圖片網址沿用內容雜湊，更新後 Next/image 與瀏覽器會取得新圖。

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

1. 將各平台經驗證的玩家包上傳到固定版本的公開 GitHub Release。Windows／macOS／Linux 使用完整 ZIP，Android 使用可安裝 APK；不要把匯出專案或 GitHub 自動附的 Source code ZIP 當成玩家包，也不要把大型檔案放入網站 `public`。
2. 把 `RELEASE_BASE` 填成該次版本的 HTTPS 附件目錄，例如 `https://github.com/<owner>/<releases-repo>/releases/download/<tag>`；`file` 必須與附件檔名相同。
3. 填入真實的 `version` / `bytes` / `size` / `updated` / `sha256` / `build` / `minimumBuild` / `protocol`，核對公開附件檔名、位元組數與 SHA-256 後，才將對應平台的 `status` 改成 `"available"`。`requirement`、`note` 與 `noteEn` 分別說明系統需求、簽章及實際驗證範圍；沒做原生裝置測試就保留未測說明。網站部署後另驗收正式下載連結。

`RELEASE_BASE` 是空字串、不是有效 HTTPS 網址、或 `status` 不是 `available` 時，不會產生下載連結。
首頁平台清單、SEO、下載按鈕與安裝說明共用 `downloadUrl()` 的可用判定。`planned`／`preparing` 平台不產生下載連結，也不顯示可安裝的承諾；各平台可用 `releaseBase` 保留不同 tag 的真實成品。Windows 相容模式、macOS 未公證、Linux 執行權限與 Android 安裝來源分開說明，不把 APK 當 ZIP。

`src/data/game-version.ts` 從同一份 `BUILDS` 產生 schema 1 更新資料，`src/app/api/game-version/route.ts` 提供 `/api/game-version` 並保留 `Cache-Control: no-store`。只有完整可用 metadata 才進 API；`build` 必須遞增，`minimumBuild` 不大於 `build`，公開 JSON 的 UTF-8 大小須不超過遊戲更新器的 16 KiB 限制。增加平台也需同步遊戲端 `platform_id()` 與固定來源的檔名格式驗證。線上最低版本只在需要阻擋舊客戶端時調高，不能因 UI 換版隨意更動。

GitHub 私有 repo 的附件也需要權限。給朋友免登入下載時，可另外建只放發佈檔的公開 repo，不必公開遊戲原始碼。
建議使用固定版本的附件網址，避免 `latest` 換版後，網站上的版本與檔案不一致。

```powershell
Get-FileHash -LiteralPath '完整路徑\本次版本的Windows包.zip' -Algorithm SHA256
```

**新增平台**時，先在 `BUILDS` 記錄真實成品。既有 Windows／macOS／Linux／Android 會自動產生平台入口與對應安裝說明；新增其他平台時，另核對 `download-panel.tsx` 的安裝方式。iOS 匯出專案不等於玩家可安裝版本，沒有有效發行管道時不可放可點擊的下載連結。

目前 Linux 玩家模板在 Ubuntu 24.04 編譯，最低需要 x86_64 與 glibc 2.39；平台需求應寫明 Ubuntu 24.04 或以上，或其他使用 glibc 2.39 或以上的發行版。

Android 目前作為預覽版提供，本次支援基準為 Android 9 或以上與 arm64。此 R9 成品 APK 已用 `aapt` 核對 manifest：`minSdkVersion=24`、`targetSdkVersion=36`，並通過 APK v2／v3 簽章檢查。Android 7／8 不列入本次支援承諾；實機安裝、啟動與觸控驗收均未執行。長按卡牌 0.5 秒開啟完整說明是本次新增操作，不能由封裝檢查推定已在手機驗收。

Android 已知匯出圖示資源警告仍保留，profile 初始化可能略過，實際影響待實機驗證。系統需求與支援基準不代表原生驗收已通過；`note`／`noteEn` 必須分別保留 Windows 最終 ZIP 解壓後本機啟動通過、macOS／Linux／Android 原生驗收未執行，以及朋友電腦和真人外網對局未測的限制。

Android 下載卡直接連到同一份官方 APK，並提供明顯的「安裝教學」入口 `/install/android`。教學從 `BUILDS` 讀取目前版本、檔名、大小、需求與校驗碼，不另外硬寫版本；步驟是下載完成後到 Chrome「下載」或檔案管理員 Downloads 開啟 APK，再由 Android 安裝。沒有自動跳出安裝畫面和系統拒絕安裝分開處理，不要求關閉 Play 安全防護或解除安裝既有遊戲。

下載頁與教學使用伺服器呈現的文字和原始附件連結，不以網站 API／`fetch`／Blob 轉送大型 APK，也不顯示猜測的下載進度、完成狀態或自動安裝承諾。四平台的長篇驗收說明及 SHA-256 放在可展開區塊，系統需求、版本、大小與下載動作仍直接顯示。網站 UX 改善不代表 GitHub 附件傳輸已加速；下載速度需另以實際檔案傳輸驗證。

CDN 尚未開通；已整理[下載傳輸方案](docs/download-delivery-plan.md)，包含 R2 正式網域鏡像、GitHub 備援、遊戲內更新網址限制與部署驗收。涉及網域、帳號、開通或費用時，先取得使用者對具體方案的同意。

發布前保留 `/admin` 的匿名遊玩統計、正式帳號權限與 OTP 安全檢查，以及 `public/licenses/`、製作群頁和既有安全 headers。驗證命令：

```bash
node scripts/test-game-version.mjs
node scripts/test-android-install-guide.mjs
node scripts/test-admin-api.mjs
node scripts/test-play-analytics.mjs
npm run lint
npm run build
```

歷史 R4／R5 的包體與驗收紀錄保留於下文，不代表目前各平台的下載版本或本輪已完成的測試。

### 改更新紀錄

同一個檔案的 `RELEASE_NOTES`，最新的排最前面。這裡是程式開發進度，不代表那些變更已經包含在可下載執行檔。

### 改遊戲規則的敘述

檔案：[src/data/game.ts](src/data/game.ts)。四路前後排的推演步驟、六種卡型、
規則帳、收藏與組牌、對戰模式、戰場、陣容全部在這裡。**版面吃資料，改數字不用改版面。**
本輪文案使用 Godot 4.7、244 種正式卡、21 種衍生物或形態與連線協定 16。六種卡型包含結界（Domain），每側最多一張，不佔從者卡槽，新結界替換舊結界並令舊卡入墓。

新建玩家有 150 張免費新手額度，以每包五張顯示為 30 包，可逐步領取並保留零散剩額；額度未用完也能從主選單用持有卡組牌與保存草稿。完整合法六十張、每卡最多三張且持有量足夠，保存並選用後即可對戰，不必抽完額度；普通卡包仍須等額度歸零才開放，每日券照常累積。19 副內部預組只供 AI 使用，既有收藏不重置。

組牌畫面固定顯示目前卡牌的完整效果，懸停、鍵盤聚焦與選取都能閱讀；牌組清單選卡先顯示效果，另按「移除一張」或 Delete 移除。骰子改用六面像素風 3D 演出，顯示翻滾、彈跳、停穩、原始與最終點數及最終六點爆擊；減少動態直接顯示停穩結果。PvE 不限時；連線真人 PvP 每回合 100 秒，最後 15 秒倒數；逾時停止接受新操作，現有效果結算完成後自動結束回合。需要回應的選擇視窗自開啟起有 20 秒，逾時採用預設選項。本機 R5 封裝資源檢查已涵蓋骰子與計時，不能推定完整公網真人對局已通過。

10 月 13 日遊戲下載包更新 112 張卡圖；網站以既有 `import-assets.mjs --cards-only` 重新同步 23 張預覽資源，其中 9 張 WebP 內容變更。場景截圖仍保留原擷取版本，網站不是完整卡池圖鑑。

正式真人 PvP 正常勝出後，勝者從敗者本局起始牌組挑一張，勝者收藏 +1、敗者實際 −1；勝者已持有三張不能領。有可領戰利品要先處理才能開始下一場。AI、區網與訪客練習不列正式戰績；正式對戰開賽後離開或斷線會記敗，但不產生奪卡戰利品。

正式外網需要登入、同步帳號收藏、選用合法持有的六十張牌組及相容的專用伺服器。本機訪客可瀏覽大廳；開房與加入停用時會顯示登入原因和「電子郵件登入」入口，未選牌組則可直接打開組牌。雲端收藏不透過 ENet 傳送，由主選單提供實際收藏與牌組的就緒原因，正式 HTTPS 入場券仍由帳號服務驗證。待確認抽卡與同步中分別提示，不誤稱必須抽完 150 次新手額度。

大廳保留連線玩家數、即時公開等待房及雙人準備流程。人數合併已握手的大廳玩家與已進入戰鬥房的玩家，不重複計算；轉場期間尚未接上戰鬥連線時可能短暫下降。公開列表只列等待房，滿兩人禁止加入，私人房碼不公開；已在房內須先離房再加入。正式 Supabase 已套用第 6 份 `20261011_account_deck_unlock.sql`，後檢 9 項通過：移除抽完新手額度的門檻，保留登入身分、合法持有牌組、待領獎勵與 RPC 權限檢查。證據位於遊戲專案 `build/r5-production/sql/summary.json`；不要重跑既有 installer 或重設玩家資料。10 月 13 日客戶端與正式伺服器已同步使用 protocol 16；真實 JWT 與完整正式對局結果仍需獨立驗收。

本輪來源回歸：帳號 SQL 隔離 PostgreSQL 67 項通過；多人 UI headless 46 項、原生 Forward+ 54 項（8 張 1280×720 截圖）、房間流程 15 項、網路選單 32 項、主選單收藏整合 48 項通過，完整 engine／stdout 無 ERROR 或 WARNING。測試只用隔離 profile、合成帳號服務與 loopback，不建立正式測試房；不能代替 R5 成品、真實 JWT 與公網雙人對局驗收。登入入口實際開啟電子郵件面板，合法持有六十張且剩 49 抽可按鈕開房，證據在遊戲專案 `build/room-create-20261011/`。

### 建議部署方式

網站使用 Vercel 的 Next.js 預設建置；遊戲 ZIP／APK 放 GitHub Releases，下載按鈕直接導向附件，不經過網站 API 轉送。
網站與遊戲檔可各自更新。參考 [Vercel 的 Next.js 部署](https://vercel.com/docs/frameworks/full-stack/nextjs)、[GitHub Release 附件連結](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases)。

分享預覽圖的網址會優先使用部署設定 `SITE_URL`，在 Vercel 也會自動使用正式網域；其他主機請設定 `SITE_URL` 為網站的完整 HTTPS 網址。
本機預設為 `http://localhost:3100`。網站部署與遊戲附件發布分開驗收；本 README 不作為線上狀態公告。

### 部署紀錄（2026-10-11）

R5 本機封版來源為 `94d1ba400f39b6a3da39ccb8aa86ede15bc93b9e` 加入未提交修改，使用全新 `source-attempt3`；來源清單共 14,782 檔、1,299,375,140 bytes，SHA-256 `448c144807cd3ce0642a71da04341a29fd9f466a6c618abda6b8ba4a536b0262`。本輪 Godot 4.7.2 匯入使用可重新生成的既有快取，exit code 0、零 ERROR／WARNING；這不是完全無快取的首次匯入，也不覆寫下方 R4 的歷史匯入失敗。

R5 ZIP 已通過 CRC 與 19 個完整解壓檔案的逐檔 SHA-256 核對；ZIP 為 622,950,365 bytes（594.1 MiB）、SHA-256 `8b1dbfedfdc3fce01586ac270420e1629c1972d8b14f79b0ea698298b9d7f053`。包內 `TwilightCodex.exe` 為 734,342,152 bytes、SHA-256 `b78fa16e4cff0c2d1c0728de76644e085aff391e8c944f993548aa318502c68b`。封裝資源檢查 303 項、實際解壓 EXE 的 headless 與一般 GUI 啟動均為 `PASS`，exit code 0、engine／stdout／stderr 零 ERROR／WARNING，執行前後 EXE SHA-256 相同。矮人工坊兩張更新 PNG 的匯入 MD5、封裝 CTEX SHA-256 與材質解碼另通過 10 項檢查，最終來源檢查沒有檔案新增、移除或內容變動。證據位於 `E:\card-game-demo(4.5)\build\windows-zip-20261011-r5\qa\` 的 `package.json`、`local-verification.json`、`new-art-packed.json` 與 `source-final.json`。

R5 MovieMaker 截圖流程保留 `FAIL`：雖然 exit code 0 並產生主選單畫面，退出仍有 4 筆 ObjectDB 警告與 1 筆 `resources still in use` ERROR；一般 GUI 啟動沒有這些診斷。本輪不宣稱全部測試全綠。R5 GitHub 附件上傳、Google Cloud 伺服器更新、Vercel 正式部署、匿名公開下載、朋友電腦與兩個真實帳號完整外網對局驗收均為 `NOT RUN`，正式官網仍為 R4。

先前未發布的 R4 候選來源為 `94d1ba400f39b6a3da39ccb8aa86ede15bc93b9e`，來源清單 SHA-256 為 `58eeae61f9698e096c106e7823298bf17f3ebf980af65d4139bdc4c9e0b77ca6`。該候選 Windows 匯出 exit code 0、零 ERROR／WARNING；ZIP CRC 與完整解壓核對通過。`TwilightCodex-Windows-20261011-R4-verified.zip` 為 611,679,761 bytes，SHA-256 為 `5c07837990e2b1ab41d2d43f52e2aef0d5afe84b01bc7a340f1ce620fb247b49`，因追加遊戲修正而停止發布。證據位於 `E:\card-game-demo(4.5)\build\windows-zip-20261011-r4`，不套用為 R5 驗收結果。

該 R4 候選的 fresh-source import 保留 `FAIL`：來源缺少 403 個 MTL 材質檔，另有 297 筆 OBJ ambient 材質警告；診斷見 `qa/import-diagnostics.json`。來源匯入、Windows export 與實際 EXE 啟動分開紀錄，後續 R5 重新驗收也不能覆寫這份歷史結果。

先前 R4 遊戲來源 commit 為 `386776742db463c553758414252e96fdbb1bfca5`；標準 `TwilightCodex-Windows-20261011-R4.zip`、Server TAR.GZ 及兩份檢查碼已於 `v2026.10.11-r4` 公開發布並保留。標準 R4 ZIP 大小為 611,548,015 bytes、SHA-256 為 `14243c2f1b5e397fdc468c335252f39e709ca25bcd7c8c53ef47c02d290b8f48`；該批 Windows EXE 與伺服器 PCK 的封裝資源檢查各通過 293 項，匿名 GitHub API 亦已核對四個附件的名稱、上傳狀態與兩份遊戲包的 digest。這些證據不套用成本輪 `-verified.zip` 的公開下載或真人對局驗收。

Google Cloud 既有伺服器於 2026-10-11 09:57:43 UTC 更新成功，線上 PCK SHA-256 為 `fec51a5cfee27d1814f7660adc58109c7d56b3849d02ed2453f5d418543cc1ac`，更新前備份位於 `/opt/card-game-server-backups/20261011T095741Z-35159`。公開外網大廳檢查通過 11 項；完整兩個正式帳號的真人對局仍為 NOT RUN。

網站由 `wuharry/cardGame-site` 的 `main` 推送觸發既有 Vercel 正式部署。先前 R4 網站 commit 為 `e9a59a5753d2045296faf94430efea7422ebede4`，Vercel deployment `4utP7ctAG5LDECqx67NR1WECGhhA` 顯示 `Ready / Production`。本輪 R5 尚待發布新附件與更新下載資料；正式下載區必須核對本輪版本、大小、SHA-256 與完整附件網址，不能只看建置完成。先前 R4 證據保存在遊戲專案 `build/release-r4/` 的 `release-api-verification.json` 與網站正式驗收紀錄。以下保留 R3 的歷史部署紀錄。

正式網址是 [twilight-codex.vercel.app](https://twilight-codex.vercel.app/)，既有 Vercel 專案為 [twilight-codex](https://vercel.com/wuharrys-projects/twilight-codex)。首版使用 Chrome 的 Vercel 檔案上傳流程部署，當時已驗收桌機、手機版與四路教學互動。

本輪已透過 GitHub 網頁更新公開的 [網站來源 repo](https://github.com/wuharry/cardGame-site) `main`，包含 R3 規則、素材、公開 Windows 下載網址與維護說明。首個 Git 正式部署使用 commit `3bd1fa12719e8a4f54dda9f674ad204e21fe8f95`；後續新增 GitHub 版本頁連結及完整 ZIP 檔名指引，目前正式部署使用 commit `1f2dc436b4ab92705c0682d44839d83784a695b0`。遊戲附件使用獨立的 [twilight-codex-downloads](https://github.com/wuharry/twilight-codex-downloads) repo，未上傳遊戲原始碼。

既有 Vercel 專案已連接 `wuharry/cardGame-site`，並確認 `main` 提交可自動觸發正式部署。最新 deployment `dpl_CNdyNz5KeR6JtHXQmZyaiqHww4QA` 在 Vercel 顯示 `Ready / Production`，[本次固定部署網址](https://twilight-codex-5ryacvlwf-wuharrys-projects.vercel.app/) 可供追溯。正式網址重新載入後，R3 ZIP 下載連結、新增的 GitHub 版本頁連結及完整檔名指引均可見；版本、大小、SHA-256 與 ZIP 附件網址一致。先前 deployment `dpl_TpzU5YXmeqZphfpXsY5YXbo9myv4` 保留為歷史部署。

R3 公開 ZIP 已透過匿名 CLI 完整下載並驗證。下載檔為 **611,672,435 bytes**，SHA-256 為 `b4807044b0e40b33b681c1e625270b0805e573b70e2e4189ca2d57da8803aa2f`，與發布包一致；ZIP CRC 檢查與完整解壓 19 個檔案均通過。下載包內 `TwilightCodex.exe` 的 SHA-256 為 `4104ade949d1e0ac1589bf7580da349506afa42e3a91cf4c6b4ec1d501fdcc7b`，亦與原發布 EXE 相符。

此電腦的 Chrome 人工下載、完整解壓與執行已通過：使用者從官網點擊下載，完成後親手啟動，回報「正常進入主選單」。首輪 Chrome 下載檢查碼曾在 `release-assets.githubusercontent.com` 出現 `ERR_BLOCKED_BY_CLIENT`，自動化下載等待也未完成；這些保留為歷史限制，後續匿名 CLI 完整下載與使用者人工啟動均已成功。朋友其他電腦的下載與執行仍為 `NOT RUN`。

公開下載包的一般 GUI 啟動驗證為 `PASS`。未啟用 Movie Maker，執行 600 frames 後 exit code 為 0，零 ERROR、零 WARNING；EXE SHA-256 在執行前後一致，且隔離的新訪客資料確實產生 `guest_profile.cfg`。證據為下述公開下載 QA 資料夾內的 `normal-gui-verification.json`；headless 啟動亦為 exit code 0、沒有 ERROR。

Godot Movie Maker 的退出清理錯誤尚未處理，嚴格錄影 QA 總報告保留 `FAIL`。錄影雖成功擷取 30 張主選單畫面，退出 stdout 仍有 4 筆 ObjectDB 警告與 1 筆 `resources still in use` ERROR；一般 GUI 啟動沒有重現這些訊息，不能因此將錄影 QA 改為通過。真人連線與完整對局仍為 `NOT RUN`。

公開下載驗證的完整證據位於 `E:\card-game-demo(4.5)\build\windows-zip-20261011-1244\qa\public-download-20261011-01`。網站畫面證據為下述 QA 資料夾內的 `website-download-live.jpg`。

後續提交並 push 網站變更到 `main` 會觸發 Vercel 建置；只改本機檔案不會更新網站。每次發布都要確認 Vercel 顯示 `Ready`，再到正式網址驗收新版內容與下載連結。

換遊戲版本時，先在下載 repo 發布新的版本附件，再修改網站的 `src/data/releases.ts` 並部署。只上傳新 Release 不會自動更換網站的固定版本網址；固定 R4 tag 的網站會繼續下載 R4，直到下載資料一起更新。

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

## 品牌名稱（2026-10-15）

目前名稱為 **王牌戰線 / Deckmarch**。官網標題、導覽、分享資料、安裝說明與著作權文字同步使用新名稱。
既有 `twilight-codex.vercel.app`、GitHub 下載 repo、附件前綴與包內執行檔名稱保留相容性。R10 玩家包顯示新品牌；歷史 R9 成品與既有截圖可能保留舊名，歷史紀錄不回寫成新品牌。

R10 本輪只公開 Windows／macOS／Linux 玩家包；Android 保留私人測試包，等待 Samsung Galaxy S24 FE 實機安裝、啟動與對戰驗收。網站 Android 維持 `preparing`，`downloadUrl()` 與版本 API 不提供 Android 下載，也不回退到已停用的 R9 APK。三平台最終檔名、大小與 SHA-256 依正式成品和公開附件驗證後填入，不能以遊戲改名自行改動 `TwilightCodex-` 相容附件前綴。

## 官網設計（2026-10-15）

首頁以遊戲畫面、卡圖與簡短介紹帶玩家認識遊戲，再進入下載；完整規則與歷史更新各有獨立頁面。

| 頁面 | 內容與來源 |
|---|---|
| `/` | 主視覺 → 最新消息 → 四路玩法 → 六種卡型 → 戰場畫面 → 模式 → 下載 → 試玩回饋 |
| `/guide` | 保留回合流程、四路互動演練、三層卡牌、資源、組牌與奪卡、對戰模式 |
| `/news` | `RELEASE_NOTES` 的完整歷史；`BUILDS` 中暫停的平台另以目前狀態提示 |
| `/credits` | 原作者、素材來源與完整授權聲明 |

### 參考與設計取捨

- [闇影詩章 WB 官方網站](https://shadowverse-wb.com/cht/?op=skip)：參考主視覺優先、最新消息、卡牌／角色展示與持續可見的遊玩入口。
- [爐石戰記官方網站](https://hearthstone.blizzard.com/zh-tw)：參考簡短玩法賣點、各遊玩模式介紹與清楚的下載引導。
- 使用遊戲現有卡圖與實機截圖，未搬用參考站的品牌、圖片、文案或程式。卡圖展示與實機畫面分別標明；畫廊保留各截圖的實際擷取版本，冰原舊圖不宣稱是現行四路畫面。
- 深藍黑、書頁米白與金色交替建立段落層次。手機有可收合的完整導覽，卡型選擇排成兩列；沒有自動輪播或自動播放影片。按鈕可用鍵盤操作，選單支援 Escape，尊重減少動態設定。

### 維護位置

- `src/app/marketing.css`：官網首頁、導覽、頁尾與新子頁標題。樣式以公開網站 class 限定；保留 `globals.css` 的原規則圖解與後台基底。
- `EntryScreen`、`home-sections.tsx`：Server Components，組合既有遊戲和版本資料。
- `SiteHeader`、`CardDiscovery`、`ArenaGallery`：分別管理手機選單、卡型、戰場的切換；指南沿用原本的互動元件。
- `src/data/site.ts`：公開 Google 試玩表單連結。頁面只提供連結，不另蒐集回饋或登入資料。
- 下載連結、平台顯示、系統需求與停用狀態沿用 `BUILDS`／`downloadUrl()`。不由視覺元件硬寫下載網址，Android 暫停時仍無 APK 下載或安裝入口。
- 舊首頁 `#lanes`、`#cards`、`#systems`、`#collection`、`#modes`、`#download` 保留對應簡介；`#flow`、`#changelog` 指到玩法與新訊，完整內容由該區連入指南／更新頁。

### 驗證

```bash
npm run lint
npm run build
node scripts/test-game-version.mjs
node scripts/test-android-install-guide.mjs
node scripts/test-admin-api.mjs
node scripts/test-play-analytics.mjs
```

版面另外以瀏覽器驗證桌面與窄螢幕：手機選單開關／Escape／點選後收合、六種卡型與三個戰場、指南與消息路由、下載錨點、暫停平台無下載連結、回饋連結及頁面水平溢位。測試表單連結不送出回覆，下載驗證不重抓大型遊戲包。
