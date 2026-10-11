import Image from "next/image";
import { GAME_MODES, NETWORK_NOTES } from "@/data/game";
import { mediaUrl } from "@/data/media";

/**
 * Section 07 — 對戰模式。
 * 版面直接借遊戲主選單：暗底、置中的明體條目、上下髮絲線。
 * 連線的技術細節放在最後一條規格帶裡，用規格表的語氣，不做成技術行銷。
 */
export function GameModes() {
  return (
    <section
      id="modes"
      className="vignette relative overflow-hidden border-t border-rule-soft"
    >
      <Image
        src={mediaUrl("/media/screens/town.webp")}
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-45"
      />

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-20 md:py-28">
        <header className="text-center">
          <p className="eyebrow">VII — The Table</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            先練一局，再邀朋友對戰
          </h2>
        </header>

        <ul className="mt-12">
          {GAME_MODES.map((mode) => (
            <li key={mode.en} className="group">
              <span className="menu-rule block" />
              <div className="px-1 py-7">
                <p className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
                  <span
                    className="text-2xl tracking-[0.2em] text-parchment"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {mode.zh}
                  </span>
                  <span
                    className="text-[0.66rem] tracking-[0.28em] text-brass uppercase"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {mode.en}
                  </span>
                </p>
                <p className="body-cjk mx-auto mt-4 max-w-xl text-center text-[0.9rem]">
                  {mode.body}
                </p>
                <p className="hud-label mt-3 text-center">{mode.meta}</p>
              </div>
            </li>
          ))}
          <li>
            <span className="menu-rule block" />
          </li>
        </ul>

        {/* 連線規格：只列事實，不吹功能 */}
        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-rule-soft pt-6 sm:grid-cols-4">
          {NETWORK_NOTES.map((note) => (
            <div key={note.label}>
              <dt className="hud-label">{note.label}</dt>
              <dd
                className="mt-1 text-[0.82rem] text-quill"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {note.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="body-cjk mt-6 text-center text-[0.8rem]">
          區網開房不使用 UPnP。外網對戰由專用伺服器主持，
          玩家無需替家中路由器設定埠轉發。線上大廳的玩家數包含大廳與對戰中玩家，
          轉入戰鬥房時可能短暫變動；公開列表只顯示等待中的雙人房。
        </p>
      </div>
    </section>
  );
}
