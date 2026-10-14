import { BUILDS, buildStatusText, downloadUrl, releasePageUrl, type Build } from "@/data/releases";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return iso.replaceAll("-", ".");
}

/** 可下載的平台一起放在頂部，未提供的平台另列。 */
export function DownloadPanel() {
  const available = BUILDS.filter((build) => downloadUrl(build));
  const others = BUILDS.filter((build) => !downloadUrl(build));

  return (
    <section id="download" className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">I — Download</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            下載暮色秘典
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            Windows 與 macOS 都是 ZIP，完整解壓縮後直接執行。要和朋友連線，兩邊都要使用本頁提供的最新玩家包。
          </p>
        </header>

        <div className="mt-10 grid items-start gap-6 sm:grid-cols-2">
          {available.map((build) => <FeaturedBuild key={build.id} build={build} />)}
        </div>

        <div className="mt-10 border-y border-rule-soft py-2">
          {[
            {
              title: "下載後怎麼開始？",
              body: "整包解壓縮到資料夾再執行，不要在壓縮檔裡直接開。Windows 跑 TwilightCodex.exe，macOS 開「暮色秘典.app」。第一次進遊戲先點主選單的「新手教學」。",
            },
            {
              title: "macOS 說無法打開、來源不明？",
              body: "這個測試版是 ad-hoc 簽章，還沒送 Apple 公證，第一次開會被系統攔下。先雙擊一次讓它被擋掉，再到「系統設定 → 隱私權與安全性」往下找這個 app，按旁邊允許打開的按鈕。新版 macOS 用右鍵「打開」已經繞不過去了。",
            },
            {
              title: "Windows 顯示不明發行者？",
              body: "新程式還沒建立信譽就會跳這個警告，ZIP 也不會消除它。確認檔案來自本頁的下載連結即可；若防毒回報具體威脅，先停止執行並回報，不要關掉防毒。",
            },
            {
              title: "連不上朋友？",
              body: "先確認兩邊都已更新至本頁提供的最新玩家包。區網從「進階／區網」進入，兩台電腦要在同一個網路，房主要允許遊戲通過防火牆。",
            },
          ].map((item) => (
            <details key={item.title} className="border-b border-rule-soft py-4 last:border-0">
              <summary className="cursor-pointer text-sm text-parchment" style={{ fontFamily: "var(--font-serif)" }}>
                {item.title}
              </summary>
              <p className="body-cjk mt-3 max-w-3xl text-[0.86rem]">{item.body}</p>
            </details>
          ))}
        </div>

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
  const releaseHref = releasePageUrl(build);

  return (
    <div className="plate notch min-w-0">
      <div className="flex flex-col gap-6 border-b border-rule px-6 py-7">
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
            className="notch border border-brass bg-brass px-6 py-4 text-center text-ink transition-colors hover:bg-brass-hi"
          >
            <span
              className="block text-lg tracking-[0.2em] uppercase"
              style={{ fontFamily: "var(--font-hud)", fontWeight: 700 }}
            >
              下載 {build.platform} 版
            </span>
          </a>
        ) : (
          <div aria-disabled="true" className="notch border border-brass-dim px-6 py-4 text-center">
            <span
              className="block text-lg tracking-[0.2em] text-brass-dim uppercase"
              style={{ fontFamily: "var(--font-hud)", fontWeight: 700 }}
            >
              下載 {build.platform} 版
            </span>
            <span
              className="mt-1 block text-[0.72rem] tracking-[0.2em] text-faint uppercase"
              style={{ fontFamily: "var(--font-hud)" }}
            >
              {buildStatusText(build)}
            </span>
          </div>
        )}
      </div>

      {releaseHref && (
        <p className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem]">
          下載無反應？到{" "}
          <a href={releaseHref} className="text-brass-hi underline underline-offset-4 hover:text-parchment">
            GitHub 版本頁
          </a>
          {" "}的 Assets 選擇 <code className="break-all">{build.file}</code>，勿選 Source code。
        </p>
      )}

      <dl className="grid grid-cols-2">
        <Spec label="Version" value={build.version ?? "—"} />
        <Spec label="File size" value={build.size ?? "—"} />
        <Spec label="Updated" value={formatDate(build.updated)} />
        <Spec label="Status" value={buildStatusText(build)} />
      </dl>

      {build.note && (
        <p className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem]">
          {build.note}
        </p>
      )}
      {href && build.sha256 && (
        <p className="body-cjk break-all border-t border-rule px-6 py-4 text-[0.78rem]">
          SHA-256：<code>{build.sha256}</code>
        </p>
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
          className="border border-brass-dim px-3 py-1 text-[0.7rem] tracking-[0.16em] text-brass-hi uppercase transition-colors hover:border-brass"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          下載 {build.platform} 版
        </a>
      ) : (
        <span
          className="border border-rule px-3 py-1 text-[0.7rem] tracking-[0.16em] text-faint uppercase"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {buildStatusText(build)}
        </span>
      )}
      {href && (
        <p className="basis-full text-[0.78rem] text-quill">
          {build.version} · 更新於 {formatDate(build.updated)}
        </p>
      )}
      {build.note && <p className="body-cjk basis-full text-[0.82rem]">{build.note}</p>}
      {href && build.sha256 && (
        <p className="body-cjk min-w-0 basis-full break-all text-[0.72rem] text-faint">
          SHA-256：<code>{build.sha256}</code>
        </p>
      )}
    </li>
  );
}
