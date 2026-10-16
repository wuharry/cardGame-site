# 手機官網載入：90 分目標

## 目標與驗收

從 [69 分手機基準](https://pagespeed.web.dev/analysis/https-twilight-codex-vercel-app/zliqsh3qud?form_factor=mobile) 繼續改善，盡量達到 90 分以上。保留全部畫面、圖片品質、中文字型與功能；Android APK 維持停用。

手機 PageSpeed 使用 Moto G Power 模擬、慢速 4G、首次載入，與上一輪相同。結果需附公開報告；分數不能代替真實手機驗收或 Google 實際使用者 Core Web Vitals。達標後再重測同一版本，記錄全部結果，不只挑最高分。

## 修改與原因

| 修改 | 原因與取捨 |
| --- | --- |
| CSS 隨 HTML 送出 | 基準報告指出首屏仍要等待樣式表；減少第一次載入的額外請求。Next.js 16.3.8 的 `experimental.inlineCss` 會增加 HTML 內的樣式內容、減少獨立 CSS 快取效益，且功能仍為 experimental。本專案固定 Next 版本，保留完整樣式，另外驗證 SSR、client navigation、返回與前進；升級 Next 時需重驗 |
| 只預載 Cinzel 顯示字型 | Barlow 與 Barlow Condensed 保留原字重與檔案，改為實際需要時載入，避免多個字重和首屏圖片搶頻寬 |
| 首屏背景 eager + high priority | 直接提高實際 LCP 圖片的載入優先度，保留同一圖片、尺寸、品質與構圖 |
| 三張卡圖使用原生 lazy + low priority | 桌面可見時照常載入，手機上位於較下方；保留原圖與所有畫面內容 |
| 主要跨頁入口停止自動 prefetch | 首頁載入時不先下載尚未選擇的指南、消息與製作群資料；點選後仍使用 Next client navigation。取捨是首次點選未快取頁面時才請求資料 |

沒有移除圖片、降低 quality、替換字型、隱藏 LCP 物件、加入測分專用延遲或依 Lighthouse User-Agent 切換內容。沒有新增套件、追蹤服務或遊戲包。

## 本機驗證

- lint／production build 通過。
- SEO 47 項、Android 下載門檻 32 項、管理 API 19 項、圖表 18 項與遊戲版本 manifest 通過。
- 手機頁面檢查通過：390×844、844×390、1440×900；字型失敗仍可讀、導航選單、卡型切換、戰場切換、APK 停用、client navigation、返回／前進與無 runtime error。
- 首頁初次載入無外部 stylesheet 請求；全域 font preload 從七個減為一個。

以相同 Chrome、裝置比例、已完成字型／圖片載入及 reduced motion 比對完整頁面。原圖檔案、解析度與 quality 都不變。

| 頁面 | 寬度 | 圖片像素差異 |
| --- | --- | --- |
| 首頁 | 390 | 0／4,055,610 |
| 首頁 | 1440 | 0／11,227,680 |
| 消息 | 390 | 0／918,840 |
| 消息 | 1440 | 0／2,518,560 |
| 指南 | 390 | 0.0444%，只在局部小區域、最大 RGB 差 6 |
| 指南 | 1440 | 0.0016%，最大 RGB 差 1 |

指南保留既有脈動展示；完整頁面尺寸一致。原始比較輸出位於本機 `/tmp/deckmarch-performance-review/`，沒有正式玩家資料。

## 正式部署與 PageSpeed

待部署後補入同版本重測結果。原基準：效能 69、FCP 4.0 秒、LCP 5.3 秒、TBT 20 毫秒、CLS 0。
