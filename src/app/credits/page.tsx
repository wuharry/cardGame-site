import { pageMetadata } from "@/data/seo";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import credits from "@/data/credits.json";

export const metadata = pageMetadata("/credits", "製作群與素材授權", "王牌戰線的素材作者、原始來源、使用方式與授權聲明。");

export default function CreditsPage() {
  return (
    <>
      <main id="main-content" className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
        <Link href="/" className="text-sm text-brass-hi underline underline-offset-4">返回官網</Link>
        <p className="hud-label mt-10">Credits &amp; licenses</p>
        <h1 className="mt-3 text-3xl text-parchment sm:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>製作群與素材授權</h1>
        <p className="mt-6 leading-8 text-quill">感謝以下作者提供遊戲使用的素材與工具。改作素材仍保留原作者及原授權；購買素材不代表取得其獨占權利。</p>

        <section aria-labelledby="copyright" className="mt-12 rounded border border-rule-soft bg-board p-6">
          <h2 id="copyright" className="text-xl text-parchment">著作權聲明</h2>
          <p className="mt-4 whitespace-pre-line leading-8 text-quill">{credits.copyright}</p>
        </section>

        {credits.groups.map((group) => (
          <section key={group.title} className="mt-14">
            <h2 className="border-b border-rule-soft pb-4 text-xl text-parchment">{group.title}</h2>
            <ul className="divide-y divide-rule-soft">
              {group.entries.map((entry) => (
                <li key={entry.name} className="py-6">
                  <h3 className="text-lg text-parchment">{entry.name}</h3>
                  <p className="mt-2 break-words text-brass-hi">{entry.by}</p>
                  <p className="mt-2 text-sm leading-7 text-quill">{entry.license}</p>
                  {entry.note && <p className="mt-2 break-words text-sm leading-7 text-quill">{entry.note}</p>}
                  <a href={entry.link} className="mt-3 inline-block break-all text-sm text-brass-hi underline underline-offset-4">來源與授權</a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-10 border-t border-rule-soft pt-8 text-sm leading-8 text-quill">
          <h2 className="text-lg text-parchment">完整來源紀錄</h2>
          <p className="mt-3">下載包與遊戲內「製作群」同樣提供署名。來源未確認的水面照片與備用卡框已排除玩家包；目前水面使用程序水紋。主選單原配樂已移除，戰鬥配樂仍保留。</p>
          <p className="mt-3">網站字型採 SIL Open Font License 1.1：
            <a href="/licenses/Noto-Serif-TC-OFL.txt" className="underline underline-offset-4">Noto Serif TC</a>、
            <a href="/licenses/cinzel-OFL.txt" className="underline underline-offset-4">Cinzel</a>、
            <a href="/licenses/barlow-OFL.txt" className="underline underline-offset-4">Barlow</a>、
            <a href="/licenses/barlowcondensed-OFL.txt" className="underline underline-offset-4">Barlow Condensed</a>。
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <a href="/licenses/CREDITS.md" className="text-brass-hi underline underline-offset-4">完整素材清單</a>
            <a href="/licenses/third-party-provenance-20261013.md" className="text-brass-hi underline underline-offset-4">來源核對紀錄</a>
            <Link href="/#download" className="text-brass-hi underline underline-offset-4">下載遊戲</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
