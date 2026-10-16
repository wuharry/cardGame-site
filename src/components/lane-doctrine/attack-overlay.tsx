import { useEffect, useId, useState, type RefObject } from "react";
import type { LaneStep } from "@/data/game";

type Point = { x: number; y: number };

export interface Trajectory {
  start: Point | null;
  end: Point | null;
  guard: Point | null;
  viewBox: { w: number; h: number };
}

const GOLD = "#e8cd77";
const RED = "#dc5e4e";
const NO_TRAJECTORY: Trajectory = { start: null, end: null, guard: null, viewBox: { w: 400, h: 300 } };

function centerOf(element: Element, container: DOMRect): Point {
  const rect = element.getBoundingClientRect();
  return { x: rect.left - container.left + rect.width / 2, y: rect.top - container.top + rect.height / 2 };
}

/** 依棋盤上 data-role 標出的實際位置，量出攻擊箭頭的起點、終點與阻擋點。 */
export function useAttackTrajectory(containerRef: RefObject<HTMLDivElement | null>, step: LaneStep): Trajectory {
  const [trajectory, setTrajectory] = useState(NO_TRAJECTORY);

  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;

      const attacker = container.querySelector('[data-role="attacker"]');
      const target = container.querySelector(step.target === "hero" ? '[data-role="enemy-hero"]' : '[data-role="target"]');
      const guardian = container.querySelector('[data-role="guardian"]');
      const start = attacker ? centerOf(attacker, bounds) : null;

      let end: Point | null = null;
      if (target && step.target === "hero") {
        // 攻擊英雄時，受擊點落在出手者同一路；沒有出手者才取英雄條中央。
        const rect = target.getBoundingClientRect();
        end = { x: start ? start.x : rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height - 8 };
      } else if (target) {
        end = centerOf(target, bounds);
      }

      setTrajectory({
        start,
        end,
        guard: guardian ? centerOf(guardian, bounds) : null,
        viewBox: { w: bounds.width, h: bounds.height },
      });
    }

    measure();
    window.addEventListener("resize", measure);
    // 等卡圖與透視切換的版面穩定後再量一次。
    const timeout = setTimeout(measure, 120);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(timeout);
    };
  }, [containerRef, step]);

  return trajectory;
}

function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill={color} />
    </marker>
  );
}

/** 疊在棋盤上的攻擊軌跡：被阻擋畫紅色斷線，直擊英雄畫光束，其餘畫跨路弧線。 */
export function AttackOverlay({ trajectory, step }: { trajectory: Trajectory; step: LaneStep }) {
  const id = useId();
  const { start, end, guard, viewBox } = trajectory;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible"
      viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
    >
      <defs>
        <ArrowHead id={`arrow-gold-${id}`} color={GOLD} />
        <ArrowHead id={`arrow-red-${id}`} color={RED} />
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={GOLD} floodOpacity="0.8" />
        </filter>
      </defs>

      {start && end && (step.blocked && guard ? (
        <g>
          <line
            x1={start.x}
            y1={start.y}
            x2={guard.x}
            y2={guard.y}
            stroke={RED}
            strokeWidth="3"
            strokeDasharray="6 4"
            markerEnd={`url(#arrow-red-${id})`}
          />
          <circle cx={guard.x} cy={guard.y} r="14" fill="#15120e" stroke={RED} strokeWidth="2" />
          <text x={guard.x} y={guard.y + 4} textAnchor="middle" fill={RED} fontSize="11" fontWeight="bold">
            ✕
          </text>
        </g>
      ) : step.hitHero ? (
        <g>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={GOLD}
            strokeWidth="3.5"
            strokeDasharray="8 4"
            filter={`url(#glow-${id})`}
            markerEnd={`url(#arrow-gold-${id})`}
          />
        </g>
      ) : (
        <g>
          <path
            d={`M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${(start.y + end.y) / 2 - 16} ${end.x} ${end.y}`}
            fill="none"
            stroke={GOLD}
            strokeWidth="3.5"
            strokeDasharray="8 4"
            filter={`url(#glow-${id})`}
            markerEnd={`url(#arrow-gold-${id})`}
          />
        </g>
      ))}
    </svg>
  );
}
