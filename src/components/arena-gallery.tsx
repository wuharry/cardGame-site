"use client";

import Image from "next/image";
import { useState } from "react";
import { ARENAS } from "@/data/game";
import { mediaCaptureCaption, mediaUrl } from "@/data/media";
import { ScreenshotViewer } from "@/components/screenshot-viewer";

export function ArenaGallery() {
  const [selected, setSelected] = useState(0);
  const arena = ARENAS[selected];
  const capture = mediaCaptureCaption(arena.image);
  return (
    <section id="arenas" className="arena-gallery section-space" aria-labelledby="arenas-title">
      <div className="content-width">
        <header className="section-heading"><div><p className="overline">A WORLD BEYOND THE CARDS</p><h2 id="arenas-title">讓每一次交鋒，都有風景。</h2></div><p>像素角色，立體地形。<br />從林間溪流，走進洞窟與冰原。</p></header>
        <div className="arena-selectors" role="group" aria-label="選擇戰場畫面">{ARENAS.map((item, index) => (
          <button key={item.en} type="button" aria-pressed={selected === index} aria-controls="arena-preview" onClick={() => setSelected(index)}>
            <span className="arena-thumbnail"><Image src={mediaUrl(item.image)} alt="" fill sizes="(max-width: 700px) 30vw, 380px" /></span>
            <span className="arena-selector-label"><span>0{index + 1}</span><strong>{item.zh}</strong><small>{item.en}</small></span>
          </button>
        ))}</div>
        <figure id="arena-preview"><div className="arena-preview-image"><ScreenshotViewer key={arena.en} source={arena.image}
          alt={`${arena.zh}四路戰場`} caption={`${capture}。不同平台與畫質設定的效果可能不同。`}
          sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1000px) calc(100vw - 64px), (max-width: 1296px) calc(100vw - 96px), 1200px" /></div>
          <figcaption aria-live="polite"><div><strong>{arena.zh}</strong><span>{arena.note}</span></div><small>{capture}。不同平台與畫質設定的效果可能不同。</small></figcaption></figure>
      </div>
    </section>
  );
}
