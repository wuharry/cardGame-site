# 下載與安裝改善

2026-10-17：紙鴉牌 · Deckmarch R13 已在 GitHub Releases 公開三個桌面 ZIP 與 LF 格式 `SHA256SUMS`，四附件的檔名、大小與 SHA-256 均符合候選三最終 manifest。正式遊戲伺服器已同步來源 `066c80ace94135ed7be4260627393e7a59efb376`、BUILD／最低 BUILD `2026101701`、protocol `19`，完成備份並保留既有玩家狀態及安全設定，未重跑 SQL。官網第一階段更新精確成品 metadata 與可見的中英文說明，繼續以 GitHub 作為主下載及遊戲更新 API 來源；Vercel 正式 commit 與畫面仍須部署後核對。

公開 Windows ZIP 已完成不帶登入資訊的完整下載，468,434,591 bytes 與 SHA-256 符合封版；完整 CRC、安全解壓及 42 檔逐 SHA 核對通過。實際解壓 EXE 通過無畫面與一般視窗啟動，均正常結束、沒有引擎錯誤或警告，一般視窗記錄主選單第一幀。最初因低速中斷的下載 attempt1 與部分檔案仍以 FAIL 保留，後續獨立完整下載及完整驗收另記 PASS。相同資源的驗收工具另通過不同視窗尺寸檢查，主選單已目視確認；未另擷取實際 EXE 畫面。macOS／Linux 原生啟動、朋友電腦及完整真人外網對局仍未驗收。

itch.io 三個桌面 ZIP 仍在上傳，尚未完成鏡像完整 SHA-256 與比較測速，因此所有平台的鏡像維持停用，不宣稱已加速；GitHub 下載仍可使用。Android 公開下載維持停用，等待 Samsung Galaxy S24 FE 實機驗收。服務選擇先考慮不綁卡的免費方案，再考慮有免費額度的服務。

## 官網鏡像接線：2026-10-17

- 只鏡像本次封版驗收的 Windows／macOS／Linux 三個桌面 ZIP 與 `SHA256SUMS`，不含 Android 測試包、伺服器包、原始碼、模板或私密檔案。舊 R11 草稿附件不作為新版鏡像；最終檔名、大小與 SHA-256 以本次封版 manifest 為準。
- `src/data/releases.ts` 的每份 `Build` 可選填 `mirrorProvider: "itch.io"` 與 `mirrorPageUrl`，指向已驗收成品所在的公開專案頁。只接受官方作者 `wuharry.itch.io` 的 HTTPS 專案頁，不保存會過期的 CDN 簽名網址。檔名、大小與 SHA-256 共用最終封版的 metadata，鏡像直接傳同份已驗收 ZIP，不再次加工或覆寫同版內容。目前所有平台都未填鏡像。
- `websiteDownloadUrl()` 僅供官網下載按鈕使用。未設定鏡像、網址格式不合法或不是官方 itch.io 專案頁時，按鈕保留 GitHub 來源；`planned`、`preparing`、`suspended` 成品在兩邊都不提供下載。
- `downloadUrl()`、`releasePageUrl()` 與 `/api/game-version` 仍使用 GitHub。現有客戶端 `UpdateChecker.valid_download()` 只接受官方 GitHub 路徑，不能直接將 `RELEASE_BASE` 換成 CDN。
- 啟用後主按鈕標示「前往 itch.io 下載」，旁邊說明應選的平台與完整檔名；不假裝會直接下載檔案。只有啟用有效鏡像時，主按鈕下方才顯示「GitHub 備用下載」，指向同一份正式附件，避免未啟用時出現兩個相同入口；版本頁仍可另行展開。鏡像連線失敗時由使用者選擇備用，不在網頁猜測是否下載完成或自動重複下載。
- Android 仍等待 Samsung Galaxy S24 FE 實機驗收，鏡像設定不會解除暫停下載。匿名統計、管理頁與遊戲伺服器不因本次接線而變動。

