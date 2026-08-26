import Image from "next/image";
import { ARENAS, ROSTER } from "@/data/game";

/**
 * 戰場與陣容。
 * 這一段刻意不做版面——三張滿版遊戲截圖並排，讓畫面自己說話。
 * 圖是真的遊戲畫面，不是示意圖。
 */
export function ArenaBand() {
  return (
    <section className="border-t border-rule-soft bg-ink">
      <div className="mx-auto max-w-6xl px-5 pt-20 md:pt-28">
        <p className="eyebrow">V — The Ground</p>
        <h2 className="section-title mt-4 max-w-2xl text-3xl sm:text-4xl">
          每一局的戰場都是抽出來的
        </h2>
        <p className="body-cjk mt-5 max-w-2xl text-[0.98rem]">
          地形與植被在進場時才程序生成，所以同一張戰場不會長得一樣。
          3D 場景配像素立牌——單位是像素的，光線與景深是 3D 的。
        </p>
      </div>

      {/* 滿版：讓圖跨出容器，打斷整站的欄寬節奏 */}
      <div className="mt-12 grid gap-px bg-rule-soft md:mt-16 md:grid-cols-3">
        {ARENAS.map((arena) => (
          <figure key={arena.en} className="relative bg-ink">
            <div className="relative aspect-[16/10] md:aspect-[4/3]">
              <Image
                src={arena.image}
                alt={`${arena.zh}戰場的遊戲畫面`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 bg-ink/85 px-4 py-3">
              <p className="flex items-baseline gap-2.5">
                <span
                  className="text-lg text-parchment"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {arena.zh}
                </span>
                <span
                  className="text-[0.6rem] tracking-[0.26em] text-brass uppercase"
                  style={{ fontFamily: "var(--font-display)" }}
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
            className="text-lg text-parchment"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            站在上面的人
          </h3>
          <p className="hud-label">92 cards · 60 minions</p>
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {ROSTER.map((unit) => (
            <li key={unit.art}>
              <div
                className="relative aspect-[295/207] overflow-hidden border border-rule"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <Image
                  src={unit.art}
                  alt={`${unit.name}的卡圖`}
                  fill
                  sizes="(max-width: 640px) 30vw, 160px"
                  className="object-cover"
                />
              </div>
              <p
                className="mt-1.5 truncate text-[0.72rem] text-quill"
                style={{ fontFamily: "var(--font-serif)" }}
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
