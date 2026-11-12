# Android 新 App 下載說明（待新版 APK 驗收後套用）

**下一版 Android 從最新遊戲 `main` 打包，是需要另外安裝的新 App；目前 R25 下載設定仍指向舊 App。** 本文件提供可直接使用的中英文文案與切換步驟，不修改現有下載檔、更新 API 或上線狀態。Windows 操作見遊戲 repo 的 `docs/windows-next-release-handoff-20261112.md`。

## 下載按鈕旁的提醒

新 APK 通過驗收後，將以下內容放入 `src/data/releases.ts` 中 Android 那筆 `Build.downloadNotice`；首頁下載區與 `/install/android` 已共用此欄位，不需各自再做一套。若該版還有經核准保留的限制，應接在提醒後，不能用這段文字蓋掉未驗項目。

```typescript
downloadNotice: {
  zh: "這是新 App，需要另外安裝。確認新版正常後，舊版可以移除。遊客與本機進度不會自動轉移；使用原本的帳號登入，可恢復雲端收藏與錢包。",
  en: "This is a new app and must be installed separately. You can remove the old app after confirming the new one works. Guest and local progress do not transfer automatically. Sign in with your existing account to restore your cloud collection and wallet.",
},
```

## 發版公告／完整安裝說明

**Android 新版需另外安裝，舊版可以先保留。**

1. 從本頁下載新版 APK 並安裝；手機上會與舊版並存。
2. 有帳號的玩家請用原本的登入信箱登入，確認雲端收藏與錢包正常。新 App 第一次需要重新登入，之後應能記住登入狀態。
3. 遊客資料、本機牌組、設定與單人進度不會自動搬到新 App；重新登入也不代表這些本機資料都能恢復。
4. 確認新版正常、且不再需要舊版的本機資料後，舊版可以移除。移除舊版會刪除其本機資料，請勿先刪舊版再安裝。

**Install the new Android app separately. You can keep the old app for now.**

1. Download and install the new APK from this page. It can coexist with the old app.
2. Sign in with your existing email account and check your cloud collection and wallet. The new app requires sign-in once; later launches should keep you signed in.
3. Guest data, local decks, settings, and single-player progress do not transfer automatically. Signing in does not restore all locally stored data.
4. Remove the old app only after confirming the new one works and you no longer need its local data. Uninstalling the old app deletes that data; do not uninstall it before installing the new one.

## 維護者切換清單

**文案必須與真正的新 ID APK 同時切換，不能套在現有 R25 上。** 新 ID 為 `com.paperraven.deckmarch`，R25 與更早版本為 `com.harvey.twilightcodex`。沿用原 signer 也不會變成可覆蓋安裝的同一個 App。

| 項目 | 切換要求 |
| --- | --- |
| 固定來源 | 使用最新遊戲 `main` 升版後的完整 SHA；目前原始碼的 R25 版號尚待升版，不以 R25 名義發布新內容 |
| 真實成品 | 原簽章、新套件 ID、遞增版號；公開交付 core APK＋同版 content PCK，私人 standalone／Mac debug AAB 不作下載檔 |
| 下載資料 | 按最終收據更新 Android 的 `file`、`version`、`bytes`、`size`、`sha256`、`build`、`minimumBuild`、`protocol`、`updated`、`releaseBase` 和 `content`；不先填假 hash／大小，不改其他平台為尚不存在的新包 |
| 線上相容 | 官網下載與 `/api/game-version` 都需核對本版客戶端／專服及資料庫狀態；不能讓新玩法客戶端連到不相容的舊專服 |
| 玩家提醒 | 同次變更新 APK metadata、上述 `downloadNotice` 與新版發版公告；檢查中英文首頁下載區及 `/install/android` |
| 舊版更新入口 | 從舊 App 的更新提示進到官網時，能看到另裝及進度限制；不描述成保留遊客資料的原地更新 |
| 同站下載 | 沿用 `websiteDelivery: "static-apk"`；`scripts/prepare-android-download.mjs` 必須取得與驗收相同的 APK，完整 bytes／SHA 檢查不能關掉 |
| 驗收／封存 | 主下載與 GitHub 備用均完整下載驗 SHA；同手機安裝、首次素材下載、登入後重開、操作與持續效能記錄實際結果；保存版本、來源及限制，不複用 R25 的 PASS |

依[下載與安裝改善](download-delivery-plan.md)的現有工具驗同站下載、Range 與安裝頁。只改本文件時不需執行會抓 APK 的網站 build；實際切換 metadata 時才執行對應測試、build 和正式下載複驗。這份文件完成不代表新 APK 已打包或發布。
