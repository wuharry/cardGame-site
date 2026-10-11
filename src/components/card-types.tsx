"use client";

import { useState } from "react";
import { CARD_TYPES } from "@/data/game";
import { CardNote, GameCard } from "./game-card";

const byId = (id: string) => CARD_TYPES.find((t) => t.id === id)!;

/**
 * Section 03 — 六種卡型。
 *
 * 不排五張一樣的卡片。左邊把「場上一個單位其實是三張牌疊出來的」直接疊給你看
 * （從者站著、靈裝扣在旁邊、伏印蓋著塞在底下），右邊是兩張法術：秘術正著打，
 * 瞬咒斜插進來，因為它在守方反制窗口使用。
 *
 * 唯一的互動是把伏印翻開——那本來就是這張卡的規則。
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
    <section id="cards" className="grain relative border-t border-rule-soft bg-ink">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">III — The Deck</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            場上的一個單位，其實是三張牌疊出來的
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            牌組裡有六種卡：從者站上路線，靈裝扣在它身上，伏印蓋著埋在它底下，
            秘術在自己回合結算，瞬咒在反應時機介入，結界則持續支援種族戰術。
          </p>
        </header>

        <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:gap-12 xl:gap-20">
          {/* ============ 疊在一起的那三張 ============ */}
          <div>
            <SubHead mark="A" title="一個從者，三張牌" />

            {/* 卡片疊放區：只放卡，文字一律在外面，不跟絕對定位打架 */}
            <div className="relative mx-auto mt-8 aspect-[20/22] w-[min(20rem,86vw)] lg:mx-0">
              {/* 伏印：蓋著、塞在從者底下，只露出下緣 */}
              <button
                type="button"
                onClick={() => setWardRevealed((v) => !v)}
                aria-pressed={wardRevealed}
                className={`absolute top-[47%] left-[3%] w-[38%] cursor-pointer -rotate-6 transition-transform hover:-translate-y-1 ${
                  wardRevealed ? "z-30" : "z-0"
                }`}
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

              {/* 從者：主體。場上有伏印時，卡槽整排紅色脈動。 */}
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

              {/* 靈裝：扣在從者右側，一條實線接回去 */}
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
                  className="absolute -right-1 -bottom-2 border border-brass-dim bg-ink px-1.5 py-0.5 text-[0.66rem] tabular-nums text-brass-hi"
                  style={{ fontFamily: "var(--font-hud)" }}
                >
                  +0 / +2
                </span>
              </div>

              {/* 翻牌提示掛在疊放區右下，不擠進卡片之間 */}
              <p className="absolute right-0 bottom-0 z-30">
                <button
                  type="button"
                  onClick={() => setWardRevealed((v) => !v)}
                  className="cursor-pointer border border-crimson-dim bg-ink px-2.5 py-1.5 text-[0.68rem] tracking-[0.16em] text-crimson-hi uppercase transition-colors hover:border-crimson"
                  style={{ fontFamily: "var(--font-hud)" }}
                >
                  {wardRevealed ? "蓋回去" : "翻開伏印"}
                </button>
              </p>
            </div>

            <div className="mt-10 space-y-7">
              <CardNote zh={minion.zh} en={minion.en} rule={minion.detail} />
              <CardNote zh={equip.zh} en={equip.en} rule={equip.detail} />
              <CardNote
                zh={ward.zh}
                en={ward.en}
                rule={ward.detail}
                tone="crimson"
              />
            </div>

            <p className="body-cjk mt-8 border-l border-crimson-dim pl-4 text-[0.86rem]">
              上面那張從者正在脈動——場上有伏印時，我方整排卡槽都會這樣亮。
              對手看得到警戒，卻不知道埋在誰底下。
            </p>
          </div>

          {/* ============ 兩張法術 ============ */}
          <div>
            <SubHead mark="B" title="兩張法術，兩個時機" />

            <div className="relative mx-auto mt-8 aspect-[20/19] w-[min(20rem,86vw)] lg:mx-0">
              {/* 秘術：正著打，自己的回合 */}
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

              {/* 瞬咒：斜著插進來，打斷的就是左邊那張的結算 */}
              <div className="absolute top-[22%] left-[44%] z-20 w-[48%] rotate-[8deg]">
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
                className="absolute bottom-[2%] left-0 border border-steel-dim bg-ink px-2 py-1 text-[0.66rem] tracking-[0.16em] text-steel uppercase"
                style={{ fontFamily: "var(--font-hud)" }}
              >
                反制窗口
              </span>
            </div>

            <div className="mt-10 space-y-7">
              <CardNote zh={arcana.zh} en={arcana.en} rule={arcana.detail} />
              <CardNote
                zh={quick.zh}
                en={quick.en}
                rule={quick.detail}
                tone="steel"
              />
            </div>

            <dl className="mt-12 border-t border-rule-soft">
              {CARD_TYPES.map((type) => (
                <div
                  key={type.id}
                  className="flex items-baseline justify-between gap-4 border-b border-rule-soft py-2.5"
                >
                  <dt className="flex items-baseline gap-2">
                    <span
                      className="text-sm text-parchment"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {type.zh}
                    </span>
                    <span
                      className="text-[0.6rem] tracking-[0.2em] text-faint uppercase"
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
            <SubHead mark="C" title="一方一個結界，讓種族互相支援" />
            <div className="mt-6 max-w-2xl">
              <CardNote zh={domain.zh} en={domain.en} rule={domain.detail} />
            </div>
            <p className="body-cjk mt-5 max-w-2xl text-[0.86rem]">
              結界是持續存在的領域卡。妖精、風暴城、矮人、龍、潮汐與獸人各有種族結界，
              觸發條件與效果以各張卡文為準。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SubHead({ mark, title }: { mark: string; title: string }) {
  return (
    <h3 className="flex items-baseline gap-3 border-b border-rule-soft pb-3">
      <span
        className="text-sm text-brass"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {mark}
      </span>
      <span
        className="text-lg text-parchment"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {title}
      </span>
    </h3>
  );
}
