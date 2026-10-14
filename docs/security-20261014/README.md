# 2026-10-14 官網安全標記與修補

## 已確認的狀態

- Google Safe Browsing 的公開查詢將官網與 `/admin` 標示為部分網頁不安全，分類文字為「企圖誘騙訪客提供個人資訊或下載軟體」。原始畫面保存在 [google-safe-browsing-before.png](google-safe-browsing-before.png)。
- 管理者回報在輸入 Email 與一次性驗證碼後收到 Chrome 警告；未回報輸入其他服務的密碼。
- 正式首頁與管理頁使用 HTTPS，正常驗證憑證的 curl 請求均取得 HTTP 200。Python 本機 CA 設定曾造成憑證驗證失敗，不能據此宣稱官網憑證有問題。
- 唯讀檢查首頁、管理頁及管理頁載入的九份 JavaScript：HTML 無 iframe，載入的 script 均來自本站；管理登入使用既有遊戲的 Supabase Email OTP，未發現密碼輸入欄位或 `sb_secret_` 前綴。這是有限範圍檢查，不是沒有入侵或所有內容安全的證明。
- 未取得 Google 詳細安全報告前，不能斷定誤判，也沒有證據將已知套件漏洞直接歸因為本次標記。

## 修補

- Next.js 與 eslint-config-next 從 16.3.3 更新到 16.3.8；sharp 最低版本提高至 0.35.5；在既有版本範圍內更新 source-map-js、brace-expansion 與 js-yaml。
- 管理者登入只接受 Supabase 支援的 6–10 位數字 OTP；格式錯誤在送出 Auth 請求前拒絕。欄位保留 `autocomplete="one-time-code"`，並明確提醒只輸入本遊戲寄出的驗證碼。
- 增加防止嵌入頁面、內容類型嗅探與外站 referrer 傳遞的基本 HTTP 標頭。CSP 僅設定 base-uri、object-src、frame-ancestors 與 form-action，沒有宣稱提供完整 script-src／XSS 防護。
- 經擁有者明確授權，加入 Google Search Console 提供的公開網站驗證中繼標記。它不授予任何遊戲管理權限，也不是登入憑證。
- `/admin` 既有 noindex 與資料庫管理者權限檢查維持。noindex 不能用來解除安全標記。

## 驗證

| 檢查 | 結果 |
| --- | --- |
| `node scripts/test-admin-api.mjs` | PASS，16 項；包含錯誤 OTP 不送出、較長數字 OTP、一般帳號拒絕、重試與 token refresh |
| `npm run build` | PASS，Next.js 16.3.8、TypeScript 與 `/admin` 靜態頁生成 |
| 變更檔案 ESLint | PASS |
| `npm audit --omit=dev --json` | PASS，正式執行依賴 0 項已知漏洞 |
| 完整 npm audit | FAIL，開發用 eslint／glob／braces 鏈仍有 5 項 high；工具建議降級到不同主版本，未執行 force 或降級 |
| 真實管理帳號 OTP／私人資料查詢 | NOT RUN，未讀取或代填管理者驗證碼 |

## Google 複審

Search Console 原先顯示目前帳號未取得此 URL-prefix 資源的權限。擁有者已授權驗證所有權並提交安全複審。

- `680161f` 已 push；Vercel 回報正式部署完成。實際首頁與 `/admin` 已確認包含驗證中繼標記、四項安全標頭及 OTP 登入說明；結果見 [production-verification.json](production-verification.json)。
- Google 已回報「已驗證擁有權」，方法為 HTML 標記。
- 詳細安全報告列出一項「在使用者登入時偵測到疑似網路詐騙內容」。Google 說明為輸入已儲存的登入憑證時觸發瀏覽器彈窗，網址示例「不適用」。本次報告沒有列出惡意下載；不能由此宣稱所有下載都已通過安全審查。
- 已透過安全性問題報告提交 [完整複審說明](review-request.txt)，Google 顯示「已成功提交要求」。只提交一次，不重送。
- 所有權與提交成功畫面留在此工作階段的私人檔案區，未將登入帳號資訊的畫面發布到 GitHub。

**目前為複審已提交、等待 Google 判定。安全標記尚未確認解除，也尚未確認誤判或資料外洩。**

只有 Google 的最終審查結果與後续安全狀態能確認標記解除。更新套件、補 HTTP 標頭、加入 noindex 或更改登入說明，都不能單獨證明 Chrome 警告已解除。

參考：[Google 安全性問題報告](https://support.google.com/webmasters/answer/9044101?hl=zh-Hant)、[Next.js 安全公告](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j)、[Supabase OTP 長度](https://supabase.com/docs/guides/local-development/cli/config#auth.email.otp_length)。
