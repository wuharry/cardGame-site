import Image from "next/image";
import { COLLECTION_FEATURES, GAME_FACTS, SPOILS_RULES } from "@/data/game";
import { mediaCaptureCaption, mediaUrl } from "@/data/media";

export function CollectionPanel() {
  return (
    <section id="collection" className="grain border-t border-rule-soft bg-ink py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <header className="max-w-2xl">
          <p className="eyebrow">V — Deck & Collection</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            六十張卡，構築自己的打法
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            {GAME_FACTS.cards} 種卡 + {GAME_FACTS.tokens} 種衍生物。完成新手教學後取得 60 張起始牌組，可以直接對戰。新帳號另有 150 次新手抽卡，可慢慢開，不必先抽完。
          </p>
        </header>

        {/* Current availability and preserved historical settlement rules. */}
        <div className="plate notch mt-12 border-2 border-brass bg-panel p-6 sm:p-8 md:p-10 shadow-[0_0_24px_rgba(200,162,60,0.15)]">
          <div className="flex flex-col gap-4 border-b border-rule pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="border border-brass bg-brass/20 px-2 py-0.5 text-[0.68rem] font-bold text-brass-hi font-hud">
                  奪牌暫停 · ANTE PAUSED
                </span>
                
              </div>
              <h3 className="section-title mt-2 text-2xl sm:text-3xl">
                新的奪牌對局暫停開放
              </h3>
            </div>
            <div className="rounded border border-brass-dim bg-ink px-4 py-2 text-center shrink-0">
              <span className="hud-label text-brass-hi">輕鬆與天梯對戰</span>
              <p className="text-lg font-bold text-parchment font-hud">
                收藏不移轉
              </p>
            </div>
          </div>

          <p className="body-cjk mt-5 text-[0.94rem] leading-relaxed">
            一般對戰不會失去卡牌。本輪暫停新的奪牌配對與房間；先前已完成的奪牌局仍依當局同意規則結算，既有戰利品與收據保留。
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
            alt="紙鴉牌主選單，包含教學、對戰、卡包與收藏入口"
            width={1920}
            height={1080}
            sizes="(max-width: 1024px) 100vw, 896px"
            className="h-auto w-full object-cover"
          />
          <figcaption className="body-cjk px-3 py-3 text-[0.8rem] text-quill">
            {mediaCaptureCaption("/media/screens/main-menu.webp")}。從主選單進入教學、組牌與對戰。
          </figcaption>
        </figure>

        {/* 收藏與組牌規則速覽 */}
        <div className="mt-14 border-t border-rule pt-8">
          <h3 className="text-xl font-bold text-parchment font-serif">
            牌庫構築準則
          </h3>
          <dl className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {COLLECTION_FEATURES.map((feature) => (
              <div key={feature.label} className="plate p-4 border-l-2 border-l-brass-dim">
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
