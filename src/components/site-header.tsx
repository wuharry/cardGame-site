import Link from "next/link";

const NAV = [
  { href: "#flow", zh: "流程", en: "Flow" },
  { href: "#lanes", zh: "路線", en: "Lanes" },
  { href: "#cards", zh: "卡型", en: "Cards" },
  { href: "#systems", zh: "規則", en: "Rules" },
  { href: "#collection", zh: "奪卡與組牌", en: "Spoils" },
  { href: "#modes", zh: "模式", en: "Modes" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule-soft bg-ink/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="group flex items-baseline gap-3">
          <span
            className="text-lg font-bold tracking-[0.22em] text-parchment transition-colors group-hover:text-brass-hi"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            暮色秘典
          </span>
          <span
            className="hidden text-[0.62rem] tracking-[0.3em] text-faint uppercase sm:inline"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Twilight Codex
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-quill transition-colors hover:text-brass-hi"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {item.zh}
            </Link>
          ))}
        </nav>

        <Link
          href="#download"
          className="ml-auto border border-brass-dim bg-brass-dim/20 px-4 py-2 text-brass-hi transition-colors hover:border-brass hover:bg-brass-dim/40 md:ml-0"
          style={{ fontFamily: "var(--font-hud)", letterSpacing: "0.14em" }}
        >
          <span className="text-xs font-semibold uppercase">Download</span>
        </Link>
      </div>
    </header>
  );
}
