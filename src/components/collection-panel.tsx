import Image from "next/image";
import { COLLECTION_FEATURES, GAME_FACTS, SPOILS_RULES } from "@/data/game";
import { mediaCaptureCaption, mediaUrl } from "@/data/media";

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
            {GAME_FACTS.cards} 種卡 + {GAME_FACTS.tokens} 種衍生物。新帳號有 150 次新手抽卡，湊滿 60 張就能開打。
          </p>
        </header>

        {/* ============ 核心亮點：高懸念奪卡法則 ============ */}
        <div className="plate notch mt-12 border-2 border-brass bg-panel p-6 sm:p-8 md:p-10 shadow-[0_0_24px_rgba(200,162,60,0.15)]">
          <div className="flex flex-col gap-4 border-b border-rule pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="border border-brass bg-brass/20 px-2 py-0.5 text-[0.68rem] font-bold text-brass-hi font-hud">
                  硬派對決 · ANTE RULES
                </span>
                
              </div>
              <h3 className="section-title mt-2 text-2xl sm:text-3xl">
                🏆 贏了可以從對方牌組拿走一張
              </h3>
            </div>
            <div className="rounded border border-brass-dim bg-ink px-4 py-2 text-center shrink-0">
              <span className="hud-label text-brass-hi">牌庫歸屬移轉</span>
              <p className="text-lg font-bold text-parchment font-hud">
                勝者 +1 ｜ 敗者 −1
              </p>
            </div>
          </div>

          <p className="body-cjk mt-5 text-[0.94rem] leading-relaxed">
            這是真的轉移收藏，不是結算畫面上的數字。敗者牌組因此缺卡，要補齊才能再出戰。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SPOILS_RULES.map((rule) => (
              <div key={rule.label} className="plate p-4 border border-rule-soft bg-ink/70">
                <dt className="hud-label text-[0.68rem] text-brass-dim">{rule.label}</dt>
                <dd className="mt-1 text-base font-bold text-brass-hi font-serif">
                  {rule.value}
                </dd>
                <p className="body-cjk mt-2 text-[0.8rem] leading-normal text-quill">
                  {rule.note}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[0.74rem] text-faint">
            🔒 勝者已滿 3 張的卡不能再挑。
          </p>
        </div>

        {/* 遊戲介面截圖展示 */}
        <figure className="mt-14 max-w-4xl border border-rule bg-board p-1.5 shadow-md">
          <Image
            src={mediaUrl("/media/screens/main-menu.webp")}
            alt="紙鴉牌主選單，顯示引導練習、開始遊戲與卡包收藏入口"
            width={1280}
            height={720}
            sizes="(max-width: 1024px) 100vw, 896px"
            className="h-auto w-full object-cover"
          />
          <figcaption className="body-cjk px-3 py-3 text-[0.8rem] text-quill">
            主選單：引導練習、對戰準備與卡包收藏入口。{mediaCaptureCaption("/media/screens/main-menu.webp")}。
          </figcaption>
        </figure>

        {/* 收藏與組牌規則速覽 */}
        <div className="mt-14 border-t border-rule pt-8">
          <h3 className="text-xl font-bold text-parchment font-serif">
            牌庫構築準則
          </h3>
          <dl className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {COLLECTION_FEATURES.map((feature) => (
              <div key={feature.label} className="plate p-4 border-l-2 border-brass-dim">
                <dt className="hud-label text-[0.7rem]">{feature.label}</dt>
                <dd className="mt-1 text-lg font-bold text-brass-hi font-serif">
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
