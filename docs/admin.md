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

## 營運控制台視覺改版（2026-10-24）

改版採用深色總覽卡、趨勢火花圖、心跳狀態、近期時長色帶、勝負條、卡牌磁貼與分幣別收支圖；詳細表格及原管理操作仍可查閱。沒有依範例捏造伺服器延遲、連勝、金流或全歷史分布，也不採用「圖像比文字快六萬倍」作為量測結果。

- 總覽卡沿用既有讀取 RPC。火花圖顯示最後回傳日往前七個日曆日，缺值／缺日不補零、不跨缺口連線。週增幅只在連續十四日均有資料時比較；前週為零不算無限成長，含今日的部分日期會明示。
- 主機燈代表收到有效心跳，不代表整台伺服器已通過健康檢查。沿用主機 45 秒、遊客活動 90 秒期限；未知值與零連線分開，沒有 ping 毫秒或推估容量圓環。
- 耗時色帶只統計目前篩選下 `matches` 回傳的近期有效耗時，正式伺服器與自行回報分開。分界為少於 180 秒、180 至未滿 480 秒、480 至 900 秒、超過 900 秒。全歷史平均／中位數／P90 仍直接讀後端 `groups`，不拿平均值推算分布。至少二十場且長局超過 5% 才顯示觀察提示，不判定作弊或死鎖。
- 勝負條使用勝／（勝＋敗），平手另列，無樣本不顯示假的五成。玩家詳情的連勝只根據近期回傳紀錄；整批都是勝時顯示「至少」，不宣稱查到完整歷史。
- 卡片費用與稀有度固定來自已公開 R18 成品來源 `aafbb9bb845fb7b86f6b67e4b40744750f50c54d` 的 `data/cards`，共與 `card-names.json` 對應的正式卡牌。`card-catalog.json` 留存來源版本。僅已匯入官網的插畫有縮圖；未知卡保留 ID，費用與品質不猜測。曲線按張數計算，分為 0–7 與 8+ 費；未知卡不進入加權平均。
- 收支取最近至多五十筆交易的當前篩選結果，金幣與鑽石分開，排除失敗並依交易 UUID 去重。缺少前／後餘額不補零，不把本批淨變動說成完整經濟或通膨判定。查詢不寫入任何資產。

驗證入口：`node scripts/test-admin-dashboard.mjs`、既有 `test-admin-api`、`test-play-analytics`、`test-match-duration`、`test-player-commerce`、`npm run lint`、`npm run build`。視覺驗收用 `node scripts/prepare-admin-ui-preview.mjs` 產生忽略目錄內的獨立副本，再依輸出命令啟動本機預覽；不複製環境檔，僅使用假帳號與合成 RPC，寫入一律拒絕。`build/` 同時被 Git、ESLint 和 TypeScript 排除，避免把驗收副本當作正式應用程式輸入。合成預覽不是正式登入驗收；瀏覽器中既有擴充套件注入的 `cz-shortcut-listen` 造成一次 hydration 警告，未以隱藏警告或停用擴充套件處理。

目前驗收紀錄在 `build/admin-ui-20261024/`：桌面與窄螢幕截圖、資料邊界與認證回歸、建置日誌、部署後公開頁驗證。正式管理者登入後的真實資料與人工管理操作另行驗收，不以合成帳號或公開登入頁代替。
