# 官網 SEO、手機載入與後台圖表

## 目標與範圍

補齊公開頁面的搜尋資訊，確認 Google 收錄與手機載入瓶頸；每日表格改為新到舊，提供適合現有資料的柱狀圖與圓餅圖。Android APK 維持停用，不發布遊戲新包，不更動玩家紀錄或資料庫權限。

修改範圍：`src/data/seo.ts`、公開頁 metadata、`robots.ts`／`sitemap.ts`、字型載入、`next.config.ts`、`src/app/admin/play-analytics*` 與對應樣式、驗證腳本。

## SEO

- 正式網址預設 `https://twilight-codex.vercel.app`，保留 `SITE_URL` 供日後網域遷移；不使用短期部署別名作為標準網址。
- 首頁、指南、消息、製作群與 Android 安裝狀態頁各有 canonical、Open Graph 與 Twitter 標題／摘要／圖片。
- `sitemap.xml` 只列五個公開頁。不虛構每次部署的 lastmod。
- `robots.txt` 公布網站地圖並排除 `/api/`；`/admin` 保持可檢索，讓既有 `noindex` 可以被讀到。robots 不是權限控管。
- Vercel preview 回應附 `X-Robots-Tag: noindex, nofollow`；正式站不受影響。
- 首頁輸出 `WebSite` 與 `VideoGame` JSON-LD，資料來自現有品牌與可下載平台，不填虛構評分、價格或 Android 發布資訊。這不保證 Google 顯示特殊搜尋樣式。

## Google 收錄：修改前實際查詢

2026-10-16 透過已登入的 Google Search Console 查詢：

| 項目 | 實際結果 |
| --- | --- |
| 網頁索引總覽 | 資料處理中，提示約一天後查看 |
| 首頁網址審查 | 網址不在 Google 服務中；Google 無法辨識的網址 |
| 參照 Sitemap／網頁、上次檢索 | 未偵測／不適用 |
| 安全性問題 | 未偵測到問題 |
| 手機／桌面真實使用者核心指標 | 過去 90 天使用資料不足 |

部署後需提交網站地圖、執行首頁線上測試並提出索引要求。提交成功不等於已收錄；由 Google 後續處理。

## 手機效能：修改前實測

[PageSpeed Insights 原始報告](https://pagespeed.web.dev/analysis/https-twilight-codex-vercel-app/186g41pf0d?form_factor=mobile)，2026-10-16 09:30 台北時間。條件：Lighthouse 13.5.0、模擬 Moto G Power、慢速 4G、首次載入。

| 指標 | 修改前 |
| --- | --- |
| 效能 | 56 |
| FCP（首次顯示內容） | 10.4 秒 |
| LCP（最大內容顯示） | 12.2 秒 |
| Total Blocking Time | 0 毫秒 |
| CLS（版面位移） | 0 |
| Lighthouse SEO 基本檢查 | 100 |

報告指出中文 Google Fonts CSS 會阻塞首次顯示，該 CSS 傳輸 102.1 KiB；「可節省時間」為 Lighthouse 模型估計，不代表實測改善值。SEO 100 分只代表工具檢查的基本項目，不代表已收錄或有搜尋排名。

修正：保留既有 Noto Serif TC 字型與 unicode-range 分片，在 hydration 後載入樣式表，先以系統後備字型呈現。停用 JavaScript 時由 noscript 保留原字型路徑。需於正式部署後重測；字型失敗不影響閱讀與互動。

## 後台圖表

- 每日表格獨立排序為新到舊，不修改 RPC 回傳的陣列；趨勢圖保持時間由左到右。
- 每日活動預設分組柱狀圖，可切換折線圖；滑鼠提示與表格提供精確值，單日與空資料有對應呈現。
- 圓餅採中空外形，表示各遊客模式的累計「對局開始次數」占比；不是玩家人數。零樣本不畫比例，單一模式顯示完整圓環，附精確表格。
- 使用既有 React／SVG，沒有新增圖表套件或分析追蹤服務。

## 驗收與交接

```bash
npm run lint
npm run build
npm run start -- --port 3107 --hostname 127.0.0.1
node scripts/test-seo.mjs http://127.0.0.1:3107
node scripts/test-mobile-site.mjs http://127.0.0.1:3107
node scripts/test-play-analytics.mjs
node scripts/test-admin-api.mjs
node scripts/test-android-install-guide.mjs
node scripts/test-game-version.mjs
```

本機已通過 SEO 43 項、圖表 18 項、管理 API 19 項、Android 下載門檻 32 項與版本 manifest 檢查，以及 lint／production build。手機頁面檢查使用隔離 Chrome，沒有存取正式管理帳號。

正式部署、正式站重驗、PageSpeed 修改後數值與 Search Console 提交結果，於完成後補記。真實手機使用者資料不足，不能宣稱 Core Web Vitals 實際使用者驗收通過；本輪也不是 S24 FE 遊戲 APK 測試。
