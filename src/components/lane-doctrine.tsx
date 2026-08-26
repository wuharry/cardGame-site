"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LANE_STEPS, type LaneStep, type LaneUnit } from "@/data/game";

/**
 * Section 02 — 五條路線。
 *
 * 網站上真的長出一座五路戰場，隨著讀者往下捲逐步推演：
 * 空場 → 召喚 → 直線攻擊 → 被擋 → 打臉 → 嘲諷改道。
 * 只有「目前推到第幾步」這一個 state——它是真的狀態，不是為了動畫而存在。
 */
export function LaneDoctrine() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-step"));
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      // 只認畫面正中央那條窄帶，避免兩段同時算命中
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    for (const el of stepRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const step = LANE_STEPS[active];

  return (
    <section id="lanes" className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">II — The Field</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            戰場只有五條路，攻擊只走直線
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            大部分卡牌遊戲讓你自由指定攻擊目標，於是站位不重要。這裡不是。
            單位放進哪一條路線，就決定了它會撞上誰、會被誰擋住、什麼時候能碰到對手本體。
          </p>
        </header>

        <div className="mt-12 md:mt-16 md:grid md:grid-cols-[minmax(0,1fr)_18rem] md:gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          {/* 戰場：手機黏在頂端、桌機黏在左欄並垂直置中 */}
          <div className="sticky top-16 z-20 -mx-5 border-b border-rule-soft bg-board px-5 py-4 md:top-20 md:mx-0 md:flex md:h-[calc(100svh-6rem)] md:items-center md:self-start md:border-0 md:px-0 md:py-0">
            <div className="w-full">
              <Board step={step} />
            </div>
          </div>

          <ol className="mt-6 md:mt-0">
            {LANE_STEPS.map((laneStep, index) => (
              <li
                key={laneStep.id}
                data-step={index}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                className="flex min-h-[58svh] flex-col justify-center py-8 md:min-h-[80svh]"
              >
                <div
                  className={`transition-opacity duration-300 ${
                    index === active ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs tracking-[0.3em] text-brass"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {laneStep.index}
                    </span>
                    <span
                      className={`h-px flex-1 transition-colors ${
                        index === active ? "bg-brass-dim" : "bg-rule-soft"
                      }`}
                    />
                  </div>
                  <h3 className="section-title mt-4 text-xl sm:text-2xl">
                    {laneStep.heading}
                  </h3>
                  <p className="body-cjk mt-3 text-[0.94rem]">{laneStep.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** 五路戰場。說明文字都在右側的步驟裡，這裡對讀屏軟體是純裝飾。 */
function Board({ step }: { step: LaneStep }) {
  const facing = step.toFace.length > 0;

  return (
    <div aria-hidden className="select-none">
      <HeroBar side="enemy" hp={step.enemyHp} hit={facing} />

      <div className="my-2 grid grid-cols-1 gap-1.5 md:my-3 md:grid-cols-5 md:gap-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Lane key={i} index={i} step={step} />
        ))}
      </div>

      <HeroBar side="player" hp={20} hit={false} />
    </div>
  );
}

/**
 * 一條路線。
 * DOM 順序是手機的閱讀順序（路線號 → 我方 → 攻擊 → 敵方），
 * 桌機用 flex-col-reverse 直接翻成「敵方在上、我方在下」，不必複製一份 DOM。
 */
function Lane({ index, step }: { index: number; step: LaneStep }) {
  const mine = step.player[index];
  const theirs = step.enemy[index];

  const attacking = step.attacks.includes(index);
  const blocked = step.blocked.includes(index);
  const hitsFace = step.toFace.includes(index);
  const redirected = step.taunted?.from === index;
  const guarding = step.taunted?.to === index;

  // 攻擊推進的長度：被擋下或被改道就停在半路
  const reach = attacking ? (blocked || redirected ? "50%" : "100%") : "0%";
  const beamColor = redirected
    ? "bg-crimson"
    : hitsFace
      ? "bg-brass-hi"
      : "bg-brass";

  return (
    <div className="flex flex-row items-center gap-2 md:flex-col-reverse md:gap-0">
      <span
        className={`w-4 shrink-0 text-center text-[0.72rem] tabular-nums transition-colors md:mt-2 md:w-full md:text-sm ${
          attacking ? "text-brass" : "text-faint"
        }`}
        style={{ fontFamily: "var(--font-hud)" }}
      >
        {index + 1}
      </span>

      <Cell unit={mine} side="player" />

      {/* 攻擊軌跡。手機往右推，桌機往上推。 */}
      <div className="relative h-9 w-9 shrink-0 md:h-10 md:w-full">
        <span
          className={`absolute top-1/2 left-0 h-0.5 -translate-y-1/2 transition-[width] duration-500 ease-out md:hidden ${beamColor}`}
          style={{ width: reach }}
        />
        <span
          className={`absolute bottom-0 left-1/2 hidden w-0.5 -translate-x-1/2 transition-[height] duration-500 ease-out md:block ${beamColor}`}
          style={{ height: reach }}
        />
        {blocked && <Marker label="交換傷害">✕</Marker>}
        {redirected && <Marker label="改道">↷</Marker>}
      </div>

      <Cell
        unit={theirs}
        side="enemy"
        guarding={guarding}
        passThrough={hitsFace && !theirs}
      />
    </div>
  );
}

function Cell({
  unit,
  side,
  guarding = false,
  passThrough = false,
}: {
  unit: LaneUnit | null;
  side: "player" | "enemy";
  guarding?: boolean;
  passThrough?: boolean;
}) {
  const box =
    "relative h-16 flex-1 md:h-auto md:aspect-[4/5] md:w-full md:flex-none";

  if (!unit) {
    return (
      <div
        className={`${box} border border-dashed ${
          side === "player" ? "border-brass-dim/45" : "border-steel-dim"
        }`}
      >
        {/* 前方無人阻擋：攻擊穿過這一格，一路打到本體 */}
        {passThrough && (
          <>
            <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-brass-hi md:hidden" />
            <span className="absolute top-0 left-1/2 hidden h-full w-0.5 -translate-x-1/2 bg-brass-hi md:block" />
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`animate-card-play overflow-hidden border ${box} ${
        guarding
          ? "border-brass"
          : side === "player"
            ? "border-brass-dim"
            : "border-steel-dim"
      }`}
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <Image
        src={unit.art}
        alt=""
        fill
        sizes="(max-width: 768px) 40vw, 140px"
        className="object-cover object-center md:object-top"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/85 px-1.5 py-0.5">
        <span
          className="text-[0.7rem] tabular-nums text-brass-hi"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {unit.atk}
        </span>
        <span
          className="text-[0.7rem] tabular-nums text-crimson-hi"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {unit.hp}
        </span>
      </div>
      {guarding && (
        <span
          className="absolute top-0 right-0 bg-brass px-1 text-[0.62rem] leading-tight text-ink"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          守護
        </span>
      )}
    </div>
  );
}

function Marker({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <span
      className="absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 border border-crimson bg-ink px-1 text-[0.66rem] whitespace-nowrap text-crimson-hi"
      style={{ fontFamily: "var(--font-hud)" }}
    >
      {children}
      <span className="hidden lg:inline">{label}</span>
    </span>
  );
}

function HeroBar({
  side,
  hp,
  hit,
}: {
  side: "player" | "enemy";
  hp: number;
  hit: boolean;
}) {
  const enemy = side === "enemy";
  return (
    <div
      className={`plate flex items-center justify-between gap-3 px-3 py-2 transition-colors ${
        hit && enemy ? "border-crimson" : ""
      }`}
    >
      <span className="hud-label truncate">
        {enemy ? "Enemy hero 敵方本體" : "Your hero 我方本體"}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {hit && enemy && (
          <span
            className="hidden border border-crimson px-1.5 text-[0.66rem] text-crimson-hi sm:inline"
            style={{ fontFamily: "var(--font-hud)" }}
          >
            受擊
          </span>
        )}
        <span className="block h-1.5 w-16 bg-ink sm:w-28">
          <span
            className={`block h-full transition-[width] duration-700 ease-out ${
              enemy ? "bg-crimson" : "bg-brass"
            }`}
            style={{ width: `${(hp / 20) * 100}%` }}
          />
        </span>
        <span className="hud-value w-12 text-right text-sm">{hp} / 20</span>
      </div>
    </div>
  );
}
