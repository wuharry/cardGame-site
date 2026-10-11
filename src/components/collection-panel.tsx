import Image from "next/image";
import { COLLECTION_FEATURES, GAME_FACTS, SPOILS_RULES } from "@/data/game";
import { mediaUrl } from "@/data/media";

export function CollectionPanel() {
  return (
    <section id="collection" className="grain border-t border-rule-soft bg-ink">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">V — Your Collection</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            從收藏，組出自己的六十張
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            目前卡池有 {GAME_FACTS.cards} 種正式卡，另外有 {GAME_FACTS.tokens} 種衍生物或形態。
            先完成 150 次新手抽卡，再用持有卡自組六十張、保存並選用，就能進入單人練習。
          </p>
        </header>

        <figure className="mt-10 max-w-4xl border border-rule-soft bg-board p-1">
          <Image
            src={mediaUrl("/media/screens/main-menu.webp")}
            alt="暮色秘典 R3 首次啟動畫面：剩餘 150 次新手抽卡，完成後自組六十張牌組"
            width={1282}
            height={752}
            sizes="(max-width: 1024px) 100vw, 896px"
            className="h-auto w-full"
          />
          <figcaption className="body-cjk px-3 py-3 text-[0.78rem]">
            Windows R3 解壓包的實際新玩家畫面；先抽完新手卡，再自組並選用牌組。
          </figcaption>
        </figure>

        <dl className="mt-12 grid border-t border-rule md:grid-cols-2">
          {COLLECTION_FEATURES.map((feature) => (
            <div key={feature.label} className="border-b border-rule-soft py-6 md:pr-10">
              <dt className="hud-label">{feature.label}</dt>
              <dd className="mt-2 text-xl text-brass-hi" style={{ fontFamily: "var(--font-serif)" }}>
                {feature.value}
              </dd>
              <p className="body-cjk mt-3 max-w-md text-[0.88rem]">{feature.note}</p>
            </div>
          ))}
        </dl>

        <p className="body-cjk mt-8 max-w-3xl border-l border-brass-dim pl-4 text-[0.86rem]">
          玩家只使用自己的持有卡組牌，AI 預組不供選用。
          本機訪客收藏與雲端帳號收藏分開保存；線上版本、帳號與兩人連線實測另行驗收。
        </p>

        <div className="mt-14 border-t border-rule pt-10">
          <h3 className="text-2xl text-parchment" style={{ fontFamily: "var(--font-serif)" }}>
            正式 PvP 的一張戰利品
          </h3>
          <p className="body-cjk mt-4 max-w-3xl text-[0.9rem]">
            勝者從敗者本局的起始牌組挑一張，勝者增加一張、敗者實際失去一張。
            若敗者原牌組因此超過目前持有量，需調整後才能再對戰。
          </p>
          <dl className="mt-8 grid border-t border-rule-soft md:grid-cols-2">
            {SPOILS_RULES.map((rule) => (
              <div key={rule.label} className="border-b border-rule-soft py-6 md:pr-10">
                <dt className="hud-label">{rule.label}</dt>
                <dd className="mt-2 text-lg text-brass-hi" style={{ fontFamily: "var(--font-serif)" }}>{rule.value}</dd>
                <p className="body-cjk mt-3 max-w-md text-[0.88rem]">{rule.note}</p>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
