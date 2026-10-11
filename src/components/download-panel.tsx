import { BUILDS, buildStatusText, downloadUrl, releasePageUrl, type Build } from "@/data/releases";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return iso.replaceAll("-", ".");
}

/**
 * Windows 是主要平台，做成一塊有份量的金屬牌；其餘平台排成一列規格，
 * 之後多一個平台就是 BUILDS 多一筆，版面自己長出來。
 */
export function DownloadPanel() {
  const [featured, ...others] = BUILDS;

  return (
    <section id="download" className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">VIII — Download</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            下載暮色秘典
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            Windows 版以 ZIP 提供，下載後解壓即可執行。
            先完成 150 次新手抽卡，以持有卡組好並選用六十張牌組，就能進入單人 AI 練習。
            區網對戰需雙方使用相容版本；線上版本與兩人實測另行驗收。
          </p>
        </header>

        <FeaturedBuild build={featured} />

        <div className="mt-10 border-y border-rule-soft py-2">
          {[
            {
              title: "下載後怎麼開始？",
              body: "將整個 ZIP 解壓縮到資料夾，再執行 TwilightCodex.exe。請保留包內其他檔案，不要直接在壓縮檔裡啟動。新玩家先完成 150 次新手抽卡，再組成合法的六十張持有牌組、保存並選用，接著進入單人遊戲。",
            },
            {
              title: "Windows 顯示不明發行者怎麼辦？",
              body: "新發佈或尚未建立信譽的程式可能被 Windows 顯示警告，ZIP 也不會消除這種提示。請先確認檔案來自本頁的下載連結；若系統回報具體威脅，先停止執行並回報，無須關閉防毒保護。",
            },
            {
              title: "下載完成卻打不開，或連不上朋友？",
              body: "請記下下載版本、Windows 版本和錯誤畫面。啟動問題與連線問題分開處理：區網需在同一網路並允許遊戲通過防火牆；外網則需要相容版本的伺服器服務。",
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
            className="notch shrink-0 border border-brass bg-brass px-10 py-5 text-center text-ink transition-colors hover:bg-brass-hi"
          >
            <span
              className="block text-lg tracking-[0.2em] uppercase"
              style={{ fontFamily: "var(--font-hud)", fontWeight: 700 }}
            >
              下載 {build.platform} 版
            </span>
          </a>
        ) : (
          <div aria-disabled="true" className="notch shrink-0 border border-brass-dim px-10 py-5 text-center">
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
        <p className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem] md:px-10">
          下載無反應？到{" "}
          <a href={releaseHref} className="text-brass-hi underline underline-offset-4 hover:text-parchment">
            GitHub 版本頁
          </a>
          {" "}的 Assets 選擇 <code className="break-all">{build.file}</code>，勿選 Source code。
          此入口仍使用相同 GitHub 附件來源，無法繞過附件網域封鎖。
        </p>
      )}

      <dl className="grid grid-cols-2 md:grid-cols-4">
        <Spec label="Version" value={build.version ?? "—"} />
        <Spec label="File size" value={build.size ?? "—"} />
        <Spec label="Updated" value={formatDate(build.updated)} />
        <Spec label="Status" value={buildStatusText(build)} />
      </dl>

      {build.note && (
        <p className="body-cjk border-t border-rule px-6 py-4 text-[0.82rem] md:px-10">
          {build.note}
        </p>
      )}
      {href && build.sha256 && (
        <p className="body-cjk break-all border-t border-rule px-6 py-4 text-[0.78rem] md:px-10">
          SHA-256：<code>{build.sha256}</code>
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
          {buildStatusText(build)}
        </span>
      )}
    </li>
  );
}
