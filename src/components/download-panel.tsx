import { BUILDS, downloadUrl, type Build } from "@/data/releases";

const STATUS_TEXT: Record<Build["status"], string> = {
  available: "可下載",
  preparing: "建置中",
  planned: "規劃中",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return iso.replaceAll("-", ".");
}

/**
 * Section 07 — 下載。
 * Android 是主要平台，做成一塊有份量的金屬牌；其餘平台排成一列規格，
 * 之後多一個平台就是 BUILDS 多一筆，版面自己長出來。
 */
export function DownloadPanel() {
  const [featured, ...others] = BUILDS;

  return (
    <section id="download" className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">VII — Download</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            下載卡牌對決
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            單機就能玩完整的一局：單人練習與熱座雙人不需要連線。
            要跟朋友對打，兩邊裝同一個版本再開房就行。
          </p>
        </header>

        <FeaturedBuild build={featured} />

        <div className="mt-10">
          <h3 className="hud-label border-b border-rule-soft pb-3">
            Other platforms
          </h3>
          <ul>
            {others.map((build) => (
              <BuildRow key={build.id} build={build} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FeaturedBuild({ build }: { build: Build }) {
  const href = downloadUrl(build);

  return (
    <div className="plate notch mt-12 md:mt-14">
      <div className="flex flex-col gap-8 border-b border-rule px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
        <div>
          <p className="flex items-baseline gap-3">
            <span
              className="text-3xl tracking-[0.06em] text-parchment sm:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {build.platform}
            </span>
            <span className="hud-label">{build.en}</span>
          </p>
          <p
            className="mt-2 text-[0.86rem] text-quill"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {build.requirement}
          </p>
        </div>

        {href ? (
          <a
            href={href}
            download
            className="notch shrink-0 border border-brass bg-brass px-10 py-5 text-center text-ink transition-colors hover:bg-brass-hi"
          >
            <span
              className="block text-lg tracking-[0.2em] uppercase"
              style={{ fontFamily: "var(--font-hud)", fontWeight: 700 }}
            >
              Download APK
            </span>
          </a>
        ) : (
          <div className="notch shrink-0 border border-brass-dim px-10 py-5 text-center">
            <span
              className="block text-lg tracking-[0.2em] text-brass-dim uppercase"
              style={{ fontFamily: "var(--font-hud)", fontWeight: 700 }}
            >
              Download APK
            </span>
            <span
              className="mt-1 block text-[0.72rem] tracking-[0.2em] text-faint uppercase"
              style={{ fontFamily: "var(--font-hud)" }}
            >
              {STATUS_TEXT[build.status]}
            </span>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4">
        <Spec label="Version" value={build.version ?? "—"} />
        <Spec label="File size" value={build.size ?? "—"} />
        <Spec label="Updated" value={formatDate(build.updated)} />
        <Spec label="Status" value={STATUS_TEXT[build.status]} />
      </dl>

      {build.note && (
        <p className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem] md:px-10">
          {build.note}
        </p>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-rule px-6 py-4 md:border-l md:px-10 md:first:border-l-0">
      <dt className="hud-label">{label}</dt>
      <dd className="hud-value mt-1 text-base">{value}</dd>
    </div>
  );
}

function BuildRow({ build }: { build: Build }) {
  const href = downloadUrl(build);

  return (
    <li className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-rule-soft py-4">
      <span
        className="w-24 text-base text-parchment"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {build.platform}
      </span>
      <span
        className="text-[0.82rem] text-quill"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {build.requirement}
      </span>
      <span className="hud-value ml-auto text-sm">
        {build.size ?? "—"}
      </span>
      {href ? (
        <a
          href={href}
          download
          className="border border-brass-dim px-3 py-1 text-[0.7rem] tracking-[0.16em] text-brass-hi uppercase transition-colors hover:border-brass"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          Download
        </a>
      ) : (
        <span
          className="border border-rule px-3 py-1 text-[0.7rem] tracking-[0.16em] text-faint uppercase"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {STATUS_TEXT[build.status]}
        </span>
      )}
    </li>
  );
}
