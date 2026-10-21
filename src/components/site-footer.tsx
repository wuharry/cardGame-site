import Link from "next/link";
import Image from "next/image";
import { FEEDBACK_URL } from "@/data/site";
import { DownloadLink } from "@/components/download-link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="content-width">
        <div className="footer-top">
          <Link href="/#main-content" className="site-brand">
            <Image className="brand-mark" src="/apple-icon.png" alt="" width={40} height={40} sizes="40px" />
            <span>紙鴉牌<small>DECKMARCH</small></span>
          </Link>
          <p>四路交鋒，每張牌都是機會。</p>
          <a className="back-top" href="#main-content" aria-label="回到頁面頂端">↑</a>
        </div>
        <div className="footer-bottom">
          <nav aria-label="頁尾導覽">
            <Link href="/guide" prefetch={false}>新手指南</Link>
            <Link href="/news" prefetch={false}>最新消息</Link>
            <DownloadLink>遊戲下載</DownloadLink>
            <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">試玩回饋 ↗</a>
            <Link href="/credits" prefetch={false}>製作群與授權</Link>
          </nav>
          <p>個人開發專案 · 遊戲開發中，內容將持續調整。</p>
          <p>© 2026 Harvey · 紙鴉牌。原創且依法受保護的內容保留相關權利；第三方素材依各自授權使用。</p>
          <p className="footer-credits">
            Godot Engine · MIT / Noto Serif TC · Cinzel · Barlow /
            Icons by Andrey Kalyuzhnyy · Matt Firth (shikashipx) · game-icons.net · CC BY 3.0 / 4.0。
            <Link href="/credits" prefetch={false}>查看作者、來源與授權聲明</Link>。
          </p>
        </div>
      </div>
    </footer>
  );
}
