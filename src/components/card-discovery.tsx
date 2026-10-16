"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CARD_TYPES, GAME_FACTS, cardType } from "@/data/game";
import { mediaUrl } from "@/data/media";

export function CardDiscovery() {
  const [selected, setSelected] = useState(CARD_TYPES[0].id);
  const card = cardType(selected);
  return (
    <section id="cards" className="card-discovery section-space" aria-labelledby="cards-title">
      <div className="content-width">
        <header className="section-heading"><div><p className="overline">THE CARDS</p><h2 id="cards-title">每張卡，都有它的角色。</h2></div><p>{GAME_FACTS.cards} 種正式卡牌 · 六種卡型<br />從正面迎戰，到藏在暗處的下一手。</p></header>
        <div className="card-selectors" role="group" aria-label="選擇卡牌類型">
          {CARD_TYPES.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === item.id} aria-controls="card-description" onClick={() => setSelected(item.id)}><span>0{index + 1}</span>{item.zh}<small>{item.en}</small></button>)}
        </div>
        <div className="card-display" id="card-description">
          <div className="codex-art"><Image key={card.id} src={mediaUrl(card.art)} alt={card.artAlt} fill sizes="(max-width: 700px) 100vw, 55vw" /><span>DECKMARCH / {card.en.toUpperCase()}</span></div>
          <div className="codex-description" aria-live="polite" aria-atomic="true"><span className="codex-symbol" aria-hidden="true">✦</span><p className="overline">{card.en}</p><h3>{card.zh}</h3><p>{card.rule}</p><dl><dt>出牌時機</dt><dd>{card.timing}</dd></dl><Link href="/guide#cards" prefetch={false} className="text-link">查看卡型與搭配 <span aria-hidden="true">→</span></Link></div>
        </div>
        <p className="card-discovery-note">卡圖為遊戲素材展示；完整卡片數值與效果以遊戲內說明為準。</p>
      </div>
    </section>
  );
}
