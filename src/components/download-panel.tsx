import Link from "next/link";
import { BUILDS, buildStatusText, downloadUrl, websiteDownloadUrl, downloadMirrorPageUrl, releasePageUrl, type Build } from "@/data/releases";
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
  const paused = others.find((build) => build.status === "suspended");
  const firstMatch = available.some((build) => build.delivery === "streamed") ? {
    title: "第一次進遊戲怎麼開始？",
    body: "先選「新手教學」。完成後會拿到一副 60 張起始牌組，可以先玩單人對戰；之後再開免費卡包、調整自己的牌組。",
    bodyEn: "Start with the tutorial. Completing it gives you a 60-card starter deck for solo play. Open your free packs and customise your deck when you are ready.",
  } : FIRST_MATCH_HELP;

  return (
    <section id="download" aria-labelledby="download-title" className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">DOWNLOAD & PLAY</p>
          <h2 id="download-title" className="section-title mt-4 text-3xl sm:text-4xl">
            {available.length ? "選擇你的裝置，免費下載。" : paused ? buildStatusText(paused) : "版本準備中"}
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            {available.length ? "選好平台後，照下方步驟安裝。電腦版下載 ZIP，Android 下載 APK；和朋友玩時，記得兩邊都用最新版。"
              : "目前沒有可下載的平台。修正版完成驗收後，會逐平台恢復下載。"}
          </p>
          <p lang="en" className="body-cjk mt-3 text-sm">{available.length
            ? "Choose your platform and follow the steps below. Desktop downloads use ZIP; Android uses APK."
            : paused ? buildStatusText(paused, "en") : "No downloads are available yet. Check each platform's status below."}</p>
          {legacyVersions && <p className="body-cjk mt-4 text-sm">
            遊戲已更名為「{GAME_FACTS.nameZh} {GAME_FACTS.nameEn}」。目前提供的玩家包仍使用舊名稱：{legacyVersions}。下載檔名沿用 TwilightCodex；「{GAME_FACTS.nameZh}」會隨之後的玩家包更新。
          </p>}
          {available.length > 0 && (
            <nav aria-label="可下載的平台" className="mt-5 flex flex-wrap gap-2">
              {available.map((build) => (
                <a key={build.id} href={`#download-${build.id}`} className="border border-brass-dim px-3 py-2 text-sm text-brass-hi hover:border-brass">
                  選擇 {build.platform}
                </a>
              ))}
            </nav>
          )}
        </header>

        <div className="mt-10 grid items-start gap-6 md:grid-cols-2">
          {available.map((build) => <FeaturedBuild key={build.id} build={build} />)}
        </div>

        {available.length > 0 && <div className="mt-10 border-y border-rule-soft py-2">
          {[firstMatch, CONNECTION_HELP].map((item) => (
            <details key={item.title} className="border-b border-rule-soft py-4 last:border-0">
              <summary className="cursor-pointer text-sm text-parchment font-serif">
                {item.title}
              </summary>
              <p className="body-cjk mt-3 max-w-3xl text-[0.86rem]">{item.body}</p>
              {"bodyEn" in item && typeof item.bodyEn === "string" && <p lang="en" className="body-cjk mt-2 max-w-3xl text-[0.82rem]">{item.bodyEn}</p>}
            </details>
          ))}
        </div>}

        {others.length > 0 && <div className="mt-10">
          <h3 className="hud-label border-b border-rule-soft pb-3">
            {available.length ? "其他平台" : "各平台下載狀態"}
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
  const href = websiteDownloadUrl(build);
  const mirrorHref = downloadMirrorPageUrl(build);
  const releaseHref = releasePageUrl(build);
  const troubleshooting = installationHelp(build);
  const firstSteps: Record<string, { zh: string; en: string }> = {
    windows: { zh: "完整解壓縮 → TwilightCodex.exe", en: "Extract all → TwilightCodex.exe" },
    macos: { zh: `Finder 解壓縮 → ${build.displayName || "紙鴉牌"}.app`, en: `Unzip in Finder → ${build.displayName || "紙鴉牌"}.app` },
    linux: { zh: "解壓縮 → launch.sh", en: "Extract → launch.sh" },
    android: { zh: "開啟 APK → 依系統提示安裝", en: "Open the APK → follow Android install prompts" },
  };
  const firstStep = firstSteps[build.id];
  const contentSize = build.delivery === "streamed" && build.content && build.content.bytes > 0
    ? `${Math.round(build.content.bytes / 1_000_000)} MB` : null;

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
            download={build.file ?? undefined}
            className="notch border border-brass bg-brass px-6 py-4 text-center text-ink transition-colors hover:bg-brass-hi"
          >
            <span
              className="block text-lg tracking-[0.2em] uppercase font-hud font-bold"
            >
              {build.id === "android" ? "下載 Android APK" : `下載 ${build.platform} ZIP`}
            </span>
            <span lang="en" className="mt-1 block text-xs">{build.size} · Download from GitHub</span>
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

        {firstStep && (
          <div className="body-cjk text-sm leading-7">
            <p>{firstStep.zh}</p>
            <p lang="en" className="text-xs text-quill">{firstStep.en}</p>
          </div>
        )}
        {contentSize && (
          <div className="body-cjk border-t border-rule-soft pt-4 text-sm leading-7">
            <p className="text-parchment">首次另下載約 {contentSize} 的美術與音效。</p>
            <p lang="en" className="text-xs text-quill">First launch adds about {contentSize} of art and audio.</p>
            <p className="mt-2">開啟遊戲後按「開始」。下載時可以先看內建說明書；同一版素材下載完成後，下次不用重載。</p>
            <p lang="en" className="mt-2 text-xs text-quill">Press Start in the game. Read the built-in rulebook while it downloads; the same version stays cached for next time.</p>
          </div>
        )}
        {mirrorHref && (
          <div className="body-cjk text-sm leading-7">
            <a href={`${mirrorHref}#download`} target="_blank" rel="noopener noreferrer" className="text-brass-hi underline underline-offset-4 hover:text-parchment">
              下載太慢？試試 itch.io 備用頁 ↗
            </a>
            <p className="mt-2 text-xs">另開分頁後，選擇 {build.platform} 的 <code className="break-all">{build.file}</code>。安裝說明會留在這裡。</p>
            <p lang="en" className="mt-2 text-xs">Slow download? The itch.io backup page opens in a new tab. Choose the same {build.platform} ZIP.</p>
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

      {troubleshooting.length > 0 && (
        <details className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem]">
          <summary className="cursor-pointer text-parchment">無法開啟？ <span lang="en">· Help</span></summary>
          {troubleshooting.map((item) => (
            <div key={item.title} className="mt-4">
              <h3 className="text-parchment">{item.title}</h3>
              <p className="mt-2">{item.body}</p>
            </div>
          ))}
        </details>
      )}

      {releaseHref && (
        <details className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem]">
          <summary className="cursor-pointer text-brass-hi">查看 GitHub 版本頁與附件</summary>
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
        <Spec label="版本 · Version" value={build.version ?? "—"} />
        <Spec label={build.delivery === "streamed" ? (build.id === "android" ? "程式 APK · Game APK" : "程式 ZIP · Game ZIP") : "大小 · Size"} value={build.size ?? "—"} />
        <Spec label="更新 · Updated" value={formatDate(build.updated)} />
        <Spec label="狀態 · Status" value={buildStatusText(build)} />
      </dl>

      {(build.note || build.noteEn) && (
        <details className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem]">
          <summary className="cursor-pointer text-parchment">
            版本說明與驗收範圍 <span lang="en">· Release notes</span>
          </summary>
          <p className="mt-3 text-parchment font-serif">{GAME_FACTS.nameZh} · {GAME_FACTS.nameEn}</p>
          {build.note && <p lang="zh-Hant" className="mt-3">{build.note}</p>}
          {build.noteEn && <p lang="en" className="mt-3">{build.noteEn}</p>}
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
  const href = websiteDownloadUrl(build);
  const hotfix = build.status === "suspended" ? build.hotfix : undefined;

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
          <span lang="en" className="mt-1 block normal-case tracking-normal">{buildStatusText(build, "en")}</span>
        </button>
      )}
      {href && (
        <p className="basis-full text-[0.78rem] text-quill">
          {build.version} · 更新於 {formatDate(build.updated)}
        </p>
      )}
      {hotfix && <div className="body-cjk basis-full text-[0.82rem]">
        <p lang="zh-Hant">{hotfix.note}</p>
        <p lang="en" className="mt-2 text-[0.78rem]">{hotfix.noteEn}</p>
        <p className="mt-2 text-faint">公告 · <time dateTime={hotfix.since}>{formatDate(hotfix.since)}</time></p>
      </div>}
      {(build.note || build.noteEn) && <details className="body-cjk basis-full text-[0.82rem]">
        <summary className="cursor-pointer text-quill">歷史版本說明與驗收範圍 <span lang="en">· Historical release notes</span></summary>
        {build.note && <p lang="zh-Hant" className="mt-3">{build.note}</p>}
        {build.noteEn && <p lang="en" className="mt-2 text-[0.78rem]">{build.noteEn}</p>}
      </details>}
      {href && build.sha256 && (
        <p className="body-cjk min-w-0 basis-full break-all text-[0.72rem] text-faint">
          SHA-256：<code>{build.sha256}</code>
        </p>
      )}
    </li>
  );
}
