"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useId } from "react";
import { GAME_FACTS, LANE_STEPS, type LanePosition, type LaneStep, type LaneUnit } from "@/data/game";
import { mediaUrl } from "@/data/media";

/** 捲動或按步驟，查看四路前後排的直觀交鋒規則。 */
export function LaneDoctrine() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!window.matchMedia("(min-width: 768px)").matches) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-step"));
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const el of stepRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function selectStep(index: number) {
    setActive(index);
    if (window.matchMedia("(min-width: 768px)").matches) {
      stepRefs.current[index]?.scrollIntoView({ block: "center", behavior: "instant" });
    } else {
      boardRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }

  const currentStep = LANE_STEPS[active];

  return (
    <section id="lanes" className="border-t border-rule-soft bg-board py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <header className="max-w-2xl">
          <p className="eyebrow">II — The Field</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            四路交鋒：前排護衛、破路直擊
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            攻擊敵方前排可以跨路任意選目標；打後排，要先擊破它同路的前排；
            打英雄，則檢查攻擊者正前方是否有阻擋。
          </p>
        </header>

        <div className="mt-12 md:mt-16 md:grid md:grid-cols-[minmax(0,1fr)_19rem] md:gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          {/* 左側：戰場棋盤與動態反饋 */}
          <div
            ref={boardRef}
            className="relative z-20 -mx-5 scroll-mt-20 border-b border-rule-soft bg-board px-5 py-3 md:sticky md:top-20 md:mx-0 md:flex md:h-[calc(100svh-5rem)] md:items-center md:self-start md:border-0 md:px-0 md:py-0"
          >
            <div className="w-full">
              {/* 步驟導航列 */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="hud-label text-[0.62rem] text-brass">
                    情境 {currentStep.index} / 07
                  </span>
                  <span className="border border-brass-dim bg-brass/10 px-2 py-0.5 text-[0.62rem] text-brass-hi" style={{ fontFamily: "var(--font-hud)" }}>
                    {currentStep.tag}
                  </span>
                </div>

                <nav aria-label="戰場規則步驟" className="flex items-center gap-1">
                  {LANE_STEPS.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      aria-label={`查看第 ${index + 1} 步：${step.heading}`}
                      aria-pressed={active === index}
                      onClick={() => selectStep(index)}
                      className={`h-7 w-7 border text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                        active === index
                          ? "border-brass bg-brass font-bold text-ink"
                          : "border-rule text-quill hover:border-brass-dim hover:text-parchment"
                      }`}
                      style={{ fontFamily: "var(--font-hud)" }}
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 棋盤實體 */}
              <Board step={currentStep} onNext={() => selectStep((active + 1) % LANE_STEPS.length)} onPrev={() => selectStep((active - 1 + LANE_STEPS.length) % LANE_STEPS.length)} />
            </div>
          </div>

          {/* 右側：滾動式詳細步驟說明 */}
          <ol className="mt-6 md:mt-0">
            {LANE_STEPS.map((step, index) => {
              const isCurrent = index === active;
              return (
                <li
                  key={step.id}
                  data-step={index}
                  ref={(el) => {
                    stepRefs.current[index] = el;
                  }}
                  className={`${
                    isCurrent ? "flex" : "hidden"
                  } flex-col justify-center py-6 md:flex md:min-h-[75svh] md:py-8`}
                >
                  <div
                    className={`transition-all duration-300 ${
                      isCurrent
                        ? "opacity-100 translate-y-0"
                        : "opacity-30 hover:opacity-60 cursor-pointer"
                    }`}
                    onClick={() => !isCurrent && selectStep(index)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-bold tracking-[0.3em] text-brass"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {step.index}
                      </span>
                      <span
                        className={`h-px flex-1 ${
                          isCurrent ? "bg-brass" : "bg-rule-soft"
                        }`}
                      />
                      <span
                        className="border border-rule px-2 py-0.5 text-[0.62rem] text-faint"
                        style={{ fontFamily: "var(--font-hud)" }}
                      >
                        {step.tag}
                      </span>
                    </div>

                    <h3 className="section-title mt-4 text-xl sm:text-2xl">
                      {step.heading}
                    </h3>

                    {/* 核心口訣卡片 */}
                    <div className="plate notch mt-3 border-l-2 border-brass bg-panel p-3">
                      <p className="text-[0.84rem] font-semibold text-brass-hi leading-snug">
                        ⚡ 核心原則：{step.summary}
                      </p>
                    </div>

                    <p className="body-cjk mt-4 text-[0.92rem] leading-relaxed text-quill">
                      {step.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function samePosition(
  value: LanePosition | "hero" | null,
  position: LanePosition,
) {
  return (
    value !== null &&
    value !== "hero" &&
    value.side === position.side &&
    value.row === position.row &&
    value.lane === position.lane
  );
}

function Board({
  step,
  onNext,
  onPrev,
}: {
  step: LaneStep;
  onNext: () => void;
  onPrev: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const arrowId = useId();

  const [arrowPoints, setArrowPoints] = useState<{
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
    guard: { x: number; y: number } | null;
    viewBox: { w: number; h: number };
  }>({
    start: null,
    end: null,
    guard: null,
    viewBox: { w: 400, h: 300 },
  });

  // 計算攻擊箭頭起終點座標
  useEffect(() => {
    function calculateTrajectory() {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const w = containerRect.width;
      const h = containerRect.height;
      if (w === 0 || h === 0) return;

      const attackerEl = containerRef.current.querySelector('[data-role="attacker"]');
      const targetEl = containerRef.current.querySelector(
        step.target === "hero" ? '[data-role="enemy-hero"]' : '[data-role="target"]',
      );
      const guardianEl = containerRef.current.querySelector('[data-role="guardian"]');

      let start = null;
      let end = null;
      let guard = null;

      if (attackerEl) {
        const rect = attackerEl.getBoundingClientRect();
        start = {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      }

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        if (step.target === "hero") {
          // 攻擊英雄時，若有出手者，將英雄受擊點落在同一路或靠中央
          const hitX = start ? start.x : rect.left - containerRect.left + rect.width / 2;
          end = {
            x: hitX,
            y: rect.top - containerRect.top + rect.height - 8,
          };
        } else {
          end = {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2,
          };
        }
      }

      if (guardianEl) {
        const rect = guardianEl.getBoundingClientRect();
        guard = {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      }

      setArrowPoints({ start, end, guard, viewBox: { w, h } });
    }

    calculateTrajectory();
    const handleResize = () => calculateTrajectory();
    window.addEventListener("resize", handleResize);
    const timeout = setTimeout(calculateTrajectory, 120);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, [step]);

  const rows: {
    label: string;
    side: LanePosition["side"];
    row: LanePosition["row"];
    units: (LaneUnit | null)[];
  }[] = [
    { label: "敵後排", side: "enemy", row: "back", units: step.enemyBack },
    { label: "敵前排", side: "enemy", row: "front", units: step.enemyFront },
    { label: "我前排", side: "player", row: "front", units: step.playerFront },
    { label: "我後排", side: "player", row: "back", units: step.playerBack },
  ];

  return (
    <div className="select-none">
      {/* 棋盤主體，具備動態 SVG 瞄準疊加層 */}
      <div ref={containerRef} className="relative rounded-sm border border-rule bg-board p-2.5 sm:p-3.5">
        {/* 動態攻擊軌跡 SVG */}
        <svg
          className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible"
          viewBox={`0 0 ${arrowPoints.viewBox.w} ${arrowPoints.viewBox.h}`}
        >
          <defs>
            {/* 金色箭頭頭部 */}
            <marker
              id={`arrow-gold-${arrowId}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#e8cd77" />
            </marker>
            {/* 紅色阻擋箭頭頭部 */}
            <marker
              id={`arrow-red-${arrowId}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc5e4e" />
            </marker>
            {/* 濾鏡輝光 */}
            <filter id={`glow-${arrowId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#e8cd77" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* 當存在出手與目標時繪製攻擊路徑 */}
          {arrowPoints.start && arrowPoints.end && (
            <>
              {step.blocked && arrowPoints.guard ? (
                // 被阻擋：攻擊線射向守護者阻擋點，並顯示中斷標誌
                <g>
                  {/* 指向守護者的阻擋線 */}
                  <line
                    x1={arrowPoints.start.x}
                    y1={arrowPoints.start.y}
                    x2={arrowPoints.guard.x}
                    y2={arrowPoints.guard.y}
                    stroke="#dc5e4e"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    markerEnd={`url(#arrow-red-${arrowId})`}
                  />
                  {/* 守護者上的受阻圖標 */}
                  <circle
                    cx={arrowPoints.guard.x}
                    cy={arrowPoints.guard.y}
                    r="14"
                    fill="#15120e"
                    stroke="#dc5e4e"
                    strokeWidth="2"
                  />
                  <text
                    x={arrowPoints.guard.x}
                    y={arrowPoints.guard.y + 4}
                    textAnchor="middle"
                    fill="#dc5e4e"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    ✕
                  </text>
                </g>
              ) : step.hitHero ? (
                // 直擊英雄：高能量金紅光束貫穿
                <g>
                  <line
                    x1={arrowPoints.start.x}
                    y1={arrowPoints.start.y}
                    x2={arrowPoints.end.x}
                    y2={arrowPoints.end.y}
                    stroke="#e8cd77"
                    strokeWidth="3.5"
                    strokeDasharray="8 4"
                    filter={`url(#glow-${arrowId})`}
                    markerEnd={`url(#arrow-gold-${arrowId})`}
                  />
                </g>
              ) : (
                // 自由跨路攻擊：流暢金色弧線
                <g>
                  {/* 計算中點微彎曲弧度 */}
                  {(() => {
                    const midX = (arrowPoints.start.x + arrowPoints.end.x) / 2;
                    const midY = (arrowPoints.start.y + arrowPoints.end.y) / 2 - 16;
                    return (
                      <path
                        d={`M ${arrowPoints.start.x} ${arrowPoints.start.y} Q ${midX} ${midY} ${arrowPoints.end.x} ${arrowPoints.end.y}`}
                        fill="none"
                        stroke="#e8cd77"
                        strokeWidth="3.5"
                        strokeDasharray="8 4"
                        filter={`url(#glow-${arrowId})`}
                        markerEnd={`url(#arrow-gold-${arrowId})`}
                      />
                    );
                  })()}
                </g>
              )}
            </>
          )}
        </svg>

        {/* 敵方英雄血條 */}
        <HeroBar
          dataRole="enemy-hero"
          side="enemy"
          hp={step.enemyHp}
          hit={step.hitHero}
          blocked={step.target === "hero" && step.blocked}
        />

        {/* 四路前後排網格 */}
        <div className="my-2 space-y-1.5 md:my-3 md:space-y-2">
          {/* 路線編號標頭 */}
          <div className="grid grid-cols-[2.8rem_repeat(4,minmax(0,1fr))] gap-1.5 text-center text-[0.68rem] text-faint md:gap-2">
            <span />
            {Array.from({ length: GAME_FACTS.lanes }, (_, lane) => (
              <span
                key={lane}
                className="font-semibold text-quill/70"
                style={{ fontFamily: "var(--font-hud)" }}
              >
                第 {lane + 1} 路
              </span>
            ))}
          </div>

          {/* 棋盤 4 排 */}
          {rows.map(({ label, side, row, units }) => (
            <div
              key={`${side}-${row}`}
              className={`grid grid-cols-[2.8rem_repeat(4,minmax(0,1fr))] items-center gap-1.5 md:gap-2 ${
                side === "player" && row === "front"
                  ? "border-t-2 border-brass-dim/60 pt-2 md:pt-3"
                  : ""
              }`}
            >
              <span
                className={`text-[0.68rem] font-medium ${
                  side === "player" ? "text-brass-hi" : "text-steel"
                }`}
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {label}
              </span>
              {units.map((unit, lane) => {
                const position: LanePosition = { side, row, lane };
                const isAttacking = samePosition(step.attacker, position);
                const isTarget = samePosition(step.target, position);
                const isGuarding = samePosition(step.guardian, position);

                return (
                  <Cell
                    key={lane}
                    unit={unit}
                    side={side}
                    attacking={isAttacking}
                    target={isTarget}
                    guarding={isGuarding}
                    blocked={step.blocked}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* 我方英雄血條 */}
        <HeroBar
          dataRole="player-hero"
          side="player"
          hp={20}
          hit={false}
          blocked={false}
        />
      </div>

      {/* 底部醒目反饋橫條 */}
      <div
        aria-live="polite"
        className={`plate mt-3 flex items-start gap-3 p-3.5 ${
          step.blocked
            ? "border-l-4 border-crimson"
            : step.hitHero
            ? "border-l-4 border-brass bg-brass/10"
            : "border-l-4 border-brass"
        }`}
      >
        <span className="text-lg">
          {step.blocked ? "🛡️" : step.hitHero ? "💥" : "⚔️"}
        </span>
        <div className="flex-1">
          <p
            className={`text-[0.84rem] font-bold ${
              step.blocked
                ? "text-crimson-hi"
                : step.hitHero
                ? "text-brass-hi"
                : "text-parchment"
            }`}
          >
            {step.notice}
          </p>
          <p className="mt-0.5 text-[0.72rem] text-faint">
            {step.summary}
          </p>
        </div>

        {/* 上一步/下一步快捷控制 */}
        <div className="flex shrink-0 items-center gap-1.5 self-center">
          <button
            type="button"
            onClick={onPrev}
            className="border border-rule px-2 py-1 text-[0.68rem] text-quill hover:border-brass hover:text-parchment cursor-pointer"
            style={{ fontFamily: "var(--font-hud)" }}
          >
            ◀ 上一步
          </button>
          <button
            type="button"
            onClick={onNext}
            className="border border-brass bg-brass/10 px-2 py-1 text-[0.68rem] text-brass-hi hover:bg-brass/20 cursor-pointer"
            style={{ fontFamily: "var(--font-hud)" }}
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

function Cell({
  unit,
  side,
  attacking,
  target,
  guarding,
  blocked,
}: {
  unit: LaneUnit | null;
  side: "player" | "enemy";
  attacking: boolean;
  target: boolean;
  guarding: boolean;
  blocked: boolean;
}) {
  const box = "relative h-15 min-w-0 overflow-hidden sm:h-20 md:h-20 lg:h-24";
  if (!unit) {
    return (
      <div
        className={`${box} border border-dashed transition-colors ${
          side === "player" ? "border-brass-dim/35" : "border-steel-dim/50"
        }`}
      />
    );
  }

  // 決定卡片角色標記
  const roleAttr = attacking
    ? "attacker"
    : guarding
    ? "guardian"
    : target
    ? "target"
    : undefined;

  const label = attacking
    ? "⚔️ 出手"
    : target
    ? blocked
      ? "🔒 受保護"
      : "🎯 目標"
    : guarding
    ? "🛡️ 阻擋"
    : unit.taunt
    ? "🧲 嘲諷"
    : unit.flying
    ? "🪽 飛行"
    : null;

  return (
    <div
      data-role={roleAttr}
      className={`${box} border-2 transition-all duration-300 ${
        attacking
          ? "border-brass ring-2 ring-brass/40 shadow-[0_0_12px_rgba(200,162,60,0.5)] z-20"
          : target
          ? blocked
            ? "border-crimson-dim opacity-75"
            : "border-crimson ring-2 ring-crimson/50 shadow-[0_0_12px_rgba(220,94,78,0.5)] z-20"
          : guarding
          ? "border-steel ring-2 ring-steel/50 shadow-[0_0_10px_rgba(102,114,129,0.5)] z-20"
          : side === "player"
          ? "border-brass-dim/60"
          : "border-steel-dim"
      }`}
      style={{ borderRadius: "var(--radius-card)" }}
      title={`${unit.name} · 攻擊 ${unit.atk} / 生命 ${unit.hp}`}
    >
      <Image
        src={mediaUrl(unit.art)}
        alt=""
        fill
        sizes="(max-width: 768px) 20vw, 140px"
        className="object-cover object-center"
      />

      {/* 標籤徽章 */}
      {label && (
        <span
          className={`absolute top-0 right-0 z-10 px-1 py-0.5 text-[0.55rem] font-bold leading-none ${
            attacking
              ? "bg-brass text-ink"
              : target
              ? blocked
                ? "bg-steel-dim text-parchment"
                : "bg-crimson text-parchment"
              : guarding
              ? "bg-steel text-ink"
              : "bg-ink/90 text-parchment"
          }`}
        >
          {label}
        </span>
      )}

      {/* 底部卡名與攻防數值 */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-ink/90 px-1 py-0.5">
        <p className="truncate text-center text-[0.55rem] font-medium leading-tight text-parchment md:text-[0.62rem]">
          {unit.name}
        </p>
        <div
          className="flex items-center justify-between text-[0.68rem] leading-tight tabular-nums font-bold"
          style={{ fontFamily: "var(--font-hud)" }}
        >
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

function HeroBar({
  side,
  hp,
  hit,
  blocked,
  dataRole,
}: {
  side: "player" | "enemy";
  hp: number;
  hit: boolean;
  blocked: boolean;
  dataRole?: string;
}) {
  const enemy = side === "enemy";
  return (
    <div
      data-role={dataRole}
      className={`plate flex items-center justify-between gap-2 px-3 py-1.5 transition-all duration-300 ${
        hit
          ? "border-crimson bg-crimson/15 shadow-[0_0_16px_rgba(220,94,78,0.35)]"
          : blocked
          ? "border-steel-dim"
          : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="hud-label truncate text-[0.68rem]">
          {enemy ? "Enemy 敵方英雄" : "Player 我方英雄"}
        </span>
        {hit && (
          <span
            className="animate-pulse border border-crimson bg-crimson px-1.5 py-0.2 text-[0.62rem] font-bold text-parchment"
            style={{ fontFamily: "var(--font-hud)" }}
          >
            💥 直擊 -3
          </span>
        )}
        {blocked && (
          <span
            className="border border-steel bg-steel/20 px-1 py-0.2 text-[0.62rem] text-steel"
            style={{ fontFamily: "var(--font-hud)" }}
          >
            🛡️ 阻擋防護
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="block h-1.5 w-16 bg-ink sm:w-24">
          <span
            className={`block h-full transition-[width] duration-500 ${
              enemy ? "bg-crimson" : "bg-brass"
            }`}
            style={{ width: `${(hp / 20) * 100}%` }}
          />
        </span>
        <span className="hud-value text-xs sm:text-sm font-bold">
          {hp} / 20
        </span>
      </div>
    </div>
  );
}
