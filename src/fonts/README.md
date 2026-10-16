# 官網中文明體

Noto Serif TC，SIL Open Font License 1.1。原始授權保留於 `/public/licenses/NotoSerifTC-OFL.txt`；來源與 SHA-256 在 `manifest.json`。

使用 Google Fonts 官方 `text=` API，從官網**公開靜態文案**建立 WOFF2 子集，字重 400–700 共用 variable font。首屏與緊接的消息用字獨立一片，其餘用字另外分片；CSS 透過 unicode-range 選字、font-display: swap 先顯示後備字型。檔案由本站提供，不依賴玩家連線 Google Fonts。

新的文案若有子集外的字，瀏覽器會使用系統後備字型，不會把玩家名稱裁成缺字。後台玩家資料維持系統字型，絕不送給字型 API。

公開文案大幅更新後，在網站根目錄執行：

```bash
node scripts/prepare-site-font.mjs
```

只使用既有 Node fetch，無新增依賴。重新生成會連線 Google Fonts 下載公開字型；日常 build 使用已提交檔案，不會重新下載整套 CJK 字型。若 API 回傳完整字族而非精簡子集，腳本會拒絕輸出。
