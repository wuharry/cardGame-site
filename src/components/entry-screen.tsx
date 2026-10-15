import Image from "next/image";
import Link from "next/link";
import { BUILDS, downloadUrl } from "@/data/releases";
import { GAME_FACTS } from "@/data/game";
import { mediaUrl } from "@/data/media";

export function EntryScreen() {
  const available = BUILDS.filter((build) => downloadUrl(build));
  return (
    <section className="codex-hero" aria-labelledby="hero-title">
      <Image src={mediaUrl("/media/screens/town.webp")} alt="" fill preload sizes="100vw" className="hero-backdrop" />
      <div className="hero-shade" />
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="overline"><span className="status-dot" /> 獨立開發・試玩進行中</p>
          <p className="hero-english">DECKMARCH</p>
          <h1 id="hero-title">王牌戰線</h1>
          <div className="hero-rule" aria-hidden="true"><span>✦</span></div>
          <h2>落下的每張牌，<br />都是下一步伏筆。</h2>
          <p className="hero-description">四路佈陣，跨路交鋒。召喚從者、埋下伏印，<br className="desktop-break" />在對手以為勝券在握時，打出你的反擊。</p>
          <div className="hero-actions">
            <Link href="#download" className="codex-button">下載試玩 <span aria-hidden="true">↓</span></Link>
            <Link href="#about" className="codex-button ghost">探索遊戲 <span aria-hidden="true">↘</span></Link>
          </div>
          <p className="hero-platforms">{available.map((build) => build.platform).join(" / ") || "版本準備中"}<span>HD-2D 回合制卡牌對戰</span></p>
        </div>
        <div className="hero-cards" aria-label="遊戲原創卡圖：樹靈守衛、冰霜女巫、死靈法師">
          <div className="arcane-ring" aria-hidden="true" />
          {[
            { art: "treant_guardian", name: "樹靈守衛", en: "THE GUARDIAN", position: "left" },
            { art: "necromancer", name: "死靈法師", en: "THE NECROMANCER", position: "right" },
            { art: "frost_witch", name: "冰霜女巫", en: "THE FROST WITCH", position: "center" },
          ].map((card) => (
            <figure key={card.art} className={`hero-card hero-card-${card.position}`}>
              <div className="hero-card-art"><Image src={mediaUrl(`/media/cards/${card.art}.webp`)} alt="" fill sizes="(max-width: 700px) 52vw, 340px" loading="eager" /></div>
              <figcaption><span aria-hidden="true">✦</span><strong>{card.name}</strong><small>{card.en}</small></figcaption>
            </figure>
          ))}
          <span className="hero-art-caption">遊戲卡圖展示</span>
        </div>
      </div>
      <div className="hero-bottom"><span>STRATEGY WRITTEN IN EVERY CARD</span><a href="#news">向下探索 <span aria-hidden="true">↓</span></a></div>
      <div className="world-facts">
        <div><strong>{GAME_FACTS.lanes}</strong><span>路戰場<small>站位決定攻防</small></span></div>
        <div><strong>{GAME_FACTS.cards}</strong><span>種正式卡牌<small>構築自己的六十張</small></span></div>
        <div><strong>6</strong><span>種卡牌類型<small>從召喚到反制</small></span></div>
        <div><strong>3</strong><span>座立體戰場<small>像素角色・光影交織</small></span></div>
      </div>
    </section>
  );
}
