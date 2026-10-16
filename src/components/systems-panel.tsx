import { ACTION_RULES, GAME_FACTS, RESOURCE_RULES, type SystemRule } from "@/data/game";
import { PixelDice } from "./pixel-dice";

/**
 * Section 04 — 規則帳。
 * 版面照遊戲 HUD 排：上面是回合與魔力，中間兩欄是規則書內文，
 * 下面把「手牌上限 8」畫成真的八個槽位，並提供官方 3D 像素骰子互動體驗。
 */
export function SystemsPanel() {
  return (
    <section id="systems" className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">IV — The Rules</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            一回合能做的事，就這麼多
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            每個從者每回合一次普攻；強化攻擊和遠程法術與普攻擇一，技能仍需支付魔力。
          </p>
        </header>

        <div className="plate notch mt-12 md:mt-14">
          {/* --- HUD 上緣：回合與魔力 ---------------------------------- */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-rule px-5 py-4 md:px-8">
            <div className="flex items-baseline gap-3">
              <span className="hud-label">Turn</span>
              <span className="hud-value text-xl">06</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hud-label">Mana</span>
              <ManaTrack />
            </div>

            <p
              className="ml-auto text-[0.78rem] text-quill font-serif"
            >
              每回合 +1 並回滿，沒用完的不留到下回合。
            </p>
          </div>

          {/* --- 規則書內文：兩欄帳 ------------------------------------ */}
          <div className="grid md:grid-cols-2">
            <RuleColumn title="行動" en="Action economy" rules={ACTION_RULES} />
            <div className="border-t border-rule md:border-t-0 md:border-l">
              <RuleColumn title="資源" en="Resources" rules={RESOURCE_RULES} />
            </div>
          </div>

          {/* --- HUD 下緣：手牌上限 8 ---------------------------------- */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
            <span className="hud-label">Hand</span>
            <div className="flex items-end gap-1.5">
              {Array.from({ length: GAME_FACTS.handLimit }, (_, i) => (
                <span key={i} className="block h-8 w-5 rounded-card border border-brass-dim bg-panel-hi sm:h-10 sm:w-7" />
              ))}
              <span className="mx-1 self-center text-faint">|</span>
              <span className="relative block h-8 w-5 rounded-card border border-crimson-dim bg-crimson-dim/20 sm:h-10 sm:w-7">
                <span className="absolute inset-0 flex items-center justify-center text-crimson-hi">
                  ✕
                </span>
              </span>
            </div>
            <p
              className="text-[0.78rem] text-quill font-serif"
            >
              滿手時抽到的第 9 張直接入墓。
            </p>
          </div>
        </div>

        {/* 3D 像素骰子互動區 */}
        <div className="mt-8">
          <PixelDice />
        </div>
      </div>
    </section>
  );
}

/** 十顆魔力菱形，以每秒一階的節奏填滿再歸零：示範「每回合 +1、上限 10」。 */
function ManaTrack() {
  const pips = Array.from({ length: GAME_FACTS.manaCap });
  return (
    <span className="relative flex" aria-label={`魔力上限 ${GAME_FACTS.manaCap}`}>
      <span className="flex gap-1">
        {pips.map((_, i) => (
          <ManaPip key={i} lit={false} />
        ))}
      </span>
      <span className="animate-mana-fill absolute inset-y-0 left-0 overflow-hidden">
        <span className="flex gap-1">
          {pips.map((_, i) => (
            <ManaPip key={i} lit />
          ))}
        </span>
      </span>
    </span>
  );
}

function ManaPip({ lit }: { lit: boolean }) {
  return (
    <span
      className={`block h-2.5 w-2.5 shrink-0 rotate-45 border ${
        lit ? "border-brass-hi bg-brass" : "border-brass-dim/70 bg-transparent"
      }`}
    />
  );
}

function RuleColumn({
  title,
  en,
  rules,
}: {
  title: string;
  en: string;
  rules: SystemRule[];
}) {
  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <h3 className="flex items-baseline gap-3">
        <span
          className="text-lg text-parchment font-serif"
        >
          {title}
        </span>
        <span className="hud-label">{en}</span>
      </h3>

      <dl className="mt-5">
        {rules.map((rule) => (
          <div
            key={rule.label}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-t border-rule-soft py-3"
          >
            <dt className="hud-label" style={{ color: "var(--color-quill)" }}>{rule.label}</dt>
            <dd
              className="hud-value text-right text-base text-brass-hi font-hud"
            >
              {rule.value}
            </dd>
            <p className="body-cjk col-span-2 mt-1 text-[0.84rem] leading-relaxed">
              {rule.note}
            </p>
          </div>
        ))}
      </dl>
    </div>
  );
}