啟用前須從公開 itch.io 頁實際取得三個檔案，完成匿名 HEAD、Range `206`、完整 SHA-256 校驗、Windows 解壓啟動與兩次有界速度比較，才逐平台填入真實 `mirrorPageUrl`。沒有完成這些檢查時，不能宣稱已加速或切換正式下載。itch.io 的 [官方嵌入工具](https://itch.io/docs/creators/widget) 另提供 iframe，初版維持明確外連，不增加第三方 iframe、站內付款流程或網站權限設定。

驗證命令：`node scripts/test-download-mirror.mjs`、`node scripts/test-game-version.mjs`、`node scripts/test-android-install-guide.mjs`、`node scripts/test-play-analytics.mjs`、`node scripts/test-admin-api.mjs`、`npm run lint`、`npm run build`。

## 先前下載與 Android 安裝調查：2026-10-15

- 官網下載按鈕直接指向 GitHub Releases，網站沒有代理大型遊戲包。
- R9 Android APK 為 463,810,470 bytes。2026-10-15 的本機匿名 8 MiB 抽樣下載兩次約為 2.56、3.20 MiB/s，不能代表朋友或手機網路。
- APK 回應已是 `application/vnd.android.package-archive`，`Content-Disposition` 包含正確 `.apk` 檔名，Range 請求取得 `206` 與正確總大小。下載辨識與分段讀取正常，不保證每個瀏覽器都能恢復下載。
- 使用者確認是「下載完成後沒有安裝畫面」。Android 仍需要從 Chrome 下載清單或 Downloads 開啟 APK，由系統要求安裝來源許可並確認安裝；網頁不能替使用者完成首次安裝。
- 只讀包體盤點顯示卡面貼圖約占 APK 76.48%。另做獨立匯入縮圖樣本，原圖與已發布 R9 不改；樣本效果不能直接當作完整 APK 縮減量。

10 張代表卡圖保持 lossless 匯入，只將長邊上限從原尺寸改為 1024px，未加密貼圖合計由 14,651,736 bytes 減為 8,081,946 bytes（少 44.84%）。原尺寸樣本的貼圖 SHA-256 與封版來源一致，原始 PNG 的 SHA-256 也未變。這是匯入樣本的容量量測，尚未輸出完整新版 APK、確認手機畫質或發布；下次可先做 Android 專用卡圖匯入設定，再完成簽章、封裝、原生安裝與畫面檢查。

## 先前 Android 安裝流程修正：2026-10-15

官網清楚顯示「下載 Android APK」與「已下載？查看安裝教學」。`/install/android` 共用 `BUILDS` 的版本、檔名、大小及下載位置，說明下載清單開檔、系統安裝及錯誤回報。長篇版本說明、校驗碼與備用入口可展開，讓手機優先看到下載與安裝動作。

安裝教學不顯示猜測的下載完成狀態、不再次下載已取得的同版 APK、不要求關閉 Play 安全防護或先刪除舊版。Windows ZIP 改成 installer 可減少解壓步驟，但不會讓相同資料量的傳輸變快，本次沒有新增下載器或 installer 依賴。

## 備選方案：R2 正式網域鏡像（尚未開通）

以下保留 2026-10-15 的備選規劃。使用者目前沒有自有網域，本次優先驗證 itch.io；若之後選 R2，需另行支援其固定檔案網址，不能將 R2 地址填進 itch.io 專案頁欄位。

採用 Cloudflare R2 Standard 儲存固定版號的玩家包，接上使用者可控制的 Cloudflare 網域，例如 `downloads.<使用者的網域>`，並對版本化附件設定 cache rule。正式站仍保留 GitHub 備用入口。

- 前置條件是 Cloudflare 帳號、R2 可用及可控制的網域；本次沒有建立帳號、接受服務條款、購買網域或啟用計費。
- 四個 R9 玩家包合計 1,864,816,825 bytes，均低於 Cloudflare Free／Pro／Business 的單檔 512 MB 快取限制。每次新版本仍要重新檢查，不能把限制寫成永遠符合。
- 官方 R2 Standard 免費額度目前是每月 10 GB-month 儲存、100 萬次 Class A、1,000 萬次 Class B，R2 直接出口不收流量費；免費額度是帳號共享，超額操作、其他服務或網域可能另收費。不承諾永遠免費。
- 不使用 `r2.dev` 當正式加速網址：它沒有 CDN cache，且吞吐可能受限。
- 僅鏡像四個已發布玩家包與 `SHA256SUMS`，不得遞迴上傳 build、原始碼、伺服器包、模板或私密檔案。
- 物件保留正確 `Content-Type`、`Content-Disposition: attachment; filename="..."`、大小與 SHA-256。不可覆寫同版檔名不同內容；版本化檔案可設長快取。
- 官網新增獨立鏡像網址設定，再驗證後切換主要下載按鈕。`releasePageUrl()` 必須繼續導向 GitHub 版本頁，不從鏡像來源推導。
- `/api/game-version` 先維持 GitHub 原始網址：現有遊戲 `UpdateChecker.valid_download()` 限定官方 GitHub 路徑。若要讓遊戲內更新也使用鏡像，須另更新客戶端信任規則及失敗路徑測試。

## 部署前後的驗收

1. 部署前核對最新封版 manifest、公開 GitHub asset digest 與本機成品 SHA-256，建立只有本次三個桌面 ZIP 與 `SHA256SUMS` 的上傳清單。
2. 鏡像每檔匿名 HEAD 核對大小、Content-Type 與附件檔名；匿名 Range GET 核對 `206`、總大小及取得片段與本機一致。
3. 使用鏡像匿名下載完整三包核對 SHA-256；Windows 完整解壓與實際 EXE 啟動。macOS／Linux 封裝與下載校驗不能代替原生啟動驗收。
4. 確認實際 cache 命中與兩次有界下載量測，再和同網路 GitHub 來源比較。朋友網路與 Android 原生安裝另外驗收；cache 設定成功不等於已證明更快。
5. 正式官網 build、lint、版本 API、管理頁權限與統計檢查通過，再 commit／push，確認 Vercel 正式 commit、下載來源與備用入口。
6. 有問題時移除對應平台的 `mirrorPageUrl`／`mirrorProvider`，官網主要網址即回到已核對的 GitHub 檔案，保留相同版本與校驗碼。

## 可用的 Google 方案

既有 Google Cloud 專案也可使用獨立的 Cloud Storage 玩家下載 bucket。它是檔案鏡像，不應直接當作大型遊戲包已經 CDN 加速：Cloud Storage 內建快取上限只有 10 MiB，這四個包超過限制。真正 Cloud CDN 另需配置與計費。

以官方一般亞洲出口第一段 USD 0.12/GiB 估算，100 次完整 Android APK 下載約 USD 5.18，僅出口費，還沒有儲存、操作、稅或 Cloud CDN 費用；這是假設性估算，非帳戶報價。正式開通前須確認地區、現有額度、計費與使用者同意。

## 官方依據

- [Google：下載其他來源的 Android 應用程式](https://support.google.com/pixelphone/answer/7391672?hl=zh-Hant)
- [Chrome：下載及尋找檔案](https://support.google.com/chrome/answer/95759?co=GENIE.Platform%3DAndroid&hl=zh-Hant)
- [Cloudflare：R2 公開 bucket 與正式網域](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Cloudflare：R2 cache 與檔案限制](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)
- [Cloudflare：R2 計費](https://developers.cloudflare.com/r2/pricing/)
- [Google Cloud Storage：內建快取](https://cloud.google.com/storage/docs/caching)
- [Google Cloud Storage：計費](https://cloud.google.com/storage/pricing)
