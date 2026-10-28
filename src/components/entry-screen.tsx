import Image from "next/image";
import Link from "next/link";
import { BUILDS, buildStatusText, downloadUrl } from "@/data/releases";
import { GAME_FACTS } from "@/data/game";
import { mediaCaptureCaption, mediaUrl } from "@/data/media";
import { DownloadLink } from "@/components/download-link";

export function EntryScreen() {
  const available = BUILDS.filter((build) => downloadUrl(build));
  const paused = BUILDS.find((build) => build.status === "suspended");
  return (
    <section className="codex-hero" aria-labelledby="hero-title">
      <Image src={mediaUrl("/media/screens/town.webp")} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="hero-backdrop" />
      <div className="hero-shade" />
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="overline"><span className="status-dot" /> 獨立開發・{available.length ? "試玩進行中" : "下載暫停"}</p>
          <p className="hero-english">DECKMARCH</p>
          <h1 id="hero-title">紙鴉牌</h1>
          <div className="hero-rule" aria-hidden="true"><span>✦</span></div>
          <h2>落下的每張牌，<br />都是下一步伏筆。</h2>
          <p className="hero-description">召喚夥伴、搭配法術，組出自己的打法。<br className="desktop-break" />先和電腦練習，再約朋友玩一局。</p>
          <div className="hero-actions">
            {available.length ? <DownloadLink className="codex-button">下載試玩 <span aria-hidden="true">↓</span></DownloadLink>
              : <button type="button" disabled className="codex-button">{paused ? buildStatusText(paused) : "版本準備中"}</button>}
            <Link href="#about" className="codex-button ghost">探索遊戲 <span aria-hidden="true">↘</span></Link>
          </div>
          {!available.length && paused && <p lang="en" className="hero-platforms">{buildStatusText(paused, "en")}</p>}
          <p className="hero-platforms">{available.map((build) => build.platform).join(" / ") || "各平台暫停下載"}<span>免費試玩 · 回合制卡牌對戰</span></p>
        </div>
        <div className="hero-showcase">
          <div className="hero-showcase-heading"><span className="overline">IN-GAME CAPTURE</span><span>四路戰場 · HD-2D</span></div>
          <a className="hero-game-preview" href="#arenas" aria-label="查看最新實機戰場畫面">
            <Image src={mediaUrl("/media/screens/hero-battlefield.webp")} alt="紙鴉牌森林戰場：四路前後排、從者攻血徽記與手牌"
              width={1920} height={1080} sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1400px) 54vw, 720px" loading="eager" />
            <span>探索戰場 <span aria-hidden="true">↗</span></span>
          </a>
          <p className="hero-capture-caption">{mediaCaptureCaption("/media/screens/hero-battlefield.webp")}</p>
          <div className="hero-art-strip" aria-label="遊戲卡圖：樹靈守衛、冰霜女巫、死靈法師">
          {[
            { art: "treant_guardian", name: "樹靈守衛" },
            { art: "necromancer", name: "死靈法師" },
            { art: "frost_witch", name: "冰霜女巫" },
          ].map((card) => (
            <figure key={card.art}>
              <div><Image src={mediaUrl(`/media/cards/${card.art}.webp`)} alt="" fill sizes="(max-width: 700px) 28vw, 220px" loading="lazy" fetchPriority="low" /></div>
              <figcaption>{card.name}</figcaption>
            </figure>
          ))}
          </div>
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
