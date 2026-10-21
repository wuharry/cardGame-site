import Image from "next/image";
import Link from "next/link";
import { GAME_MODES } from "@/data/game";
import { mediaCaptureCaption, mediaUrl } from "@/data/media";
import { BUILDS, RELEASE_NOTES } from "@/data/releases";
import { FEEDBACK_URL } from "@/data/site";

export function LatestNews() {
  const latest = RELEASE_NOTES[0];
  const paused = BUILDS.find((build) => build.status === "suspended");
  const items = [
    { tag: "版本更新", date: latest.date, title: `${latest.version} 玩家版本資訊`, text: "查看各平台下載、啟動說明與這次更新的內容。", href: "/news", image: "/media/screens/arena-caverns.webp" },
    paused
      ? { tag: "重要公告", date: paused.updated, title: `${paused.platform} 版本暫停下載`, text: "實機測試發現效能與操作問題，修正完成後再開放下載。", href: `#download-${paused.id}`, image: "/media/screens/arena-frostlands.webp" }
      : { tag: "新手指南", date: null, title: "第一次玩，從這裡開始", text: "先認識出牌和攻擊，再慢慢試出自己的打法。", href: "/guide", image: "/media/screens/hero-battlefield.webp" },
    { tag: "試玩募集", date: null, title: "你的每一局，都讓遊戲更好", text: "哪張卡太強？哪裡卡住？歡迎留下最真實的想法。", href: "#support", image: "/media/screens/main-menu.webp" },
  ];
  return (
    <section id="news" className="news-section section-space">
      <div className="content-width">
        <header id="changelog" className="section-heading"><div><p className="overline">NEWS & UPDATES</p><h2>戰線新訊</h2></div><Link className="text-link" href="/news" prefetch={false}>所有更新 <span aria-hidden="true">↗</span></Link></header>
        <div className="news-grid">{items.map((item) => <Link href={item.href} prefetch={false} className="news-item" key={item.title}>
          <div className="news-image"><Image src={mediaUrl(item.image)} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" /><span className="news-arrow" aria-hidden="true">↗</span></div>
          <div className="news-meta"><span>{item.tag}</span>{item.date && <time dateTime={item.date}>{item.date.replaceAll("-", ".")}</time>}</div>
          <h3>{item.title}</h3><p>{item.text}</p>
        </Link>)}</div>
      </div>
    </section>
  );
}

export function GameIntroduction() {
  return (
    <section id="about" className="intro-section section-space">
      <div className="content-width">
        <header id="flow" className="section-heading centered"><p className="overline">A DIFFERENT KIND OF CARD BATTLE</p><h2>勝負，在出牌之前就已展開。</h2><p>同樣一張牌，站在哪裡、何時出手，都能改寫戰局。</p></header>
        <div id="lanes" className="battle-feature">
          <figure className="battle-image"><Image src={mediaUrl("/media/screens/hero-battlefield.webp")} alt="R11 四路前後排原生展示畫面，包含新版介面、HD-2D 從者與手牌" width={1280} height={720} sizes="(max-width: 900px) 100vw, 60vw" /><figcaption><span className="status-dot" /> IN-GAME CAPTURE <span>{mediaCaptureCaption("/media/screens/hero-battlefield.webp")}</span></figcaption></figure>
          <div className="battle-copy"><span className="chapter-number" aria-hidden="true">01</span><p className="overline">THE BATTLEFIELD</p><h3>站在哪裡，<br />和出哪張牌一樣重要。</h3><p>把夥伴放到前排保護後排，再找機會突破對手的防線。不必只盯著正前方，也能攻擊其他路線。</p><Link className="text-link" href="/guide#lanes" prefetch={false}>看看怎麼進攻 <span aria-hidden="true">→</span></Link></div>
        </div>
        <div className="tactics-grid">
          <article id="systems"><span className="tactic-index">02 / COUNTERPLAY</span><h3>對手出手時，<br />你也有機會反擊。</h3><p>別急著用光魔力。對手施放秘術時，你可以選擇用瞬咒反制；對攻擊、召喚等事件的瞬咒，則在第一次符合卡牌條件且魔力足夠時自動發動。</p><Link className="text-link" href="/guide#cards" prefetch={false}>認識反制與伏印 <span aria-hidden="true">→</span></Link></article>
          <article id="collection"><span className="tactic-index">03 / YOUR COLLECTION</span><h3>收集喜歡的卡，<br />試出自己的組合。</h3><p>完成新手教學，先拿一副 60 張起始牌組。一般對戰不會失去卡牌；新的奪牌對局暫停，既有戰利品仍可領取。</p><Link className="text-link" href="/guide#collection" prefetch={false}>了解組牌與對戰模式 <span aria-hidden="true">→</span></Link></article>
        </div>
      </div>
    </section>
  );
}

export function ModesOverview() {
  return (
    <section id="modes" className="modes-section section-space">
      <div className="content-width">
        <header className="section-heading"><div><p className="overline">FIND YOUR NEXT OPPONENT</p><h2>先練一局，再邀朋友入席。</h2></div><Link className="text-link" href="/guide#modes" prefetch={false}>對戰指南 <span aria-hidden="true">↗</span></Link></header>
        <div className="modes-grid">{GAME_MODES.map((mode, index) => <article key={mode.en}>
          <span className="mode-number" aria-hidden="true">0{index + 1}</span><p className="overline">{mode.en}</p><h3>{mode.zh}</h3><p>{mode.body}</p><small>{mode.meta}</small>
        </article>)}</div>
      </div>
    </section>
  );
}

export function PlayerSupport() {
  return (
    <section id="support" className="support-section section-space">
      <div className="content-width support-layout">
        <div><p className="overline">LET’S MAKE IT BETTER</p><h2>下一場好對局，<br />從你的回饋開始。</h2><p>這是持續開發中的獨立遊戲。好玩的地方、讓你挫折的時刻，或一個不合理的組合，我都想知道。</p><a href={FEEDBACK_URL} className="codex-button" target="_blank" rel="noopener noreferrer">填寫試玩回饋 <span aria-hidden="true">↗</span></a><small>Google 表單・可匿名・也能選填聯絡方式</small></div>
        <div className="feedback-topics">
          <article><span aria-hidden="true">01</span><div><h3>無法啟動、閃退或卡死</h3><p>留下遊戲版本、裝置與發生前的操作。錯誤訊息或診斷日誌能幫助重現問題。</p></div></article>
          <article><span aria-hidden="true">02</span><div><h3>卡牌平衡與對局 Bug</h3><p>勾選你覺得不合理的卡牌，也可以補充對局情境與原因，幫助我判斷如何調整。</p></div></article>
          <article><span aria-hidden="true">03</span><div><h3>任何你想說的話</h3><p>不用整理成完整報告。哪裡不好玩、哪裡想再玩，都值得留下來。謝謝你願意試玩。</p></div></article>
        </div>
      </div>
    </section>
  );
}
