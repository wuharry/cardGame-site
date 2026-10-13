"use client";

import { useState, useRef } from "react";
import { CARD_TYPES, type CardType } from "@/data/game";
import { CardNote, GameCard } from "./game-card";

const byId = (id: string) => CARD_TYPES.find((t) => t.id === id)!;

/**
 * Section 03 — 六種卡型。
 *
 * 包含：
 * 1. 【3D 空間立體層次檢視器】：可自由旋轉、一鍵 3D 空間拆解（從者+靈裝+伏印三層分離）
 * 2. 兩張法術與反制窗口時序軸
 * 3. 種族領域結界
 */
export function CardTypeShowcase() {
  const [wardRevealed, setWardRevealed] = useState(false);

  const minion = byId("minion");
  const equip = byId("equip");
  const ward = byId("ward");
  const arcana = byId("arcana");
  const quick = byId("quick");
  const domain = byId("domain");

  return (
    <section id="cards" className="grain relative border-t border-rule-soft bg-ink py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <header className="max-w-2xl">
          <p className="eyebrow">III — The Cards</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            場上的一個單位，是三張牌疊出來的
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
六種卡型；場上一個單位可以疊到三張：從者 + 靈裝 + 伏印。
          </p>
        </header>

        <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:gap-12 xl:gap-20">
          {/* ============ A: 從者三重武裝生態 (含 3D 空間拆解檢視) ============ */}
          <div>
            <SubHead mark="A" title="從者三重武裝生態" tag="3D 空間立體檢視" />

            {/* 3D 空間卡片舞台 */}
            <Exploded3DCardStage
              minion={minion}
              equip={equip}
              ward={ward}
              wardRevealed={wardRevealed}
              onToggleWard={() => setWardRevealed((v) => !v)}
            />

            {/* 三種卡型條列說明 */}
            <div className="mt-10 space-y-4">
              <div className="plate p-3.5 border-l-2 border-brass">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-parchment">👤 {minion.zh} ({minion.en}) · 中層</span>
                  <span className="hud-label text-brass-hi">{minion.timing}</span>
                </div>
                <p className="body-cjk mt-2 text-[0.84rem]">{minion.rule}</p>
              </div>

              <div className="plate p-3.5 border-l-2 border-brass-dim">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-parchment">🗡️ {equip.zh} ({equip.en}) · 頂層</span>
                  <span className="hud-label text-quill">{equip.timing}</span>
                </div>
                <p className="body-cjk mt-2 text-[0.84rem]">{equip.rule}</p>
              </div>

              <div className="plate p-3.5 border-l-2 border-crimson">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-crimson-hi">💣 {ward.zh} ({ward.en}) · 底層</span>
                  <span className="hud-label text-crimson-hi">{ward.timing}</span>
                </div>
                <p className="body-cjk mt-2 text-[0.84rem]">{ward.rule}</p>
              </div>
            </div>
          </div>

          {/* ============ B: 兩張法術，兩個時機 ============ */}
          <div>
            <SubHead mark="B" title="兩張法術，兩個時機" tag="主動與反制" />

            <div className="relative mx-auto mt-8 aspect-[20/19] w-[min(20rem,86vw)] lg:mx-0">
              {/* 秘術 */}
              <div className="absolute top-0 left-0 z-10 w-[52%]">
                <GameCard
                  art={arcana.art}
                  alt={arcana.artAlt}
                  name="火焰爆裂"
                  cost={3}
                  stamp="Arcana"
                  sizes="(max-width: 1024px) 46vw, 175px"
                />
              </div>

              {/* 瞬咒 */}
              <div className="absolute top-[20%] left-[44%] z-20 w-[48%] rotate-[8deg]">
                <GameCard
                  art={quick.art}
                  alt={quick.artAlt}
                  name="虛空反噬"
                  cost={2}
                  stamp="Quick"
                  sizes="(max-width: 1024px) 42vw, 160px"
                />
              </div>

              <span
                className="absolute bottom-[2%] left-0 border border-steel bg-ink px-2.5 py-1 text-[0.68rem] tracking-[0.16em] text-steel font-bold uppercase shadow-sm"
                style={{ fontFamily: "var(--font-hud)" }}
              >
                ⚡ 守方反制窗口
              </span>
            </div>

            {/* 反制窗口說明 */}
            <div className="plate notch mt-8 p-4 border-l-2 border-steel">
              <span className="hud-label text-steel">反制時序概念</span>
              <div className="mt-2 flex items-center justify-between text-xs text-parchment/80">
                <span className="rounded bg-panel px-2 py-1">對手出牌宣告</span>
                <span>➔</span>
                <span className="rounded border border-steel bg-steel/20 px-2 py-1 font-bold text-steel">⚡ 反制窗口開啟</span>
                <span>➔</span>
                <span className="rounded bg-panel px-2 py-1">結算／反制失效</span>
              </div>
              <p className="mt-2.5 text-[0.78rem] text-quill">
                瞬咒只能在「守方反制窗口」打出，消耗留存的魔力。能打斷對手的秘術、攻擊或特殊技能！
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="plate p-3.5 border-l-2 border-brass-dim">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-parchment">📜 {arcana.zh} ({arcana.en})</span>
                  <span className="hud-label text-brass-hi">{arcana.timing}</span>
                </div>
                <p className="body-cjk mt-2 text-[0.84rem]">{arcana.rule}</p>
              </div>

              <div className="plate p-3.5 border-l-2 border-steel">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-steel">⚡ {quick.zh} ({quick.en})</span>
                  <span className="hud-label text-steel">{quick.timing}</span>
                </div>
                <p className="body-cjk mt-2 text-[0.84rem]">{quick.rule}</p>
              </div>
            </div>

          </div>
        </div>

        {/* ============ C: 結界領域 ============ */}
        <div className="mt-16 grid gap-8 border-t border-rule-soft pt-10 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-10">
          <div className="mx-auto w-40 sm:mx-0">
            <GameCard
              art={domain.art}
              alt={domain.artAlt}
              name="妖精之森"
              cost={3}
              stamp="Domain"
              sizes="160px"
            />
          </div>
          <div className="self-center">
            <SubHead mark="C" title="全場結界，種族連攜核心" tag="領域光環" />
            <div className="mt-4 max-w-2xl">
              <CardNote zh={domain.zh} en={domain.en} rule={domain.rule} />
            </div>
            <p className="body-cjk mt-3 max-w-2xl text-[0.86rem] text-faint">
              💡 每側最多一張，打出新的會把舊的送進墓地。
            </p>          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 3D 空間立體層次檢視器 (Exploded 3D Card Stage)
 * 允許使用者切換「3D 空間拆解」檢視，在 Z 軸（深度）上展開從者、靈裝與伏印三層關係，
 * 並支援游標/觸控 3D 視差傾斜。
 */
function Exploded3DCardStage({
  minion,
  equip,
  ward,
  wardRevealed,
  onToggleWard,
}: {
  minion: CardType;
  equip: CardType;
  ward: CardType;
  wardRevealed: boolean;
  onToggleWard: () => void;
}) {
  const [isExploded, setIsExploded] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // 計算最大 18 度的 3D 旋轉傾角
    const rx = -(y / (rect.height / 2)) * 18;
    const ry = (x / (rect.width / 2)) * 18;
    setTilt({ rx, ry });
  }

  function handlePointerLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  // 拆解模式下的基準 3D 姿態
  const baseRx = isExploded ? 24 : 0;
  const baseRy = isExploded ? -18 : 0;
  const currentRx = baseRx + tilt.rx;
  const currentRy = baseRy + tilt.ry;

  return (
    <div className="mt-8">
      {/* 3D 控制列 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule-soft pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="hud-label text-[0.62rem] text-brass">3D Mode</span>
          <button
            type="button"
            onClick={() => setIsExploded(false)}
            className={`border px-2.5 py-1 text-xs cursor-pointer transition-colors ${
              !isExploded
                ? "border-brass bg-brass text-ink font-bold"
                : "border-rule text-quill hover:border-brass-dim"
            }`}
            style={{ fontFamily: "var(--font-hud)" }}
          >
            堆疊模式
          </button>
          <button
            type="button"
            onClick={() => setIsExploded(true)}
            className={`border px-2.5 py-1 text-xs cursor-pointer transition-colors ${
              isExploded
                ? "border-brass bg-brass text-ink font-bold shadow-[0_0_12px_rgba(200,162,60,0.4)]"
                : "border-rule text-quill hover:border-brass-dim"
            }`}
            style={{ fontFamily: "var(--font-hud)" }}
          >
            ⚡ 3D 空間拆解
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleWard}
          className="border border-crimson-dim bg-ink px-2.5 py-1 text-[0.7rem] text-crimson-hi hover:border-crimson hover:bg-crimson/10 cursor-pointer transition-colors"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {wardRevealed ? "⟲ 蓋回伏印" : "👁 翻開伏印"}
        </button>
      </div>

      {/* 3D 透視舞臺容器 */}
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative mx-auto mt-6 aspect-[20/22] w-[min(20rem,86vw)] select-none lg:mx-0 cursor-grab active:cursor-grabbing"
        style={{
          perspective: "1200px",
        }}
      >
        {/* 3D 剛體骨架 */}
        <div
          className="relative h-full w-full transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${currentRx}deg) rotateY(${currentRy}deg)`,
          }}
        >
          {/* ============ 底層 01: 伏印 (Ward) ============ */}
          <div
            className="absolute transition-all duration-500 ease-out"
            style={{
              width: "42%",
              top: isExploded ? "60%" : "47%",
              left: isExploded ? "2%" : "3%",
              transformStyle: "preserve-3d",
              transform: isExploded
                ? "translate3d(0, 0, -80px) rotateZ(-6deg)"
                : "translate3d(0, 0, -10px) rotateZ(-6deg)",
              zIndex: wardRevealed ? 30 : 5,
            }}
          >
            <button
              type="button"
              onClick={onToggleWard}
              className="w-full cursor-pointer transition-transform hover:scale-105"
            >
              {wardRevealed ? (
                <GameCard
                  art={ward.art}
                  alt={ward.artAlt}
                  name="荊棘伏印"
                  cost={1}
                  stamp="Ward"
                  sizes="(max-width: 1024px) 34vw, 130px"
                />
              ) : (
                <GameCard faceDown />
              )}
            </button>

            {isExploded && (
              <span
                className="absolute -bottom-6 left-0 border border-crimson-dim bg-ink/90 px-1.5 py-0.5 text-[0.62rem] text-crimson-hi whitespace-nowrap"
                style={{ fontFamily: "var(--font-hud)" }}
              >
                底層 01 · 隱秘伏印 (Z: -80px)
              </span>
            )}
          </div>

          {/* ============ 中層 02: 從者本體 (Minion) ============ */}
          <div
            className={`absolute top-0 left-0 transition-all duration-500 ease-out border p-1 ${
              wardRevealed ? "border-transparent" : "ward-alert"
            }`}
            style={{
              width: "54%",
              transformStyle: "preserve-3d",
              transform: isExploded
                ? "translate3d(15%, 8%, 0px)"
                : "translate3d(0, 0, 0px)",
              zIndex: 15,
            }}
          >
            <GameCard
              art={minion.art}
              alt={minion.artAlt}
              name="騎士"
              cost={4}
              atk={3}
              hp={5}
              sizes="(max-width: 1024px) 46vw, 175px"
            />

            {isExploded && (
              <span
                className="absolute -top-6 left-0 border border-brass-dim bg-ink/90 px-1.5 py-0.5 text-[0.62rem] text-brass-hi whitespace-nowrap"
                style={{ fontFamily: "var(--font-hud)" }}
              >
                中層 02 · 站場從者 (Z: 0px)
              </span>
            )}
          </div>

          {/* ============ 頂層 03: 靈裝 (Equip) ============ */}
          <div
            className="absolute transition-all duration-500 ease-out"
            style={{
              width: "40%",
              top: isExploded ? "2%" : "8%",
              left: isExploded ? "60%" : "54%",
              transformStyle: "preserve-3d",
              transform: isExploded
                ? "translate3d(0, 0, 80px) rotateZ(3deg)"
                : "translate3d(0, 0, 20px)",
              zIndex: 25,
            }}
          >
            <span className="absolute top-[22%] -left-4 h-px w-4 bg-brass-dim" />
            <GameCard
              art={equip.art}
              alt={equip.artAlt}
              name="秘銀胸鎧"
              cost={2}
              stamp="Equip"
              sizes="(max-width: 1024px) 34vw, 130px"
            />
            <span
              className="absolute -right-1 -bottom-2 border border-brass bg-ink px-1.5 py-0.5 text-[0.66rem] tabular-nums font-bold text-brass-hi shadow-md"
              style={{ fontFamily: "var(--font-hud)" }}
            >
              🛡️ +0 / +2
            </span>

            {isExploded && (
              <span
                className="absolute -bottom-6 right-0 border border-brass-dim bg-ink/90 px-1.5 py-0.5 text-[0.62rem] text-brass-hi whitespace-nowrap"
                style={{ fontFamily: "var(--font-hud)" }}
              >
                頂層 03 · 穿戴靈裝 (Z: +80px)
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[0.68rem] text-faint">
        🖱️ 移動滑鼠可全方位旋轉 3D 視角；點擊「3D 空間拆解」即可以深度（Z 軸）分離三層卡牌。
      </p>
    </div>
  );
}

function SubHead({
  mark,
  title,
  tag,
}: {
  mark: string;
  title: string;
  tag?: string;
}) {
  return (
    <h3 className="flex items-baseline justify-between border-b border-rule-soft pb-3">
      <div className="flex items-baseline gap-3">
        <span
          className="text-sm font-bold text-brass"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {mark}
        </span>
        <span
          className="text-lg font-bold text-parchment"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {title}
        </span>
      </div>
      {tag && (
        <span
          className="border border-rule px-2 py-0.5 text-[0.62rem] text-faint"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {tag}
        </span>
      )}
    </h3>
  );
}
