import { pageMetadata } from "@/data/seo";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PatchNotes } from "@/components/patch-notes";
import { BUILDS } from "@/data/releases";

export const metadata = pageMetadata("/news", "最新消息與更新紀錄", "王牌戰線的最新玩家版本、平台下載狀態與歷次開發更新。");

export default function NewsPage() {
  const suspended = BUILDS.filter((build) => build.status === "suspended");
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <header className="subpage-heading content-width">
          <p className="overline">NEWS & UPDATES</p>
          <h1>戰線新訊</h1>
          <p>每一次調整，每一頁進展。歷史紀錄保留發行當時的資訊；目前可取得的平台請以下載區為準。</p>
          <Link className="text-link" href="/#download">查看目前下載版本 →</Link>
          {suspended.map((build) => (
            <aside className="platform-notice" key={build.id}>
              <strong>{build.platform} 暫停下載</strong>
              <p>{build.note}</p>
            </aside>
          ))}
        </header>
        <PatchNotes />
      </main>
      <SiteFooter />
    </>
  );
}
