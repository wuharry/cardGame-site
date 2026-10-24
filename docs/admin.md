# 玩家管理頁

`/admin` 是正式 Supabase 玩家資料的管理入口，與官網一起部署到既有 Vercel 專案。

- 一般登入使用已授權的 Email 與管理帳號密碼；登入與 refresh token 僅保留記憶體。
- 每次 RPC 由資料庫查驗管理者名單；頁面可被開啟不代表能讀取玩家資料。
- API 檔案只包含公開 publishable 設定，不包含 service-role／secret key。
- 權威 SQL、安裝與操作限制位於遊戲 repo `deploy/account/20261013_admin_console.sql`、`deploy/admin/README.md`。
- 查看註冊／驗證／最近登入、收藏、包券、新手剩額、抽卡與對局紀錄、最近通過入場驗證的牌組。
- 可補發包券／正式卡、停權／恢復新對戰；操作需填原因，使用 UUID 收據防重複。
- 未確認的操作意圖存在 sessionStorage，以管理者帳號 ID 分開；重新登入後重試同一筆，token 不寫入 storage。
- 這版不提供刪除帳號／資料，也不將本機暱稱、頭像、人物或牌組草稿假裝成已同步。

驗證：

```bash
node scripts/test-admin-api.mjs
npm run build
```

SQL regression 使用假帳號、單一交易與回滾。正式登入的密碼及設定流程中的驗證碼由管理者直接在頁面輸入，不複製到聊天、原始碼、命令列或操作紀錄。

## 管理帳號密碼登入（2026-10-24）

- `/admin` 預設顯示 Email／密碼，不再先寄登入驗證碼。Email 可由瀏覽器帳號填入，沒有把管理者信箱或授權名單硬編碼到頁面。
- 密碼屬於這個既有 Supabase Auth 帳號，與 Google／Gmail 網站密碼無關。前端走 `/auth/v1/token?grant_type=password`，接著仍要通過 `tcg_admin_session`；只有密碼正確、不在管理者名單的玩家仍被拒絕並清除 session。
- 「首次設定／忘記密碼」使用既有 Email OTP 驗證，不建立新帳號（`create_user:false`）。只有通過資料庫管理權限查驗後才顯示新密碼與確認欄位。
- 新密碼至少 12 個字元、UTF-8 最多 72 bytes；實際強度與是否允許修改仍由 Supabase Auth 決定。寫入 `/auth/v1/user` 前再查管理角色，成功後登出並回到密碼登入。
- 設定驗證在十分鐘內有效；返回登入、登出或認證失效會清除設定資格。取消後晚到的登入／OTP 回覆不能重新啟用 session，也不能覆蓋較新的登入。
- 密碼送出時清空欄位；密碼與 token 不寫入 localStorage、sessionStorage、URL 或 console。操作收據的 sessionStorage 仍只保存補發／寄信等既有管理意圖。
- 沿用同一個已驗證 Auth 帳號 UUID 與管理角色，不重建帳號、不新增資料庫授權、不使用 service-role。首次設定不需新增 recovery callback 或 redirect allowlist。

本輪本機驗證：`node scripts/test-admin-api.mjs` 38 項通過、改動程式的 ESLint 與 `tsc --noEmit --incremental false` 通過、Next.js 16.4.2 production build 通過。另以成功角色 RPC 回覆與其 await continuation 間的取消／同帳號重新驗證重現舊設定請求，確認舊 epoch 不會發出 PUT，也不會清掉新設定資格。正式部署、真實管理者密碼登入與密碼變更由主代理和管理者另外驗收；測試僅使用模擬 HTTP 與假憑證。

Next production build 可執行 `node node_modules/next/dist/bin/next build`；本輪沒有執行另一項 Android 下載工作的 `prebuild`。前端登入頁預覽：`node node_modules/next/dist/bin/next start --port 3024`。

API 依據：[Supabase 密碼登入](https://supabase.com/docs/guides/auth/passwords)、[已登入使用者修改密碼](https://supabase.com/docs/reference/javascript/auth-updateuser)。

## 玩家禮物信箱（2026-10-15）

- 在玩家資料的管理操作選「寄送禮物信件」，填標題、內容、卡包券數量及原因，再確認送出。
- 寄出不直接增加包券；玩家在新版遊戲信箱領取後才原子入帳。遊客只顯示既有新手禮物。
- 「禮物信件」頁可分頁查看寄送、待領／已領、發送者、原因及領取前後餘額。
- 發送權限沿用 operator；viewer 可查閱。一次最多 100 包券，不允許未登入／匿名 Auth 使用者。
- 依賴遊戲 repo `deploy/account/20261015_player_mail.sql`。發送意圖沿用原有 sessionStorage UUID 重試；認證失效不抹除尚未確認的操作。

2026-10-14 歷史版本：一般登入曾只接受 6–10 位數字 Email OTP；2026-10-24 起只在首次設定／忘記密碼流程使用。官網 Google 安全標記、套件修補及複審狀態見 [安全檢查紀錄](security-20261014/README.md)。
# 遊玩統計（2026-10-13）

- `/admin` 登入後提供累計試玩指標、近 28 日趨勢、近 24 小時主機連線曲線、每位正式玩家勝敗率與分頁遊客資料。
- 依賴 `20261013_play_analytics.sql`；各讀取 RPC 仍檢查既有管理者名單。不增加管理者或暴露 service key。
- 遊客是匿名裝置回報，沒有姓名／Email／收藏／牌組；清除存檔可能重計，離線直到連網才收到。正式戰績只讀 server match_results。
- 主機 45 秒、遊客活動 90 秒期限。缺失／過期主機心跳顯示待確認；圖線缺少分鐘時中斷，不補成零。兩類在線指標可能重疊，不相加。
- 新主機 publisher 才能產生在線曲線；新客戶端才有遊客回報。舊版歷史不回填。
- `node scripts/test-play-analytics.mjs` 驗證 7 項：新鮮零值、過期、缺值、缺口與 SVG／數據表；`node scripts/test-admin-api.mjs` 涵蓋並行 token refresh。
