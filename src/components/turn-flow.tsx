"use client";

import { useState } from "react";

interface TurnStep {
  num: string;
  phase: string;
  en: string;
  action: string;
  tactic: string;
  tip: string;
  badge: string;
  detail: string;
}

const TURN_STEPS: TurnStep[] = [
  {
    num: "01",
    phase: "晨曦回魔",
    en: "Dawn / Refill",
    action: "魔力上限 +1 並回滿（上限 10）",
    tactic: "手牌可獻祭換取暫時超額魔力",
    tip: "未耗盡的魔力回合結束不累加，但可留到對手回合施放反制！",
    badge: "資源成長",
    detail:
      "輪到自己的回合時，自然魔力上限 +1 並立刻回滿（最高 10）。若急需關鍵高費牌，可將一張手牌捨棄，換取相當於該牌費用一半的暫時魔力，發動爆費戰術。",
  },
  {
    num: "02",
    phase: "佈陣召喚",
    en: "Deploy / Equip",
    action: "出從者 · 掛靈裝 · 埋伏印",
    tactic: "建構「三卡合一」的強力從者陣容",
    tip: "除【衝鋒】外，剛召喚的從者需休整一回合（召喚失調）。",
    badge: "戰術築陣",
    detail:
      "主要階段可在四路空位召喚從者。可為主力從者穿戴【靈裝】提升數值，或在其腳底覆蓋【伏印】陷阱。進攻類依卡文顯示警戒，防守類不向對手提示；揭示詢問與私密紀錄只給擁有者。",
  },
  {
    num: "03",
    phase: "跨路征伐",
    en: "Combat / Strike",
    action: "自由跨路打前排 · 破路直轟英雄",
    tactic: "敵方前排任選；前排空缺時直擊本體",
    tip: "每位從者每回合 1 次普攻 + 1 次技能；攻擊從者時互換傷害。",
    badge: "正面交鋒",
    detail:
      "發動攻擊時，不限正前方！只要敵方沒有【嘲諷】，你可以自由挑選敵方前排任一目標集中火力。一旦敵方某路的前排被清空，該路的從者便能長驅直入痛擊敵方英雄（20 HP），直取勝利！",
  },
  {
    num: "04",
    phase: "暮色守備",
    en: "Twilight / Counter",
    action: "回合結束 · 預留魔力即時反制",
    tactic: "在對手出牌窗口打出【瞬咒】或觸發【伏印】",
    tip: "對手的回合才是真正智鬥的開始，隨時準備打斷敵方節奏！",
    badge: "反應反制",
    detail:
      "打完攻擊後結束你的主要階段。若保留剩餘魔力，當對手在下一回合宣告秘術、召喚或發動攻擊時，將開啟「反制窗口」，你可即時插隊打出【瞬咒】無效敵方行動或逆轉戰局！",
  },
];

export function TurnFlow() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="flow" className="grain relative border-t border-rule-soft bg-ink py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <header className="max-w-2xl">
          <p className="eyebrow">Tactical Loop · 核心節奏</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            30 秒掌握一回合的交鋒節奏
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            《暮色秘典》是節奏明快、但講究留費反制的四路戰術卡牌。
            一回合的核心心流，只需記住這四個依序推進的交鋒階段：
          </p>
        </header>

        {/* 四步驟卡片流 */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TURN_STEPS.map((step, idx) => {
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`plate group relative flex flex-col text-left transition-all duration-200 cursor-pointer p-5 sm:p-6 ${
                  isSelected
                    ? "border-brass bg-panel-hi shadow-[0_0_20px_rgba(200,162,60,0.12)]"
                    : "hover:border-brass-dim hover:bg-panel"
                }`}
              >
                {/* 階段標記與編號 */}
                <div className="flex items-center justify-between border-b border-rule-soft pb-3">
                  <span
                    className={`text-2xl font-bold tracking-wider ${
                      isSelected ? "text-brass-hi" : "text-faint group-hover:text-quill"
                    }`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {step.num}
                  </span>
                  <span
                    className={`border px-2 py-0.5 text-[0.62rem] tracking-wider uppercase ${
                      isSelected
                        ? "border-brass text-brass-hi bg-brass/10"
                        : "border-rule text-faint"
                    }`}
                    style={{ fontFamily: "var(--font-hud)" }}
                  >
                    {step.badge}
                  </span>
                </div>

                {/* 標題與英文名 */}
                <div className="mt-4">
                  <h3
                    className="text-lg font-bold text-parchment"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {step.phase}
                  </h3>
                  <p
                    className="text-[0.65rem] tracking-[0.2em] text-quill uppercase"
                    style={{ fontFamily: "var(--font-hud)" }}
                  >
                    {step.en}
                  </p>
                </div>

                {/* 核心動作與口訣 */}
                <div className="mt-4 flex-1">
                  <p className="text-[0.88rem] font-semibold text-brass-hi leading-snug">
                    {step.action}
                  </p>
                  <p className="body-cjk mt-2 text-[0.82rem] leading-relaxed text-quill">
                    {step.tactic}
                  </p>
                </div>

                {/* 底部提醒標籤 */}
                <div className="mt-5 border-t border-rule-soft pt-3">
                  <p className="text-[0.72rem] leading-relaxed text-parchment/70">
                    💡 <span className="italic">{step.tip}</span>
                  </p>
                </div>

                {/* 被選中高亮指示線 */}
                {isSelected && (
                  <span className="absolute inset-x-0 -bottom-px h-1 bg-brass" />
                )}
              </button>
            );
          })}
        </div>

        {/* 當前選中階段的深度解析面板 */}
        <div className="plate notch mt-8 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-rule pb-4">
            <div className="flex items-center gap-3">
              <span
                className="text-2xl font-bold text-brass-hi"
                style={{ fontFamily: "var(--font-display)" }}
              >
                階段 {TURN_STEPS[activeStep].num} 戰略剖析
              </span>
              <span className="text-xl text-parchment" style={{ fontFamily: "var(--font-serif)" }}>
                — {TURN_STEPS[activeStep].phase}
              </span>
            </div>
            <span className="hud-label text-brass">
              Phase {TURN_STEPS[activeStep].num} of 04
            </span>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <p className="body-cjk text-[0.94rem] leading-relaxed">
              {TURN_STEPS[activeStep].detail}
            </p>
            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : 3))}
                className="border border-rule px-3 py-1.5 text-xs text-quill transition-colors hover:border-brass hover:text-parchment"
                style={{ fontFamily: "var(--font-hud)" }}
              >
                ← 上一階段
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev < 3 ? prev + 1 : 0))}
                className="border border-brass bg-brass/10 px-3 py-1.5 text-xs text-brass-hi transition-colors hover:bg-brass/20"
                style={{ fontFamily: "var(--font-hud)" }}
              >
                下一階段 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
