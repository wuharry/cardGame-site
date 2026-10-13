import Image from "next/image";
import Link from "next/link";
import { BUILDS, buildStatusText, downloadUrl } from "@/data/releases";
import { GAME_FACTS } from "@/data/game";
import { mediaUrl } from "@/data/media";

/**
 * Section 01 — 遊戲入口。
 * 主選單氛圍：暗場景 + 羊皮紙色明體 + 3大核心戰略亮點速覽。
 */
export function EntryScreen() {
  const windows = BUILDS[0];

  return (
    <section className="vignette grain relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden">
      <Image
        src={mediaUrl("/media/screens/hero-battlefield.webp")}
        alt="遊戲實機畫面：四條路線的前後排戰場與卡牌手牌"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-60"
      />
      {/* 純色遮罩 */}
      <div className="absolute inset-0 bg-ink/45" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <p className="eyebrow">HD-2D · Turn-based Tactical Battler</p>

        <h1
          className="mt-6 text-[clamp(2.75rem,11vw,5.5rem)] leading-none font-bold tracking-[0.16em] text-parchment"
          style={{
            fontFamily: "var(--font-serif)",
            textShadow: "0 2px 24px rgb(13 11 9 / 0.9)",
          }}
        >
          暮色秘典
        </h1>

        <div className="menu-rule mt-6 w-[min(30rem,80vw)]" />

        <p
          className="mt-4 text-xs tracking-[0.42em] text-quill uppercase"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Twilight&nbsp;Codex
        </p>

        <p
          className="mt-6 max-w-lg text-base leading-relaxed text-parchment/90 sm:text-lg"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          四條路線，自由指定目標；前排掩護後排，破路直擊英雄。
          <br />
          在對手出牌時留魔反制，贏下死鬥奪走對手的卡牌！
        </p>

        {/* 三大核心特色速覽膠囊 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-xl">
          <span className="plate px-3 py-1 text-xs text-brass-hi border border-brass-dim/80">
            ⚔️ <strong>四路戰場</strong> · 自由跨路選目標
          </span>
          <span className="plate px-3 py-1 text-xs text-parchment border border-rule">
            🛡️ <strong>三卡疊合</strong> · 從者 + 靈裝 + 隱秘伏印
          </span>
          <span className="plate px-3 py-1 text-xs text-crimson-hi border border-crimson-dim/80">
            🏆 <strong>硬派奪卡</strong> · 勝者掠奪敗者牌庫
          </span>
        </div>

        <p className="mt-5 text-[0.82rem] text-quill">
          規則不用在這裡讀完 —— 遊戲主選單有八章圖解的「新手教學」。
        </p>

        {/* 遊戲主選單文字導航 */}
        <nav className="mt-10 w-[min(24rem,84vw)]">
          <MenuItem href="#download" primary>
            {downloadUrl(windows) ? "下載 Windows／macOS 版" : "遊戲下載資訊"}
          </MenuItem>
          <MenuItem href="#flow">一回合四步</MenuItem>
          <MenuItem href="#lanes">四路交鋒演練</MenuItem>
          <MenuItem href="#cards">六種卡型</MenuItem>
        </nav>
      </div>

      {/* 底部資訊條 */}
      <div className="relative z-10 border-t border-rule-soft bg-ink/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-3">
          <Meta label="Build" value={`Windows／macOS ZIP · ${buildStatusText(windows)}`} />
          <Meta label="Engine" value={`${GAME_FACTS.engine} · Forward+`} />
          <Meta label="Cards" value={`${GAME_FACTS.cards} 種 + ${GAME_FACTS.tokens} 衍生物`} />
          <Meta label="Lanes" value={String(GAME_FACTS.lanes)} />
        </div>
      </div>
    </section>
  );
}

function MenuItem({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="group block py-0.5">
      <span
        className={`menu-rule block ${primary ? "menu-rule-lit" : "opacity-0 transition-opacity group-hover:opacity-100"}`}
      />
      <span
        className={`block py-2.5 text-base tracking-[0.24em] transition-colors sm:text-lg ${
          primary
            ? "text-brass-hi font-bold"
            : "text-quill group-hover:text-parchment"
        }`}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {children}
      </span>
      <span
        className={`menu-rule block ${primary ? "menu-rule-lit" : "opacity-0 transition-opacity group-hover:opacity-100"}`}
      />
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="hud-label">{label}</span>
      <span className="hud-value text-sm">{value}</span>
    </div>
  );
}
