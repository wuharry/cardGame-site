# 下載與安裝改善：2026-10-15

目前先發布免費的安裝流程修正；CDN 尚未開通，也沒有新增付費資源。

## 已確認的原因

- 官網下載按鈕直接指向 GitHub Releases，網站沒有代理大型遊戲包。
- R9 Android APK 為 463,810,470 bytes。2026-10-15 的本機匿名 8 MiB 抽樣下載兩次約為 2.56、3.20 MiB/s，不能代表朋友或手機網路。
- APK 回應已是 `application/vnd.android.package-archive`，`Content-Disposition` 包含正確 `.apk` 檔名，Range 請求取得 `206` 與正確總大小。下載辨識與分段讀取正常，不保證每個瀏覽器都能恢復下載。
- 使用者確認是「下載完成後沒有安裝畫面」。Android 仍需要從 Chrome 下載清單或 Downloads 開啟 APK，由系統要求安裝來源許可並確認安裝；網頁不能替使用者完成首次安裝。
- 只讀包體盤點顯示卡面貼圖約占 APK 76.48%。另做獨立匯入縮圖樣本，原圖與已發布 R9 不改；樣本效果不能直接當作完整 APK 縮減量。

10 張代表卡圖保持 lossless 匯入，只將長邊上限從原尺寸改為 1024px，未加密貼圖合計由 14,651,736 bytes 減為 8,081,946 bytes（少 44.84%）。原尺寸樣本的貼圖 SHA-256 與封版來源一致，原始 PNG 的 SHA-256 也未變。這是匯入樣本的容量量測，尚未輸出完整新版 APK、確認手機畫質或發布；下次可先做 Android 專用卡圖匯入設定，再完成簽章、封裝、原生安裝與畫面檢查。

## 本次官網修正

官網清楚顯示「下載 Android APK」與「已下載？查看安裝教學」。`/install/android` 共用 `BUILDS` 的版本、檔名、大小及下載位置，說明下載清單開檔、系統安裝及錯誤回報。長篇版本說明、校驗碼與備用入口可展開，讓手機優先看到下載與安裝動作。

安裝教學不顯示猜測的下載完成狀態、不再次下載已取得的同版 APK、不要求關閉 Play 安全防護或先刪除舊版。Windows ZIP 改成 installer 可減少解壓步驟，但不會讓相同資料量的傳輸變快，本次沒有新增下載器或 installer 依賴。

## 建議方案：R2 正式網域鏡像

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

1. 部署前核對公開 GitHub asset digest 與本機成品 SHA-256，建立只有五個玩家附件的上傳清單。
2. 鏡像每檔匿名 HEAD 核對大小、APK 類型與附件檔名；匿名 Range GET 核對 `206`、總大小及取得片段與本機一致。
3. 使用鏡像匿名下載完整四包核對 SHA-256。APK 用同一份簽章身份，不重簽鏡像檔；Windows 完整解壓與實際 EXE 啟動。
4. 確認實際 cache 命中與兩次有界下載量測，再和同網路 GitHub 來源比較。朋友網路與 Android 原生安裝另外驗收；cache 設定成功不等於已證明更快。
5. 正式官網 build、lint、版本 API、管理頁權限與統計檢查通過，再 commit／push，確認 Vercel 正式 commit、下載來源與備用入口。
6. 有問題時把官網主要網址切回已核對的 GitHub 檔案，保留相同版本與校驗碼。

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
