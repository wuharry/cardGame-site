import Link from "next/link";
import { BUILDS, buildStatusText, downloadUrl, releasePageUrl, type Build } from "@/data/releases";
import { GAME_FACTS } from "@/data/game";
import { CONNECTION_HELP, FIRST_MATCH_HELP, installationHelp } from "@/data/install-help";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return iso.replaceAll("-", ".");
}

/** 可下載的平台一起放在頂部，未提供的平台另列。 */
export function DownloadPanel() {
  const available = BUILDS.filter((build) => downloadUrl(build));
  const legacyVersions = [...new Set(available
    .filter((build) => build.displayName && build.displayName !== GAME_FACTS.nameZh)
    .map((build) => `${build.version}（${build.displayName}）`))].join("、");
  const others = BUILDS.filter((build) => !downloadUrl(build));
  const help = available.flatMap((build) => installationHelp(build));

  return (
    <section id="download" className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">YOUR NEXT MATCH STARTS HERE</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            選好平台，準備開戰。
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            選擇符合裝置的平台，依下方說明解壓縮或安裝。和朋友連線前，請各自更新至對應平台的最新玩家包；系統需求與實測範圍列在每份下載旁。
          </p>
          {legacyVersions && <p className="body-cjk mt-4 text-sm">
            遊戲已更名為「{GAME_FACTS.nameZh} {GAME_FACTS.nameEn}」。目前提供的玩家包仍使用舊名稱：{legacyVersions}。下載檔名沿用 TwilightCodex；「{GAME_FACTS.nameZh}」會隨之後的玩家包更新。
          </p>}
          {available.length > 0 && (
            <nav aria-label="可下載的平台" className="mt-5 flex flex-wrap gap-2">
              {available.map((build) => (
                <a key={build.id} href={`#download-${build.id}`} className="border border-brass-dim px-3 py-2 text-sm text-brass-hi hover:border-brass">
                  {build.platform}
                </a>
              ))}
            </nav>
          )}
        </header>

        <div className="mt-10 grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {available.map((build) => <FeaturedBuild key={build.id} build={build} />)}
        </div>

        <div className="mt-10 border-y border-rule-soft py-2">
          {[FIRST_MATCH_HELP, ...help, CONNECTION_HELP].map((item) => (
            <details key={item.title} className="border-b border-rule-soft py-4 last:border-0">
              <summary className="cursor-pointer text-sm text-parchment font-serif">
                {item.title}
              </summary>
              <p className="body-cjk mt-3 max-w-3xl text-[0.86rem]">{item.body}</p>
            </details>
          ))}
        </div>

        {others.length > 0 && <div className="mt-10">
          <h3 className="hud-label border-b border-rule-soft pb-3">
            其他平台
          </h3>
          <ul>
            {others.map((build) => (
              <BuildRow key={build.id} build={build} />
            ))}
          </ul>
        </div>}
      </div>
    </section>
  );
}

