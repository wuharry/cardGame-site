# 玩家管理頁

`/admin` 是正式 Supabase 玩家資料的管理入口，與官網一起部署到既有 Vercel 專案。

- 一般登入使用 Email OTP，登入與 refresh token 僅保留記憶體。
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

SQL regression 使用假帳號、單一交易與回滾。正式登入的驗證碼應由管理者自行輸入，不複製到聊天或原始碼。
