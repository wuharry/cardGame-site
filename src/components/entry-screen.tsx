import Image from "next/image";
import Link from "next/link";
import { BUILDS, buildStatusText, downloadUrl } from "@/data/releases";
import { GAME_FACTS } from "@/data/game";
import { mediaUrl } from "@/data/media";

/**
 * Section 01 — 遊戲入口。
 * 這一屏刻意做成遊戲自己的主選單：暗場景 + 置中的明體文字選單 + 髮絲線。
 * 不是產品 hero，是「按下開始遊戲」的那個畫面。
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
      {/* 純色遮罩，不是漸層：讓標題在任何戰場截圖上都讀得到 */}
      <div className="absolute inset-0 bg-ink/45" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-24 text-center">
        <p className="eyebrow">HD-2D · Turn-based Card Battler</p>

        <h1
          className="mt-7 text-[clamp(2.75rem,11vw,5.5rem)] leading-none font-bold tracking-[0.16em] text-parchment"
          style={{
            fontFamily: "var(--font-serif)",
            textShadow: "0 2px 24px rgb(13 11 9 / 0.9)",
          }}
        >
          暮色秘典
        </h1>

        <div className="menu-rule mt-7 w-[min(30rem,80vw)]" />

        <p
          className="mt-4 text-xs tracking-[0.42em] text-quill uppercase"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Twilight&nbsp;Codex
        </p>

        <p
          className="mt-10 max-w-md text-base leading-relaxed text-parchment/85 sm:text-lg"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          四條路線，自由選擇攻擊目標。
          <br className="sm:hidden" />
          前排守住後排，空路威脅本體。
        </p>

        {/* 遊戲主選單那組文字選單：選中項上下各一條被點亮的髮絲線。 */}
        <nav className="mt-12 w-[min(24rem,84vw)]">
          <MenuItem href="#download" primary>
            {downloadUrl(windows) ? "下載 Windows 版" : "Windows 版下載資訊"}
          </MenuItem>
          <MenuItem href="#lanes">看戰場怎麼運作</MenuItem>
          <MenuItem href="#modes">對戰模式</MenuItem>
        </nav>
      </div>

      {/* 底部資訊條：把「這是什麼版本、能不能拿」直接放在第一屏。 */}
      <div className="relative z-10 border-t border-rule-soft bg-ink/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-3">
          <Meta label="Build" value={`Windows ZIP · ${buildStatusText(windows)}`} />
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
    <Link href={href} className="group block py-1">
      <span
        className={`menu-rule block ${primary ? "menu-rule-lit" : "opacity-0 transition-opacity group-hover:opacity-100"}`}
      />
      <span
        className={`block py-3 text-lg tracking-[0.28em] transition-colors ${
          primary
            ? "text-brass-hi"
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
