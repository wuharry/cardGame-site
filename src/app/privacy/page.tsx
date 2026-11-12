import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { pageMetadata } from "@/data/seo";

export const metadata = pageMetadata("/privacy", "隱私權政策", "紙鴉牌如何處理帳號、遊玩紀錄與裝置資料，以及如何申請刪除。");

export default function PrivacyPage() {
  return <>
    <main id="main-content" className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <Link href="/" className="text-brass-hi underline underline-offset-4">返回官網</Link>
      <p className="hud-label mt-10">Your data &amp; privacy</p>
      <h1 className="mt-3 font-serif text-3xl text-parchment">隱私權政策</h1>
      <p className="mt-4 text-sm text-quill">紙鴉牌 DECKMARCH · 更新日期：2026 年 11 月 12 日</p>
      <div className="mt-8 space-y-9 leading-8 text-quill">
        <section><h2 className="text-xl text-parchment">誰負責你的資料</h2>
          <p className="mt-3">紙鴉牌遊戲與本官網由個人開發者 Harvey 維護。本政策涵蓋遊戲、帳號服務與官網；外部回饋表單和下載平台另適用各服務的政策。</p>
          <p>隱私、資料查詢、更正或刪除請聯絡 <a className="break-all text-brass-hi underline" href="mailto:whw880218we@gmail.com">whw880218we@gmail.com</a>。請勿寄送密碼或驗證碼。</p>
        </section>
        <section><h2 className="text-xl text-parchment">我們處理哪些資料、用來做什麼</h2>
          <ul className="mt-3 list-disc space-y-3 pl-5">
            <li><strong className="text-parchment">帳號：</strong>Email、帳號識別碼、驗證與登入紀錄，用於登入、保存雲端收藏、錢包、外觀商品、信件與獎勵，及處理客服。登入憑證用於維持工作階段，不會公開。</li>
            <li><strong className="text-parchment">正式對戰：</strong>參戰帳號、入場牌組、模式、版本、勝敗、時長、回合與逐卡統計，用於對戰結算、天梯、獎勵、平衡分析及防止重複領取。</li>
            <li><strong className="text-parchment">選用的遊玩統計：</strong>隨機裝置識別碼、平台、遊戲版本、啟動次數、遊玩時間、教學步驟、單人／區網等遊玩結果與卡牌統計，用於找出教學卡關與遊戲問題。預設開啟，可在遊戲「設定 → 操作與隱私」關閉；關閉不影響遊玩，亦不會刪除先前已送出的紀錄。正式線上對戰結算仍會保存。</li>
            <li><strong className="text-parchment">遊客：</strong>遊客統計不附帶 Email、暱稱或本機收藏；隨機識別碼仍可辨認同一安裝的活動，並非完全無法連結的資料。登入後的遊玩紀錄可以歸到該帳號；在 Demo 鑽石申請中，只有另外同意並驗證裝置身分後，才會連結過去的遊客統計。</li>
            <li><strong className="text-parchment">Demo 鑽石申請：</strong>申請識別碼、隨機裝置識別碼、驗證資訊摘要、綁定帳號、申請狀態及人工處理紀錄，用於防止重複申請並發放獎勵。Demo 結束會停止此功能。</li>
            <li><strong className="text-parchment">裝置本機：</strong>暱稱、外觀選擇、牌組草稿、離線收藏快取、教學與單人續玩進度及設定，主要保存在裝置。部分功能可產生本機備份或診斷檔；不會因為登入就全部自動上傳。</li>
            <li><strong className="text-parchment">連線：</strong>網站、登入、下載與遊戲伺服器為提供服務及維護安全，會處理連線 IP、請求時間及技術日誌。這些資料可能由代管服務保存，不等同遊戲內可關閉的遊玩統計。</li>
          </ul>
        </section>
        <section><h2 className="text-xl text-parchment">服務提供者與資料安全</h2>
          <p className="mt-3">我們使用 Supabase 提供登入與資料庫、Vercel 提供官網，以及 GitHub 提供遊戲下載；Email 驗證亦經由寄信服務處理。外部回饋入口使用 Google Forms。這些服務可能在你所在地以外處理資料，並依各自的服務及安全政策運作。</p>
          <p className="mt-3">我們不販售玩家資料，也不使用廣告追蹤 SDK。管理功能限制授權人員存取；資料透過加密連線傳送。支援的平台使用作業系統安全儲存維持登入，安全儲存不可用時不降級成明文保存憑證。任何系統都無法保證絕對安全。</p>
        </section>
        <section><h2 className="text-xl text-parchment">保存與刪除</h2>
          <p className="mt-3">帳號及遊戲資料在提供服務期間保存。你可以從遊戲「玩家資料 → 帳號管理 → 刪除帳號」開始，或直接使用<a href="/account/delete" className="text-brass-hi underline">刪除帳號頁面</a>。驗證信箱並確認後，系統刪除帳號、雲端收藏、貨幣、外觀權益、獎勵、個人進度及可連結的遊玩資料，不能復原。</p>
          <p className="mt-3">涉及對手的對戰結果會移除你的帳號連結，以保留對手的勝敗。無法再連結個人的彙總結果可以保留。代管服務的安全日誌與備份受其保存週期限制，刪帳不代表所有備份立即抹除；如因法律義務必須保留特定資料，將限制其使用於該目的。</p>
          <p className="mt-3">為防止舊裝置把已刪除的遊客統計重新上傳，系統保留已撤銷裝置識別碼的單向雜湊摘要，不附帳號、Email 或遊玩內容。遊戲內刪帳也會關閉此裝置的選用統計。</p>
          <p className="mt-3">網頁無法清除裝置中的離線檔案或你另存的備份；在遊戲內完成刪帳後，會清理該帳號的本機收藏快取、牌組、續玩存檔與待送紀錄。其他裝置、遊客資料及自行備份需由你另外移除。未連結帳號的遊客可來信提出資料刪除要求，並提供遊客識別碼；我們會確認身分，避免刪除別人的資料。請勿在公開回饋區貼出私人資訊。</p>
        </section>
        <section><h2 className="text-xl text-parchment">你的選擇與政策更新</h2>
          <p className="mt-3">你可以使用遊客模式、關閉選用統計、登出、申請帳號刪除，或來信要求查詢與更正自己的資料。我們可能需要驗證你對帳號或裝置的控制權。遊戲目前不處理真實金錢付款；未來若新增付款或其他資料用途，會更新本政策與相關告知。</p>
          <p className="mt-3">本頁會標示更新日期。涉及資料用途的重大變更會透過官網或遊戲內通知說明，並在需要時另行取得同意。</p>
        </section>
      </div>
    </main>
    <SiteFooter />
  </>;
}
