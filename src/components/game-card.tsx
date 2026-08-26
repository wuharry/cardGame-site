import Image from "next/image";

/**
 * 一張實體卡。比例、卡圖窗、費用菱形、攻血四角都照遊戲裡的卡面來。
 * 這是全站唯一的「卡片」元件——其他區塊不准長成卡片的樣子。
 */
export function GameCard({
  art,
  alt,
  name,
  cost,
  atk,
  hp,
  stamp,
  faceDown = false,
  className = "",
  sizes = "(max-width: 1024px) 60vw, 320px",
}: {
  art?: string;
  alt?: string;
  name?: string;
  cost?: number;
  atk?: number;
  hp?: number;
  /** 非從者卡的卡型印章 */
  stamp?: string;
  faceDown?: boolean;
  className?: string;
  sizes?: string;
}) {
  if (faceDown) {
    return (
      <div
        className={`card-frame rest-on-table relative aspect-[5/7] overflow-hidden bg-panel-hi ${className}`}
      >
        {/* 卡背：同心細框，中央一枚封印。沒有圖案就不要用漸層填空。 */}
        <div className="absolute inset-3 border border-brass-dim/60" />
        <div className="absolute inset-6 border border-brass-dim/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="block h-9 w-9 rotate-45 border border-brass-dim bg-ink" />
        </div>
      </div>
    );
  }

  return (
    <figure
      className={`card-frame rest-on-table relative flex aspect-[5/7] flex-col overflow-hidden ${className}`}
    >
      <div className="relative m-[5px] mb-0 flex-1 overflow-hidden border border-rule-soft bg-ink">
        {art && (
          <Image src={art} alt={alt ?? ""} fill sizes={sizes} className="object-cover" />
        )}
      </div>

      <figcaption className="px-[7px] pt-1.5 pb-2">
        <p
          className="truncate text-center text-[0.8rem] leading-tight text-parchment"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {name}
        </p>
        {stamp && (
          <p
            className="mt-1 text-center text-[0.6rem] tracking-[0.22em] text-faint uppercase"
            style={{ fontFamily: "var(--font-hud)" }}
          >
            {stamp}
          </p>
        )}
      </figcaption>

      {typeof cost === "number" && (
        <span className="absolute top-2 left-2 flex h-6 w-6 rotate-45 items-center justify-center border border-brass-dim bg-ink">
          <span
            className="-rotate-45 text-[0.72rem] tabular-nums text-brass-hi"
            style={{ fontFamily: "var(--font-hud)" }}
          >
            {cost}
          </span>
        </span>
      )}

      {typeof atk === "number" && (
        <span
          className="absolute bottom-1.5 left-2 text-sm tabular-nums text-brass-hi"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {atk}
        </span>
      )}
      {typeof hp === "number" && (
        <span
          className="absolute right-2 bottom-1.5 text-sm tabular-nums text-crimson-hi"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {hp}
        </span>
      )}
    </figure>
  );
}

/** 卡片旁邊的引線標註：一條髮絲線 + 卡型名 + 一句規則。 */
export function CardNote({
  zh,
  en,
  rule,
  tone = "brass",
  children,
}: {
  zh: string;
  en: string;
  rule: string;
  tone?: "brass" | "crimson" | "steel";
  children?: React.ReactNode;
}) {
  const line =
    tone === "crimson"
      ? "bg-crimson"
      : tone === "steel"
        ? "bg-steel"
        : "bg-brass-dim";
  const accent =
    tone === "crimson"
      ? "text-crimson-hi"
      : tone === "steel"
        ? "text-steel"
        : "text-brass";

  return (
    <div className="mt-3">
      <span className={`block h-px w-10 ${line}`} />
      <p className="mt-2 flex items-baseline gap-2">
        <span
          className="text-sm text-parchment"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {zh}
        </span>
        <span
          className={`text-[0.62rem] tracking-[0.24em] uppercase ${accent}`}
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {en}
        </span>
      </p>
      <p className="body-cjk mt-1 max-w-xs text-[0.85rem] leading-relaxed">{rule}</p>
      {children}
    </div>
  );
}
