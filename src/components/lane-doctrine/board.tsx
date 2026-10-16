import { useRef } from "react";
import { GAME_FACTS, type LanePosition, type LaneStep, type LaneUnit } from "@/data/game";
import { AttackOverlay, useAttackTrajectory } from "./attack-overlay";
import { Cell, HeroBar, type CellRole } from "./units";

type Outcome = "blocked" | "hit" | "strike";

const OUTCOME_STYLE: Record<Outcome, { frame: string; icon: string; text: string }> = {
  blocked: { frame: "border-l-4 border-crimson", icon: "🛡️", text: "text-crimson-hi" },
  hit: { frame: "border-l-4 border-brass bg-brass/10", icon: "💥", text: "text-brass-hi" },
  strike: { frame: "border-l-4 border-brass", icon: "⚔️", text: "text-parchment" },
};

const LANE_GRID = "grid grid-cols-[2.8rem_repeat(4,minmax(0,1fr))]";

function boardRows(step: LaneStep): { label: string; side: LanePosition["side"]; row: LanePosition["row"]; units: (LaneUnit | null)[] }[] {
  return [
    { label: "敵後排", side: "enemy", row: "back", units: step.enemyBack },
    { label: "敵前排", side: "enemy", row: "front", units: step.enemyFront },
    { label: "我前排", side: "player", row: "front", units: step.playerFront },
    { label: "我後排", side: "player", row: "back", units: step.playerBack },
  ];
}

function samePosition(value: LanePosition | "hero" | null, position: LanePosition) {
  return (
    value !== null &&
    value !== "hero" &&
    value.side === position.side &&
    value.row === position.row &&
    value.lane === position.lane
  );
}

function cellRole(step: LaneStep, position: LanePosition): CellRole {
  if (samePosition(step.attacker, position)) return "attacker";
  if (samePosition(step.target, position)) return step.blocked ? "protected" : "target";
  if (samePosition(step.guardian, position)) return "guardian";
  return "idle";
}

/** 一個情境的四路棋盤、攻擊軌跡與結果說明。 */
export function Board({
  step,
  is3DView,
  onNext,
  onPrev,
}: {
  step: LaneStep;
  is3DView: boolean;
  onNext: () => void;
  onPrev: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trajectory = useAttackTrajectory(containerRef, step);
  const outcome = OUTCOME_STYLE[step.blocked ? "blocked" : step.hitHero ? "hit" : "strike"];

  return (
    <div className="select-none" style={{ perspective: "1100px" }}>
      {/* 棋盤主體，具備動態 SVG 瞄準疊加層與可切換 HD-2D 透視 */}
      <div
        ref={containerRef}
        className="relative rounded-sm border border-rule bg-board p-2.5 sm:p-3.5 transition-all duration-500 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: is3DView ? "rotateX(18deg) scale(0.97)" : "none",
          transformOrigin: "center bottom",
          boxShadow: is3DView ? "0 24px 60px rgba(0, 0, 0, 0.85)" : undefined,
        }}
      >
        <AttackOverlay trajectory={trajectory} step={step} />

        <HeroBar side="enemy" hp={step.enemyHp} hit={step.hitHero} blocked={step.target === "hero" && step.blocked} />

        {/* 四路前後排網格 */}
        <div className="my-2 space-y-1.5 md:my-3 md:space-y-2">
          <div className={`${LANE_GRID} gap-1.5 text-center text-[0.68rem] text-faint md:gap-2`}>
            <span />
            {Array.from({ length: GAME_FACTS.lanes }, (_, lane) => (
              <span key={lane} className="font-semibold text-quill/70 font-hud">
                第 {lane + 1} 路
              </span>
            ))}
          </div>

          {boardRows(step).map(({ label, side, row, units }) => (
            <div
              key={`${side}-${row}`}
              className={`${LANE_GRID} items-center gap-1.5 md:gap-2 ${
                side === "player" && row === "front" ? "border-t-2 border-brass-dim/60 pt-2 md:pt-3" : ""
              }`}
            >
              <span className={`text-[0.68rem] font-medium ${side === "player" ? "text-brass-hi" : "text-steel"} font-serif`}>
                {label}
              </span>
              {units.map((unit, lane) => (
                <Cell key={lane} unit={unit} side={side} role={cellRole(step, { side, row, lane })} />
              ))}
            </div>
          ))}
        </div>

        <HeroBar side="player" hp={GAME_FACTS.heroHp} />
      </div>

      {/* 底部醒目反饋橫條 */}
      <div aria-live="polite" className={`plate mt-3 flex items-start gap-3 p-3.5 ${outcome.frame}`}>
        <span className="text-lg">{outcome.icon}</span>
        <div className="flex-1">
          <p className={`text-[0.84rem] font-bold ${outcome.text}`}>{step.notice}</p>
          <p className="mt-0.5 text-[0.72rem] text-faint">{step.summary}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 self-center">
          <button
            type="button"
            onClick={onPrev}
            className="border border-rule px-2 py-1 text-[0.68rem] text-quill hover:border-brass hover:text-parchment cursor-pointer font-hud"
          >
            ◀ 上一步
          </button>
          <button
            type="button"
            onClick={onNext}
            className="border border-brass bg-brass/10 px-2 py-1 text-[0.68rem] text-brass-hi hover:bg-brass/20 cursor-pointer font-hud"
          >
            下一步 ▶
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between text-[0.65rem] text-faint">
        <span>金框：出手方 ｜ 紅框：攻擊目標 ｜ 銀框：阻擋掩護</span>
        <span>卡片左下：攻擊 ｜ 右下：生命值</span>
      </div>
    </div>
  );
}
