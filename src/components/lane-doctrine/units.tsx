import Image from "next/image";
import { GAME_FACTS, type LanePosition, type LaneUnit } from "@/data/game";
import { mediaUrl } from "@/data/media";

type Side = LanePosition["side"];

/** 卡槽在這一步扮演的角色；同一格不會同時是出手方、目標與阻擋者。 */
export type CellRole = "attacker" | "target" | "protected" | "guardian" | "idle";

const CELL_BOX = "relative h-15 min-w-0 overflow-hidden sm:h-20 md:h-20 lg:h-24";

const ROLE_STYLE: Record<Exclude<CellRole, "idle">, { frame: string; badge: string; label: string; marker: string }> = {
  attacker: {
    frame: "border-brass ring-2 ring-brass/40 shadow-[0_0_12px_rgba(200,162,60,0.5)] z-20",
    badge: "bg-brass text-ink",
    label: "⚔️ 出手",
    marker: "attacker",
  },
  target: {
    frame: "border-crimson ring-2 ring-crimson/50 shadow-[0_0_12px_rgba(220,94,78,0.5)] z-20",
    badge: "bg-crimson text-parchment",
    label: "🎯 目標",
    marker: "target",
  },
  protected: {
    frame: "border-crimson-dim opacity-75",
    badge: "bg-steel-dim text-parchment",
    label: "🔒 受保護",
    marker: "target",
  },
  guardian: {
    frame: "border-steel ring-2 ring-steel/50 shadow-[0_0_10px_rgba(102,114,129,0.5)] z-20",
    badge: "bg-steel text-ink",
    label: "🛡️ 阻擋",
    marker: "guardian",
  },
};

const IDLE_FRAME: Record<Side, string> = { player: "border-brass-dim/60", enemy: "border-steel-dim" };
const EMPTY_FRAME: Record<Side, string> = { player: "border-brass-dim/35", enemy: "border-steel-dim/50" };

/** 沒有參與這一步的單位，只標出會影響攻擊路線的關鍵字。 */
function keywordLabel(unit: LaneUnit): string | null {
  if (unit.taunt) return "🧲 嘲諷";
  if (unit.flying) return "🪽 飛行";
  return null;
}

export function Cell({ unit, side, role }: { unit: LaneUnit | null; side: Side; role: CellRole }) {
  if (!unit) {
    return <div className={`${CELL_BOX} border border-dashed transition-colors ${EMPTY_FRAME[side]}`} />;
  }

  const style = role === "idle" ? null : ROLE_STYLE[role];
  const label = style?.label ?? keywordLabel(unit);

  return (
    <div
      data-role={style?.marker}
      className={`${CELL_BOX} border-2 transition-all duration-300 ${style?.frame ?? IDLE_FRAME[side]} rounded-card`}
      title={`${unit.name} · 攻擊 ${unit.atk} / 生命 ${unit.hp}`}
    >
      <Image
        src={mediaUrl(unit.art)}
        alt=""
        fill
        sizes="(max-width: 768px) 20vw, 140px"
        className="object-cover object-center"
      />

      {label && (
        <span
          className={`absolute top-0 right-0 z-10 px-1 py-0.5 text-[0.55rem] font-bold leading-none ${style?.badge ?? "bg-ink/90 text-parchment"}`}
        >
          {label}
        </span>
      )}

      {/* 底部卡名與攻防數值 */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-ink/90 px-1 py-0.5">
        <p className="truncate text-center text-[0.55rem] font-medium leading-tight text-parchment md:text-[0.62rem]">
          {unit.name}
        </p>
        <div className="flex items-center justify-between text-[0.68rem] leading-tight tabular-nums font-bold font-hud">
          <span className="text-brass-hi" title="攻擊力">
            {unit.atk}
          </span>
          <span className="text-crimson-hi" title="生命值">
            {unit.hp}
          </span>
        </div>
      </div>
    </div>
  );
}

export function HeroBar({
  side,
  hp,
  hit = false,
  blocked = false,
}: {
  side: Side;
  hp: number;
  hit?: boolean;
  blocked?: boolean;
}) {
  const enemy = side === "enemy";
  const state = hit
    ? "border-crimson bg-crimson/15 shadow-[0_0_16px_rgba(220,94,78,0.35)]"
    : blocked
      ? "border-steel-dim"
      : "";

  return (
    <div
      data-role={enemy ? "enemy-hero" : "player-hero"}
      className={`plate flex items-center justify-between gap-2 px-3 py-1.5 transition-all duration-300 ${state}`}
    >
      <div className="flex items-center gap-2">
        <span className="hud-label truncate text-[0.68rem]">
          {enemy ? "Enemy 敵方英雄" : "Player 我方英雄"}
        </span>
        {hit && (
          <span className="animate-pulse border border-crimson bg-crimson px-1.5 py-0.2 text-[0.62rem] font-bold text-parchment font-hud">
            💥 直擊 -3
          </span>
        )}
        {blocked && (
          <span className="border border-steel bg-steel/20 px-1 py-0.2 text-[0.62rem] text-steel font-hud">
            🛡️ 阻擋防護
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="block h-1.5 w-16 bg-ink sm:w-24">
          <span
            className={`block h-full transition-[width] duration-500 ${enemy ? "bg-crimson" : "bg-brass"}`}
            style={{ width: `${(hp / GAME_FACTS.heroHp) * 100}%` }}
          />
        </span>
        <span className="hud-value text-xs sm:text-sm font-bold">
          {hp} / {GAME_FACTS.heroHp}
        </span>
      </div>
    </div>
  );
}