function FeaturedBuild({ build }: { build: Build }) {
  const href = downloadUrl(build);
  const releaseHref = releasePageUrl(build);

  return (
    <div id={`download-${build.id}`} className="plate notch min-w-0 scroll-mt-24">
      <div className="flex flex-col gap-6 border-b border-rule px-6 py-7">
        <div>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className="text-3xl tracking-[0.06em] text-parchment sm:text-4xl font-display"
            >
              {build.platform}
            </span>
            <span className="hud-label">{build.en}</span>
          </p>
          <p
            className="mt-2 text-[0.86rem] text-quill font-serif"
          >
            {build.requirement}
          </p>
        </div>

        {href ? (
          <a
            href={href}
            className="notch border border-brass bg-brass px-6 py-4 text-center text-ink transition-colors hover:bg-brass-hi"
          >
            <span
              className="block text-lg tracking-[0.2em] uppercase font-hud font-bold"
            >
              {build.id === "android" ? "下載 Android APK" : `下載 ${build.platform} 版`}
            </span>
          </a>
        ) : (
          <div aria-disabled="true" className="notch border border-brass-dim px-6 py-4 text-center">
            <span
              className="block text-lg tracking-[0.2em] text-brass-dim uppercase font-hud font-bold"
            >
              下載 {build.platform} 版
            </span>
            <span
              className="mt-1 block text-[0.72rem] tracking-[0.2em] text-faint uppercase font-hud"
            >
              {buildStatusText(build)}
            </span>
          </div>
        )}

        {href && build.id === "android" && (
          <div className="space-y-3">
            <Link
              href="/install/android"
              className="block border border-brass-dim px-5 py-3 text-center text-base text-brass-hi transition-colors hover:border-brass hover:text-parchment"
            >
              已下載？查看安裝教學
            </Link>
            <p className="body-cjk text-sm leading-7">
              下載完成後，開啟 Chrome「下載」或「檔案 → Downloads」，點選
              <code className="break-all">{build.file}</code>，再依系統畫面安裝。沒有跳出安裝視窗時，請先手動開啟這個 APK。
            </p>
          </div>
        )}
      </div>

      {releaseHref && (
        <details className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem]">
          <summary className="cursor-pointer text-brass-hi">下載沒開始？查看備用入口</summary>
          <p className="mt-3">
            到{" "}
            <a href={releaseHref} className="text-brass-hi underline underline-offset-4 hover:text-parchment">
              GitHub 版本頁
            </a>
            {" "}的 Assets 選擇 <code className="break-all">{build.file}</code>，勿選 Source code。
          </p>
        </details>
      )}

      <dl className="grid grid-cols-2">
        <Spec label="Version" value={build.version ?? "—"} />
        <Spec label="File size" value={build.size ?? "—"} />
        <Spec label="Updated" value={formatDate(build.updated)} />
        <Spec label="Status" value={buildStatusText(build)} />
      </dl>

      {build.note && (
        <details className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem]">
          <summary className="cursor-pointer text-parchment">版本說明與驗收範圍</summary>
          <p className="mt-3">{build.note}</p>
        </details>
      )}
      {href && build.sha256 && (
        <details className="body-cjk border-t border-rule px-6 py-4 text-[0.78rem]">
          <summary className="cursor-pointer text-parchment">檔案校驗碼（SHA-256）</summary>
          <p className="mt-3 break-all"><code>{build.sha256}</code></p>
        </details>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-rule px-6 py-4 odd:border-r">
      <dt className="hud-label">{label}</dt>
      <dd className="hud-value mt-1 text-base">{value}</dd>
    </div>
  );
}

function BuildRow({ build }: { build: Build }) {
  const href = downloadUrl(build);

  return (
    <li id={`download-${build.id}`} className="flex scroll-mt-24 flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-rule-soft py-4">
      <span
        className="w-24 text-base text-parchment font-display"
      >
        {build.platform}
      </span>
      <span
        className="text-[0.82rem] text-quill font-serif"
      >
        {build.requirement}
      </span>
      <span className="hud-value ml-auto text-sm">
        {href ? (build.size ?? "—") : "—"}
      </span>
      {href ? (
        <a
          href={href}
          className="border border-brass-dim px-3 py-1 text-[0.7rem] tracking-[0.16em] text-brass-hi uppercase transition-colors hover:border-brass font-hud"
        >
          下載 {build.platform} 版
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="border border-rule px-3 py-1 text-[0.7rem] tracking-[0.16em] text-faint uppercase font-hud"
        >
          {build.id === "android" ? "下載 Android APK · " : ""}{buildStatusText(build)}
        </button>
      )}
      {href && (
        <p className="basis-full text-[0.78rem] text-quill">
          {build.version} · 更新於 {formatDate(build.updated)}
        </p>
      )}
      {build.id === "android" && !href ? (
        <>
          <p className="body-cjk basis-full text-[0.82rem]">
            Android 測試包等待 Samsung Galaxy S24 FE 實機安裝、啟動與對戰驗收，完成前暫不提供公開下載。
          </p>
          {build.status === "suspended" && build.note && <p className="body-cjk basis-full text-[0.82rem]">{build.note}</p>}
        </>
      ) : build.note && <p className="body-cjk basis-full text-[0.82rem]">{build.note}</p>}
      {href && build.sha256 && (
        <p className="body-cjk min-w-0 basis-full break-all text-[0.72rem] text-faint">
          SHA-256：<code>{build.sha256}</code>
        </p>
      )}
    </li>
  );
}
