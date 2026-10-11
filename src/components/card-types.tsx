"use client";

import { useState } from "react";
import { CARD_TYPES } from "@/data/game";
import { CardNote, GameCard } from "./game-card";

const byId = (id: string) => CARD_TYPES.find((t) => t.id === id)!;

/**
 * Section 03 — 六種卡型。
 *
 * 直觀展示：
 * 左邊：從者三重生態（主體 + 靈裝 + 隱秘伏印），點擊即可翻開陷阱
 * 右邊：法術與反制窗口時機軸
 * 下方：種族領域結界
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
            牌組裡共有六種卡型：從者站上路線交鋒，靈裝武裝其身，伏印暗伏其底；
            秘術於己方回合發難，瞬咒於反制時機插隊，結界則為全族提供持續庇護。
          </p>
        </header>

        <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:gap-12 xl:gap-20">
          {/* ============ A: 從者三重武裝生態 ============ */}
          <div>
            <SubHead mark="A" title="從者三重武裝生態" tag="站場組合" />

            {/* 卡片疊放區 */}
            <div className="relative mx-auto mt-8 aspect-[20/22] w-[min(20rem,86vw)] lg:mx-0">
              {/* 伏印：蓋著、塞在從者底下 */}
              <button
                type="button"
                onClick={() => setWardRevealed((v) => !v)}
                aria-pressed={wardRevealed}
                className={`absolute top-[47%] left-[3%] w-[38%] cursor-pointer -rotate-6 transition-all duration-300 hover:-translate-y-1 ${
                  wardRevealed ? "z-30 shadow-[0_0_16px_rgba(220,94,78,0.5)]" : "z-0"
                }`}
                title={wardRevealed ? "點擊蓋回伏印" : "點擊翻開伏印陷阱"}
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

              {/* 從者：主體 */}
              <div
                className={`absolute top-0 left-0 z-10 w-[52%] border p-1 transition-colors ${
                  wardRevealed ? "border-transparent" : "ward-alert"
                }`}
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
              </div>

              {/* 靈裝：扣在從者右側 */}
              <div className="absolute top-[8%] left-[54%] z-20 w-[38%]">
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
                  className="absolute -right-1 -bottom-2 border border-brass bg-ink px-1.5 py-0.5 text-[0.66rem] tabular-nums font-bold text-brass-hi shadow-sm"
                  style={{ fontFamily: "var(--font-hud)" }}
                >
                  🛡️ +0 / +2
                </span>
              </div>

              {/* 翻牌互動按鈕 */}
              <div className="absolute right-0 bottom-0 z-30">
                <button
                  type="button"
                  onClick={() => setWardRevealed((v) => !v)}
                  className="cursor-pointer border border-crimson-dim bg-ink px-3 py-1.5 text-[0.72rem] tracking-[0.16em] text-crimson-hi uppercase transition-all hover:border-crimson hover:bg-crimson/10 shadow-sm"
                  style={{ fontFamily: "var(--font-hud)" }}
                >
                  {wardRevealed ? "⟲ 蓋回伏印" : "👁 翻開伏印陷阱"}
                </button>
              </div>
            </div>

            {/* 三種卡型條列說明 */}
            <div className="mt-10 space-y-5">
              <div className="plate p-3.5 border-l-2 border-brass">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-parchment">👤 {minion.zh} ({minion.en})</span>
                  <span className="hud-label text-brass-hi">{minion.timing}</span>
                </div>
                <p className="body-cjk mt-2 text-[0.84rem]">{minion.detail}</p>
              </div>

              <div className="plate p-3.5 border-l-2 border-brass-dim">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-parchment">🗡️ {equip.zh} ({equip.en})</span>
                  <span className="hud-label text-quill">{equip.timing}</span>
                </div>
                <p className="body-cjk mt-2 text-[0.84rem]">{equip.detail}</p>
              </div>

              <div className="plate p-3.5 border-l-2 border-crimson">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-crimson-hi">💣 {ward.zh} ({ward.en})</span>
                  <span className="hud-label text-crimson-hi">{ward.timing}</span>
                </div>
                <p className="body-cjk mt-2 text-[0.84rem]">{ward.detail}</p>
              </div>
            </div>

            <p className="body-cjk mt-6 border-l border-crimson-dim pl-4 text-[0.82rem] text-faint">
              💡 伏印埋設後，我方整排卡槽都會發出紅色警戒脈動。對手看得到危險預警，但無法確定伏印藏在誰的腳下！
            </p>
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
                <p className="body-cjk mt-2 text-[0.84rem]">{arcana.detail}</p>
              </div>

              <div className="plate p-3.5 border-l-2 border-steel">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-steel">⚡ {quick.zh} ({quick.en})</span>
                  <span className="hud-label text-steel">{quick.timing}</span>
                </div>
                <p className="body-cjk mt-2 text-[0.84rem]">{quick.detail}</p>
              </div>
            </div>

            {/* 卡型速查表 */}
            <dl className="mt-8 border-t border-rule-soft">
              {CARD_TYPES.map((type) => (
                <div
                  key={type.id}
                  className="flex items-baseline justify-between gap-4 border-b border-rule-soft py-2"
                >
                  <dt className="flex items-baseline gap-2">
                    <span
                      className="text-sm text-parchment font-medium"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {type.zh}
                    </span>
                    <span
                      className="text-[0.62rem] tracking-[0.2em] text-faint uppercase"
                      style={{ fontFamily: "var(--font-hud)" }}
                    >
                      {type.en}
                    </span>
                  </dt>
                  <dd
                    className="text-right text-[0.78rem] text-quill"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {type.timing}
                  </dd>
                </div>
              ))}
            </dl>
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
              <CardNote zh={domain.zh} en={domain.en} rule={domain.detail} />
            </div>
            <p className="body-cjk mt-3 max-w-2xl text-[0.86rem] text-faint">
              💡 結界每側最多存在一張（不佔從者卡槽）。打出新結界會將舊結界置入墓地。
              妖精、風暴城、矮人、龍、潮汐與獸人各有專屬領域，可大幅強化種族體系！
            </p>
          </div>
        </div>
      </div>
    </section>
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
