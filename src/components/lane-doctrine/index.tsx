"use client";

import { useEffect, useRef, useState } from "react";
import { LANE_STEPS } from "@/data/game";
import { Board } from "./board";

const DESKTOP_QUERY = "(min-width: 768px)";
const STEP_TOTAL = String(LANE_STEPS.length).padStart(2, "0");

/** 捲動或按步驟，查看四路前後排的直觀交鋒規則。 */
export function LaneDoctrine() {
  const [active, setActive] = useState(0);
  const [is3DView, setIs3DView] = useState(false);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!window.matchMedia(DESKTOP_QUERY).matches) return;
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
    if (window.matchMedia(DESKTOP_QUERY).matches) {
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
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="hud-label text-[0.62rem] text-brass">
                    情境 {currentStep.index} / {STEP_TOTAL}
                  </span>
                  <span className="border border-brass-dim bg-brass/10 px-2 py-0.5 text-[0.62rem] text-brass-hi font-hud">
                    {currentStep.tag}
                  </span>
                  {/* HD-2D 透視切換按鈕 */}
                  <button
                    type="button"
                    onClick={() => setIs3DView((v) => !v)}
                    className={`press-button border px-2 py-0.5 text-[0.62rem] transition-colors cursor-pointer ${
                      is3DView
                        ? "border-brass bg-brass text-ink font-bold shadow-[0_0_8px_rgba(200,162,60,0.4)]"
                        : "border-rule text-quill hover:border-brass-dim hover:text-parchment"
                    } font-hud`}
                    title="切換 Godot Forward+ HD-2D 實機透視角度"
                  >
                    {is3DView ? "🎮 HD-2D 透視" : "📐 2D 平面"}
                  </button>
                </div>

                <nav aria-label="戰場規則步驟" className="flex items-center gap-1">
                  {LANE_STEPS.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      aria-label={`查看第 ${index + 1} 步：${step.heading}`}
                      aria-pressed={active === index}
                      onClick={() => selectStep(index)}
                      className={`press-button h-7 w-7 border text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
                        active === index
                          ? "border-brass bg-brass font-bold text-ink"
                          : "border-rule text-quill hover:border-brass-dim hover:text-parchment"
                      } font-hud`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 棋盤實體 */}
              <Board
                step={currentStep}
                is3DView={is3DView}
                onNext={() => selectStep((active + 1) % LANE_STEPS.length)}
                onPrev={() => selectStep((active - 1 + LANE_STEPS.length) % LANE_STEPS.length)}
              />
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
                  } flex-col justify-center py-6 md:flex md:min-h-[50svh] md:py-8`}
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
                        className="text-xs font-bold tracking-[0.3em] text-brass font-display"
                      >
                        {step.index}
                      </span>
                      <span
                        className={`h-px flex-1 ${
                          isCurrent ? "bg-brass" : "bg-rule-soft"
                        }`}
                      />
                      <span
                        className="border border-rule px-2 py-0.5 text-[0.62rem] text-faint font-hud"
                      >
                        {step.tag}
                      </span>
                    </div>

                    <h3 className="section-title mt-4 text-xl sm:text-2xl">
                      {step.heading}
                    </h3>

                    {/* 核心口訣卡片 */}
                    <div className="plate notch mt-3 border-l-2 border-l-brass bg-panel p-3">
                      <p className="text-[0.84rem] font-semibold text-brass-hi leading-snug">
                        {step.summary}
                      </p>
                    </div>
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
