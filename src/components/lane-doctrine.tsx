"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GAME_FACTS, LANE_STEPS, type LanePosition, type LaneStep, type LaneUnit } from "@/data/game";
import { mediaUrl } from "@/data/media";

/** 捲動或按步驟，查看四路前後排的獨立規則情境。 */
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

  return (
    <section id="lanes" className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">II — The Field</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            四條路，前排替後排與英雄擋傷害
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            攻擊敵方前排可以跨路選目標。打後排，要先移除它同路的前排；
            打英雄，則檢查攻擊者那一路的阻擋與嘲諷守護。
          </p>
        </header>

        <div className="mt-12 md:mt-16 md:grid md:grid-cols-[minmax(0,1fr)_18rem] md:gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div ref={boardRef} className="relative z-20 -mx-5 scroll-mt-20 border-b border-rule-soft bg-board px-5 py-3 md:sticky md:top-20 md:mx-0 md:flex md:h-[calc(100svh-6rem)] md:items-center md:self-start md:border-0 md:px-0 md:py-0">
            <div className="w-full">
              <nav aria-label="戰場規則步驟" className="mb-3 flex items-center gap-1.5">
                <span className="hud-label mr-auto hidden text-[0.6rem] sm:inline">Field notes</span>
                {LANE_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    aria-label={`查看第 ${index + 1} 步：${step.heading}`}
                    aria-pressed={active === index}
                    onClick={() => selectStep(index)}
                    className={`h-8 w-8 border text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${active === index ? "border-brass bg-brass text-ink" : "border-rule text-quill hover:border-brass-dim"}`}
                    style={{ fontFamily: "var(--font-hud)" }}
                  >
                    {index + 1}
                  </button>
                ))}
              </nav>
              <Board step={LANE_STEPS[active]} />
            </div>
          </div>

          <ol className="mt-6 md:mt-0">
            {LANE_STEPS.map((step, index) => (
              <li
                key={step.id}
                data-step={index}
                ref={(el) => { stepRefs.current[index] = el; }}
                className={`${index === active ? "flex" : "hidden"} flex-col justify-center py-6 md:flex md:min-h-[80svh] md:py-8`}
              >
                <div className={`transition-opacity duration-300 ${index === active ? "opacity-100" : "opacity-40"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs tracking-[0.3em] text-brass" style={{ fontFamily: "var(--font-display)" }}>{step.index}</span>
                    <span className={`h-px flex-1 ${index === active ? "bg-brass-dim" : "bg-rule-soft"}`} />
                  </div>
                  <h3 className="section-title mt-4 text-xl sm:text-2xl">{step.heading}</h3>
                  <p className="body-cjk mt-3 text-[0.94rem]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function samePosition(value: LanePosition | "hero" | null, position: LanePosition) {
  return value !== null && value !== "hero" && value.side === position.side && value.row === position.row && value.lane === position.lane;
}

function Board({ step }: { step: LaneStep }) {
  const rows: { label: string; side: LanePosition["side"]; row: LanePosition["row"]; units: (LaneUnit | null)[] }[] = [
    { label: "敵後排", side: "enemy", row: "back", units: step.enemyBack },
    { label: "敵前排", side: "enemy", row: "front", units: step.enemyFront },
    { label: "我前排", side: "player", row: "front", units: step.playerFront },
    { label: "我後排", side: "player", row: "back", units: step.playerBack },
  ];

  return (
    <div className="select-none">
      <div aria-hidden>
        <HeroBar side="enemy" hp={step.enemyHp} hit={step.hitHero} blocked={step.target === "hero" && step.blocked} />
        <div className="my-2 space-y-1.5 md:my-3 md:space-y-2">
          <div className="grid grid-cols-[2.5rem_repeat(4,minmax(0,1fr))] gap-1.5 text-center text-[0.65rem] text-faint md:gap-2">
            <span />
            {Array.from({ length: GAME_FACTS.lanes }, (_, lane) => <span key={lane}>第 {lane + 1} 路</span>)}
          </div>
          {rows.map(({ label, side, row, units }) => (
            <div
              key={`${side}-${row}`}
              className={`grid grid-cols-[2.5rem_repeat(4,minmax(0,1fr))] items-center gap-1.5 md:gap-2 ${side === "player" && row === "front" ? "border-t border-brass-dim/60 pt-2 md:pt-3" : ""}`}
            >
              <span className={`text-[0.65rem] ${side === "player" ? "text-brass-dim" : "text-steel"}`}>{label}</span>
              {units.map((unit, lane) => {
                const position: LanePosition = { side, row, lane };
                return <Cell key={lane} unit={unit} side={side} attacking={samePosition(step.attacker, position)} target={samePosition(step.target, position)} guarding={samePosition(step.guardian, position)} blocked={step.blocked} />;
              })}
            </div>
          ))}
        </div>
        <HeroBar side="player" hp={20} hit={false} blocked={false} />
      </div>
      <p aria-live="polite" className={`mt-3 min-h-10 border-l-2 pl-3 text-[0.75rem] leading-relaxed md:text-[0.82rem] ${step.blocked ? "border-crimson text-crimson-hi" : "border-brass text-brass-hi"}`}>
        {step.notice}
      </p>
      <p className="mt-1 text-[0.62rem] text-faint">每步為獨立示意，卡片顯示基礎攻擊／生命。金框：出手　紅框：目標　銀框：阻擋</p>
    </div>
  );
}

function Cell({ unit, side, attacking, target, guarding, blocked }: {
  unit: LaneUnit | null;
  side: "player" | "enemy";
  attacking: boolean;
  target: boolean;
  guarding: boolean;
  blocked: boolean;
}) {
  const box = "relative h-14 min-w-0 overflow-hidden sm:h-20 md:h-20 lg:h-24";
  if (!unit) return <div className={`${box} border border-dashed ${side === "player" ? "border-brass-dim/35" : "border-steel-dim/50"}`} />;

  const label = attacking ? "出手" : target ? (blocked ? "受保護" : "目標") : guarding ? "阻擋" : unit.taunt ? "嘲諷" : unit.flying ? "飛行" : null;
  return (
    <div
      className={`${box} border-2 ${attacking ? "border-brass" : target ? "border-crimson" : guarding ? "border-steel" : side === "player" ? "border-brass-dim/60" : "border-steel-dim"}`}
      style={{ borderRadius: "var(--radius-card)" }}
      title={`${unit.name} · 攻擊 ${unit.atk} / 生命 ${unit.hp}`}
    >
      <Image src={mediaUrl(unit.art)} alt="" fill sizes="(max-width: 768px) 20vw, 140px" className="object-cover object-center" />
      {label && <span className={`absolute top-0 right-0 px-1 text-[0.55rem] leading-relaxed ${attacking ? "bg-brass text-ink" : target ? "bg-crimson text-parchment" : "bg-ink/90 text-parchment"}`}>{label}</span>}
      <div className="absolute inset-x-0 bottom-0 bg-ink/90 px-1 py-0.5">
        <p className="truncate text-center text-[0.55rem] leading-tight text-parchment md:text-[0.6rem]">{unit.name}</p>
        <div className="flex items-center justify-between text-[0.65rem] leading-tight tabular-nums" style={{ fontFamily: "var(--font-hud)" }}>
          <span className="text-brass-hi">{unit.atk}</span><span className="text-crimson-hi">{unit.hp}</span>
        </div>
      </div>
    </div>
  );
}

function HeroBar({ side, hp, hit, blocked }: { side: "player" | "enemy"; hp: number; hit: boolean; blocked: boolean }) {
  const enemy = side === "enemy";
  return (
    <div className={`plate flex items-center justify-between gap-2 px-3 py-1.5 ${hit ? "border-crimson" : ""}`}>
      <span className="hud-label truncate text-[0.65rem]">{enemy ? "Enemy 敵方英雄" : "Player 我方英雄"}</span>
      <div className="flex shrink-0 items-center gap-2">
        {(hit || blocked) && <span className={`text-[0.65rem] ${hit ? "text-crimson-hi" : "text-steel"}`}>{hit ? "受擊" : "受保護"}</span>}
        <span className="block h-1 w-12 bg-ink sm:w-20"><span className={`block h-full transition-[width] duration-500 ${enemy ? "bg-crimson" : "bg-brass"}`} style={{ width: `${(hp / 20) * 100}%` }} /></span>
        <span className="hud-value text-xs">{hp} / 20</span>
      </div>
    </div>
  );
}
