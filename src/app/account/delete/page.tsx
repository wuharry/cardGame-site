import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { pageMetadata } from "@/data/seo";
import { DeletionForm } from "./deletion-form";

export const metadata = pageMetadata("/account/delete", "刪除帳號", "驗證帳號信箱並永久刪除紙鴉牌帳號與相關資料，不必重新安裝遊戲。");

export default function DeleteAccountPage() {
  return <>
    <main id="main-content" className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
      <Link href="/" className="text-brass-hi underline underline-offset-4">返回官網</Link>
      <p className="hud-label mt-10">Account &amp; data deletion</p>
      <h1 className="mt-3 font-serif text-3xl text-parchment">刪除紙鴉牌帳號</h1>
      <p className="mt-5 leading-8 text-quill">不必重新安裝遊戲。以原帳號信箱收取驗證碼，再確認永久刪除；寄送驗證碼本身不會刪除資料。</p>
      <DeletionForm />
      <section className="mt-10 space-y-4 leading-8 text-quill">
        <h2 className="text-xl text-parchment">刪除範圍</h2>
        <p>會刪除登入帳號、雲端收藏與貨幣、外觀權益、獎勵、信件、個人進度與已連結的遊客紀錄。對手的對戰結果移除你的帳號連結後保留；代管備份及安全日誌依服務保存週期處理。</p>
        <p>網頁無法清除手機、電腦或自行備份中的離線檔案。請另行移除；重新用同一 Email 註冊不會恢復舊資料。</p>
        <h2 className="text-xl text-parchment">收不到驗證碼，或使用遊客模式？</h2>
        <p>請寄信至 <a href="mailto:whw880218we@gmail.com?subject=紙鴉牌資料刪除申請" className="break-all text-brass-hi underline">whw880218we@gmail.com</a>，說明要刪除的帳號或遊客識別碼。我們會驗證身分後處理；不要寄送密碼或驗證碼。</p>
        <Link className="text-brass-hi underline" href="/privacy">閱讀完整隱私權政策</Link>
      </section>
    </main>
    <SiteFooter />
  </>;
}
