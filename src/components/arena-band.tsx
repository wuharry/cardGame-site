import Image from "next/image";
import { ARENAS, GAME_FACTS, ROSTER } from "@/data/game";
import { mediaUrl } from "@/data/media";

/**
 * 戰場與陣容。
 * 這一段刻意不做版面——三張滿版遊戲截圖並排，讓畫面自己說話。
 * 圖是真的遊戲畫面，不是示意圖。
 */
export function ArenaBand() {
  return (
    <section className="border-t border-rule-soft bg-ink">
      <div className="mx-auto max-w-6xl px-5 pt-20 md:pt-28">
        <p className="eyebrow">VI — The Ground</p>
        <h2 className="section-title mt-4 max-w-2xl text-3xl sm:text-4xl">
          每一局的戰場都是抽出來的
        </h2>
        <p className="body-cjk mt-5 max-w-2xl text-[0.98rem]">
          對局會從森林、洞窟與冰原抽選戰場。
          像素角色站在立體地形上，搭配河流、霧氣、燈光與各場景的環境效果。
        </p>
      </div>

      <p className="body-cjk mx-auto mt-5 max-w-6xl px-5 text-[0.78rem]">
        三個戰場均為遊戲原生展示配置；不同平台與畫質設定的效果可能不同。
      </p>

      {/* 滿版：讓圖跨出容器，打斷整站的欄寬節奏 */}
      <div className="mt-12 grid gap-px bg-rule-soft md:mt-16 md:grid-cols-3">
        {ARENAS.map((arena) => (
          <figure key={arena.en} className="relative bg-ink">
            <div className="relative aspect-[16/10] md:aspect-[4/3]">
              <Image
                src={mediaUrl(arena.image)}
                alt={`${arena.zh}戰場的遊戲畫面`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 bg-ink/85 px-4 py-3">
              <p className="flex items-baseline gap-2.5">
                <span
                  className="text-lg text-parchment font-serif"
                >
                  {arena.zh}
                </span>
                <span
                  className="text-[0.6rem] tracking-[0.26em] text-brass uppercase font-display"
                >
                  {arena.en}
                </span>
              </p>
              <p className="body-cjk mt-1 text-[0.8rem] leading-snug">{arena.note}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* 陣容：卡池裡真的存在的角色，不是裝飾圖 */}
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule-soft pb-4">
          <h3
            className="text-lg text-parchment font-serif"
          >
            站在上面的人
          </h3>
          <p className="hud-label">{GAME_FACTS.cards} cards · {GAME_FACTS.tokens} tokens</p>
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {ROSTER.map((unit) => (
            <li key={unit.art}>
              <div
                className="relative aspect-[295/207] overflow-hidden border border-rule"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <Image
                  src={mediaUrl(unit.art)}
                  alt={`${unit.name}的卡圖`}
                  fill
                  sizes="(max-width: 640px) 30vw, 160px"
                  className="object-cover"
                />
              </div>
              <p
                className="mt-1.5 truncate text-[0.72rem] text-quill font-serif"
              >
                {unit.name}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
