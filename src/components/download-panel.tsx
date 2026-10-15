import Link from "next/link";
import { BUILDS, buildStatusText, downloadUrl, releasePageUrl, type Build } from "@/data/releases";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return iso.replaceAll("-", ".");
}

/** 可下載的平台一起放在頂部，未提供的平台另列。 */
export function DownloadPanel() {
  const available = BUILDS.filter((build) => downloadUrl(build));
  const others = BUILDS.filter((build) => !downloadUrl(build));
  const help = available.flatMap((build) => installationHelp(build));

  return (
    <section id="download" className="border-t border-rule-soft bg-board">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="max-w-2xl">
          <p className="eyebrow">I — Download</p>
          <h2 className="section-title mt-4 text-3xl sm:text-4xl">
            下載暮色秘典
          </h2>
          <p className="body-cjk mt-5 text-[0.98rem]">
            選擇符合裝置的平台，依下方說明解壓縮或安裝。和朋友連線前，請各自更新至對應平台的最新玩家包；系統需求與實測範圍列在每份下載旁。
          </p>
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

        <div className="mt-10 grid items-start gap-6 sm:grid-cols-2">
          {available.map((build) => <FeaturedBuild key={build.id} build={build} />)}
        </div>

        <div className="mt-10 border-y border-rule-soft py-2">
          {[
            {
              title: "第一次進遊戲怎麼開始？",
              body: "先閱讀主選單的「新手教學」，再用持有卡建立並選用合法的 60 張牌組。新手免費抽卡可慢慢領，不必抽完才組牌或對戰。",
            },
            ...help,
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

function installationHelp(build: Build): { title: string; body: string }[] {
  switch (build.id) {
    case "windows":
      return [
        { title: "Windows ZIP 怎麼開啟？", body: "完整解壓縮到資料夾，再執行 TwilightCodex.exe，不要在壓縮檔裡直接開。若卡在開頭畫面，可用包內的 Start-Compatibility.cmd 改以相容模式啟動，並保留診斷日誌。" },
        { title: "Windows 顯示不明發行者？", body: "未簽署或尚未建立信譽的測試版可能顯示警告，ZIP 也不會消除它。請核對本頁下載來源與 SHA-256；若防毒回報具體威脅，先停止執行並回報，不要關掉防毒。" },
      ];
    case "macos":
      return [
        { title: "macOS ZIP 怎麼開啟？", body: "完整解壓縮後，開啟「暮色秘典.app」。請先確認下載旁的 macOS 版本需求，Intel 與 Apple Silicon 使用同一份 Universal 包。" },
        { title: "macOS 說無法打開、來源不明？", body: "目前測試版採 ad-hoc 簽章，尚未 Apple 公證。確認來源後，先嘗試開啟一次，再到「系統設定 → 隱私權與安全性」查看該 app 的「仍要打開」選項。若顯示可能損害電腦或檔案已損毀，請停止並回報完整訊息。" },
      ];
    case "linux":
      return [{ title: "Linux ZIP 怎麼開啟？", body: "需要 x86_64 處理器，適用 Ubuntu 24.04 或以上，或其他使用 glibc 2.39 或以上的 Linux 發行版。將 ZIP 完整解壓到自己的資料夾，保留執行檔與同包資源。若遊戲執行檔無法啟動，到檔案內容的權限頁允許「作為程式執行」；不同桌面的名稱可能不同。若仍無法開啟，從終端機執行並保留錯誤訊息。" }];
    case "android":
      return [{ title: "Android APK 怎麼安裝？", body: "本次支援基準為 Android 9 或以上及 arm64（64 位元 ARM）裝置。在裝置下載並開啟 APK，依系統提示允許此次使用的瀏覽器或檔案管理員安裝應用程式，安裝後可關閉該來源權限。更新請使用本頁同一套簽章的新版，保留既有資料。若裝置政策或 Play 安全防護阻擋，請保留完整訊息回報，不要關閉防護；APK 不能安裝在 iPhone。" }];
    default:
      return [];
  }
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
              {build.id === "android" ? "下載 Android APK" : `下載 ${build.platform} 版`}
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
        <button
          type="button"
          disabled
          className="border border-rule px-3 py-1 text-[0.7rem] tracking-[0.16em] text-faint uppercase"
          style={{ fontFamily: "var(--font-hud)" }}
        >
          {build.id === "android" ? "下載 Android APK · " : ""}{buildStatusText(build)}
        </button>
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
