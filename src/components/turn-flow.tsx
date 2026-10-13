interface TurnStep {
  num: string;
  phase: string;
  en: string;
  badge: string;
  action: string;
}

const TURN_STEPS: TurnStep[] = [
  { num: "01", phase: "晨曦", en: "Dawn / Refill", badge: "回魔", action: "魔力回滿，缺錢可以燒手牌換。" },
  { num: "02", phase: "佈陣", en: "Deploy / Equip", badge: "召喚", action: "召喚從者、掛裝備、埋陷阱。" },
  { num: "03", phase: "征伐", en: "Combat / Strike", badge: "進攻", action: "跨路打前排；正面沒人就打臉。" },
  { num: "04", phase: "守備", en: "Twilight / Counter", badge: "反制", action: "魔力別花光，對手回合插隊反制。" },
];

/**
 * Section 02 — 回合流程。
 * 一階段一行就好：細節（召喚失調、反制窗口、爆費）全在遊戲內的「新手教學」，
 * 官網重複講一次只會把人嚇走。
 */
export function TurnFlow() {
  return (
    <section id="flow" className="grain relative border-t border-rule-soft bg-ink py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="section-title text-3xl sm:text-4xl">一回合四步</h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TURN_STEPS.map((step) => (
            <div key={step.num} className="plate flex flex-col p-5">
              <div className="flex items-center justify-between border-b border-rule-soft pb-3">
                <span
                  className="text-2xl font-bold tracking-wider text-brass-hi"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.num}
                </span>
                <span
                  className="border border-rule px-2 py-0.5 text-[0.62rem] tracking-wider text-faint uppercase"
                  style={{ fontFamily: "var(--font-hud)" }}
                >
                  {step.badge}
                </span>
              </div>

              <h3
                className="mt-4 text-lg font-bold text-parchment"
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

              <p className="body-cjk mt-3 text-[0.88rem] leading-relaxed">{step.action}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
