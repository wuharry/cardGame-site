import Image from "next/image";
import { COLLECTION_FEATURES, GAME_FACTS, SPOILS_RULES } from "@/data/game";
import { mediaUrl } from "@/data/media";

export function CollectionPanel() {
  return (
    <section id="collection" className="grain border-t border-rule-soft bg-ink py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <header className="max-w-2xl">
          <p className="eyebrow">V — Deck & Spoils</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            構築專屬牌組 · 勝者掠奪戰利
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            全卡池共有 {GAME_FACTS.cards} 種正式卡牌與 {GAME_FACTS.tokens} 種衍生物。
            新玩家享有 150 次免費新手自選額度，自由調配合法 60 張牌組即可開局；
            而在正式真人對決中，勝利者更將獲得掠奪敗者手牌的至高特權。
          </p>
        </header>

        {/* ============ 核心亮點：高懸念奪卡法則 ============ */}
        <div className="plate notch mt-12 border-2 border-brass bg-panel p-6 sm:p-8 md:p-10 shadow-[0_0_24px_rgba(200,162,60,0.15)]">
          <div className="flex flex-col gap-4 border-b border-rule pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="border border-brass bg-brass/20 px-2 py-0.5 text-[0.68rem] font-bold text-brass-hi" style={{ fontFamily: "var(--font-hud)" }}>
                  硬派對決 · ANTE RULES
                </span>
                <span className="text-xs text-crimson-hi font-bold">高懸念博弈</span>
              </div>
              <h3 className="section-title mt-2 text-2xl sm:text-3xl">
                🏆 勝利者的掠奪之權：勝者挑一張，敗者真切失去
              </h3>
            </div>
            <div className="rounded border border-brass-dim bg-ink px-4 py-2 text-center shrink-0">
              <span className="hud-label text-brass-hi">牌庫歸屬移轉</span>
              <p className="text-lg font-bold text-parchment" style={{ fontFamily: "var(--font-hud)" }}>
                勝者 +1 ｜ 敗者 −1
              </p>
            </div>
          </div>

          <p className="body-cjk mt-5 text-[0.94rem] leading-relaxed">
            在正式真人 PvP 對戰中獲勝，勝者將獲准直接從敗者「本局起始牌組」中挑選任意一張心儀卡牌，永久納入個人收藏！
            這並非虛擬的數值增減，而是真正的所有權奪取。若敗者原牌組因此缺卡，需重新調整補齊才可出戰。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SPOILS_RULES.map((rule) => (
              <div key={rule.label} className="plate p-4 border border-rule-soft bg-ink/70">
                <dt className="hud-label text-[0.68rem] text-brass-dim">{rule.label}</dt>
                <dd className="mt-1 text-base font-bold text-brass-hi" style={{ fontFamily: "var(--font-serif)" }}>
                  {rule.value}
                </dd>
                <p className="body-cjk mt-2 text-[0.8rem] leading-normal text-quill">
                  {rule.note}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[0.74rem] text-faint">
            🔒 公平保護條款：勝者若已持有 3 張上限則不可重複挑選；AI 單人練習、訪客模式或斷線棄賽均不產生奪卡結算。
          </p>
        </div>

        {/* 遊戲介面截圖展示 */}
        <figure className="mt-14 max-w-4xl border border-rule bg-board p-1.5 shadow-md">
          <Image
            src={mediaUrl("/media/screens/main-menu.webp")}
            alt="暮色秘典主選單畫面，顯示 150 次新手抽卡額度與組牌入口"
            width={1282}
            height={752}
            sizes="(max-width: 1024px) 100vw, 896px"
            className="h-auto w-full object-cover"
          />
          <figcaption className="body-cjk px-3 py-3 text-[0.8rem] text-quill">
            暮色秘典主選單：新手 150 次額度隨心領取，未抽完亦可隨時用持有卡組牌開戰；AI 提供 19 副專屬預組隨時切磋。
          </figcaption>
        </figure>

        {/* 收藏與組牌規則速覽 */}
        <div className="mt-14 border-t border-rule pt-8">
          <h3 className="text-xl font-bold text-parchment" style={{ fontFamily: "var(--font-serif)" }}>
            牌庫構築準則
          </h3>
          <dl className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {COLLECTION_FEATURES.map((feature) => (
              <div key={feature.label} className="plate p-4 border-l-2 border-brass-dim">
                <dt className="hud-label text-[0.7rem]">{feature.label}</dt>
                <dd className="mt-1 text-lg font-bold text-brass-hi" style={{ fontFamily: "var(--font-serif)" }}>
                  {feature.value}
                </dd>
                <p className="body-cjk mt-2 text-[0.84rem] text-quill leading-relaxed">
                  {feature.note}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
