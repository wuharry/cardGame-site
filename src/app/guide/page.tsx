import { pageMetadata } from "@/data/seo";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { TurnFlow } from "@/components/turn-flow";
import { LaneDoctrine } from "@/components/lane-doctrine";
import { CardTypeShowcase } from "@/components/card-types";
import { SystemsPanel } from "@/components/systems-panel";
import { CollectionPanel } from "@/components/collection-panel";
import { GameModes } from "@/components/game-modes";
import { SiteFooter } from "@/components/site-footer";

export const metadata = pageMetadata("/guide", "新手指南", "從第一副六十張牌開始，認識紙鴉牌的四路站位、六種卡型、反制時機與正式對戰奪卡規則。");

const CHAPTERS = [
  { href: "flow", label: "回合流程" },
  { href: "lanes", label: "四路站位" },
  { href: "cards", label: "六種卡型" },
  { href: "systems", label: "行動與資源" },
  { href: "collection", label: "組牌與奪卡" },
  { href: "modes", label: "對戰模式" },
];

export default function GuidePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <header className="subpage-heading content-width">
          <p className="overline">THE FIRST CHAPTER</p>
          <h1>每個高手，都從第一張牌開始。</h1>
          <p>先從主選單的「新手教學」開始，完成後取得 60 張起始牌組，再和 AI 練習。封面下載素材時，也能先讀內建的八章圖解說明書。</p>
          <nav aria-label="指南章節">
            {CHAPTERS.map((item) => (
              <a key={item.href} href={`#${item.href}`}>{item.label} ↓</a>
            ))}
          </nav>
          <Link className="text-link" href="/#download">已經準備好了？下載試玩 →</Link>
        </header>
        <TurnFlow />
        <LaneDoctrine />
        <CardTypeShowcase />
        <SystemsPanel />
        <CollectionPanel />
        <GameModes />
      </main>
      <SiteFooter />
    </>
  );
}
