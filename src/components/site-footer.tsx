import Link from "next/link";

/** 掛名與技術事實。CC-BY 的素材必須署名，這裡是它該待的地方。 */
const CREDITS = [
  { label: "Engine", value: "Godot 4.5 · GDScript · Forward+" },
  { label: "Type", value: "Noto Serif TC · Cinzel · Barlow" },
  { label: "Icons", value: "Icons by Andrey Kalyuzhnyy (CC BY 4.0)" },
  { label: "Characters", value: "Tiny RPG Character Asset Pack" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-6 border-b border-rule-soft pb-8">
          <p className="flex items-baseline gap-3">
            <span
              className="text-lg tracking-[0.2em] text-parchment"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              卡牌對決
            </span>
            <span
              className="text-[0.62rem] tracking-[0.3em] text-faint uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              CardGame Demo
            </span>
          </p>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { href: "#lanes", label: "路線" },
              { href: "#cards", label: "卡型" },
              { href: "#systems", label: "規則" },
              { href: "#modes", label: "模式" },
              { href: "#download", label: "下載" },
              { href: "#changelog", label: "更新紀錄" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[0.82rem] text-quill transition-colors hover:text-brass-hi"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <dl className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDITS.map((credit) => (
            <div key={credit.label}>
              <dt className="hud-label">{credit.label}</dt>
              <dd
                className="mt-1 text-[0.8rem] text-quill"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {credit.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 text-[0.75rem] text-faint">
          個人開發專案。網站上的畫面全部擷取自實際執行的遊戲。
        </p>
      </div>
    </footer>
  );
}
