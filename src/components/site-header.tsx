"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const NAV = [
  { href: "/#about", label: "遊戲介紹" },
  { href: "/#cards", label: "卡牌秘典" },
  { href: "/#arenas", label: "實機畫面" },
  { href: "/news", label: "最新消息" },
  { href: "/guide", label: "新手指南" },
  { href: "/#support", label: "玩家回饋" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header className="site-header" onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <a className="skip-link" href="#main-content">跳到主要內容</a>
      <div className="header-inner">
        <Link href="/#main-content" className="site-brand" aria-label="暮色秘典首頁" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>暮色秘典<small>TWILIGHT CODEX</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="主要導覽">
          {NAV.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <Link href="/#download" className="header-download" onClick={() => setOpen(false)}>下載試玩 <span aria-hidden="true">↗</span></Link>
        <button ref={toggle} type="button" className="menu-toggle" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "關閉導覽選單" : "開啟導覽選單"} onClick={() => setOpen(!open)}>
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>
      <nav id="mobile-nav" className="mobile-nav" aria-label="手機導覽" hidden={!open}>
        {NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}<span aria-hidden="true">↗</span></Link>)}
      </nav>
    </header>
  );
}
