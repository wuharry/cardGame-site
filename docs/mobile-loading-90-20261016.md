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

第一輪 `9cc370f` 已部署，[報告](https://pagespeed.web.dev/analysis/https-twilight-codex-vercel-app/65jmfaqe4h?form_factor=mobile)為 74 分、FCP 3.6 秒、LCP 4.8 秒、TBT 30 毫秒、CLS 0。移除阻塞 CSS 後仍未達標；報告顯示完整頁面的字型仍在關鍵下載路徑，因此繼續修正，沒有把 74 分當完成。

第二輪將首屏與消息用字分成 108,384 bytes 的主要字型片，保留全部字元、400–700 字重與原字型；其餘三片照常供下方區塊與指南使用，總共 473,856 bytes。使用原生 `content-visibility: auto` 延後繪製畫面外區塊與頁尾，保留 DOM、搜尋、可及性與原生跳轉，不以 hidden 或移除內容加速。`contain-intrinsic-block-size: auto` 在首次呈現後記住實際高度。

本機初次載入中文字型從 468,364 bytes 減為 108,384 bytes；連同需要的英文字型為 165,760 bytes（約 162 KiB）。卡型、戰場、下載與回饋四個深層連結已加入操作驗收，避免區塊延後繪製造成跳錯位置。SEO 檢查因新增第四個字型檔成為 48 項，已通過。

上述逐像素表是第一輪調整的比較；原生延後繪製後，完整長頁擷取會與實際可見範圍不同，另以相同 viewport 的可見區塊檢查完整圖文。第二輪正式部署後再補入同版本重測。原基準：效能 69、FCP 4.0 秒、LCP 5.3 秒、TBT 20 毫秒、CLS 0。

第二輪另以隔離的 `5cc21a7` 原版與目前版本，在同一 Chrome／相同 viewport 對照八個區塊。全部展開後，手機與桌面的完整頁高皆與原版一致；首屏最大 RGB 通道差為手機 1、桌面 2（0–255 範圍），其他區塊包含字形邊緣／次像素與捲動繪製差異，沒有宣稱每個像素都相同。原圖、字重、文案與元件都保留；比較結果在 `/tmp/deckmarch-performance-review/paired-comparison.json`，沒有正式玩家資料。

## 完成結果：三次皆 95 分

`510b05b` 已 push 且 Vercel production 部署成功。以下三次皆測正式首頁、相同版本、Moto G Power 模擬、慢速 4G、首次載入、Lighthouse 13.5.0；數值按 PageSpeed 顯示的精度記錄。

| 測試 | 效能 | FCP | LCP | TBT | CLS | 報告 |
| --- | --- | --- | --- | --- | --- | --- |
| 10:27 | 95 | 1.7 秒 | 2.7 秒 | 30 毫秒 | 0 | [第 1 次](https://pagespeed.web.dev/analysis/https-twilight-codex-vercel-app/juaau6y9t1?form_factor=mobile) |
| 10:28 | 95 | 1.7 秒 | 2.7 秒 | 40 毫秒 | 0 | [第 2 次](https://pagespeed.web.dev/analysis/https-twilight-codex-vercel-app/n42mf5yl89?form_factor=mobile) |
| 10:30 | 95 | 1.7 秒 | 2.9 秒 | 20 毫秒 | 0 | [第 3 次](https://pagespeed.web.dev/analysis/https-twilight-codex-vercel-app/1jvmrpumvc?form_factor=mobile) |

效能中位數 95、FCP 中位數 1.7 秒、LCP 中位數 2.7 秒，達成這輪 90 分以上的目標。三次 Lighthouse SEO 皆 100、最佳做法皆 100、無障礙自動檢查皆 96；沒有把自動檢查當作完整無障礙驗收。

正式站重驗：SEO 48 項通過；手機／桌面尺寸、字型失敗、卡型／戰場切換、client navigation、返回／前進、四個深層連結、APK 停用與無 runtime error 通過。正常字型載入確認：首屏只下載 108,384 bytes 的中文主要分片，字型已實際載入；捲動後其餘原字元分片會正常下載。新增 120 KB 的首屏中文字型預算，避免頁尾或其他區塊再次拖入整套字型。

捲動驗收等待實際可見的目的區塊與延後字型的回應，不把 `networkidle` 當成畫面已繪製；同頁錨點跳轉與 `content-visibility` 啟用可能發生在網路閒置之後。這些條件在本機與正式站均通過，沒有主動強迫字型下載或移除原有斷言。

限制：這些是實驗室測試，真實使用者 Core Web Vitals 資料仍不足；LCP 2.7–2.9 秒尚未達「良好」的 2.5 秒，95 分不代表每支手機／每條網路都同樣快。CSS 內嵌仍使用本頁已說明的 Next experimental 功能，升級 Next 時需重跑跨頁與返回測試。APK 下載及版本 API 的 Android 項目維持停用，沒有發布新的遊戲包。
