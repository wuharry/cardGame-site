"use client";

import Image from "next/image";
import { useState } from "react";
import { ARENAS } from "@/data/game";
import { mediaCaptureCaption, mediaUrl } from "@/data/media";

export function ArenaGallery() {
  const [selected, setSelected] = useState(0);
  const arena = ARENAS[selected];
  const capture = mediaCaptureCaption(arena.image);
  return (
    <section id="arenas" className="arena-gallery section-space" aria-labelledby="arenas-title">
      <div className="content-width">
        <header className="section-heading"><div><p className="overline">A WORLD BEYOND THE CARDS</p><h2 id="arenas-title">讓每一次交鋒，都有風景。</h2></div><p>像素角色，立體地形。<br />從林間溪流，走進洞窟與冰原。</p></header>
        <div className="arena-selectors" role="group" aria-label="選擇戰場畫面">{ARENAS.map((item, index) => <button key={item.en} type="button" aria-pressed={selected === index} aria-controls="arena-preview" onClick={() => setSelected(index)}><span>0{index + 1}</span>{item.zh}<small>{item.en}</small></button>)}</div>
        <figure id="arena-preview"><div className="arena-preview-image"><Image key={arena.en} src={mediaUrl(arena.image)} alt={`${arena.zh}四路戰場：${capture}`} fill sizes="(max-width: 1200px) 100vw, 1200px" /></div><figcaption aria-live="polite"><div><strong>{arena.zh}</strong><span>{arena.note}</span></div><small>{capture}。不同平台與畫質設定的效果可能不同。</small></figcaption></figure>
      </div>
    </section>
  );
}
