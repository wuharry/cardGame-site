import { pageMetadata } from "@/data/seo";
import Link from "next/link";
import { BUILDS, downloadUrl } from "@/data/releases";

const androidAvailable = BUILDS.some((build) => build.id === "android" && downloadUrl(build));
export const metadata = pageMetadata("/install/android", "Android APK 安裝教學", androidAvailable
  ? "下載紙鴉牌 APK 後，從 Chrome 下載清單或 Downloads 開啟檔案，並依 Android 系統畫面安裝。"
  : "紙鴉牌 Android APK 目前暫停公開下載，等待 Samsung Galaxy S24 FE 實機驗收；查看目前的平台狀態。");

export default function AndroidInstallPage() {
  const android = BUILDS.find((build) => build.id === "android");
  const href = android ? downloadUrl(android) : null;

  if (!android || !href || !android.file) {
    const suspended = android?.status === "suspended";
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <Link href="/#download" className="text-brass-hi underline underline-offset-4">返回下載頁</Link>
        <h1 className="mt-8 text-3xl text-parchment">Android APK 安裝教學</h1>
        <p className="body-cjk mt-6">
          {suspended ? "Android APK 暫停下載，修正版發布前不提供安裝。" : "目前尚未提供可下載的 Android APK，請以官網下載頁的狀態為準。"}
        </p>
        <p className="body-cjk mt-3">Android 測試包正等待 Samsung Galaxy S24 FE 實機安裝、啟動與對戰驗收，完成前暫停公開下載。</p>
        {suspended && android.note && <p className="body-cjk mt-4 leading-7">{android.note}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
      <Link href="/#download-android" className="text-sm text-brass-hi underline underline-offset-4">返回官網下載</Link>
      <header className="mt-8">
        <p className="eyebrow">Android · APK</p>
        <h1 className="section-title mt-3 text-3xl sm:text-4xl">下載完成後，手動開啟 APK 安裝</h1>
        <p className="body-cjk mt-5 text-base leading-8">
          下載完成不一定會跳出安裝視窗。先到手機的下載清單開啟 APK，再由 Android 顯示安裝畫面。
          網站無法替你確認下載完成或自動安裝。
        </p>
      </header>

      <section aria-labelledby="current-apk" className="plate mt-8 p-5 sm:p-6">
        <h2 id="current-apk" className="text-lg text-parchment">目前提供的 APK</h2>
        <p className="mt-3 text-sm text-quill">{android.version} · {android.size} · Android 預覽版</p>
        <p className="body-cjk mt-2 text-sm">{android.requirement}</p>
        <p className="mt-3 break-all text-sm text-quill"><code>{android.file}</code></p>
        <a href={href} className="mt-5 block border border-brass bg-brass px-5 py-3 text-center text-lg text-ink hover:bg-brass-hi">
          下載 Android APK
        </a>
        <p className="body-cjk mt-3 text-sm">已下載同一份 APK 時，直接照下方步驟開啟，不必重新下載。</p>
      </section>

      <section aria-labelledby="installation-steps" className="mt-10">
        <h2 id="installation-steps" className="text-xl text-parchment">從下載完成到安裝</h2>
        <ol className="mt-5 space-y-5">
          <li className="border-l-2 border-brass-dim pl-4">
            <h3 className="text-lg text-parchment">1. 在下載清單確認已完成</h3>
            <p className="body-cjk mt-2 leading-7">開啟 Chrome 的「⋮ → 下載」。若網址列在底部，可向上滑動網址列找「下載」。仍在下載或已暫停時，先等它完成，不要重複按下載。</p>
          </li>
          <li className="border-l-2 border-brass-dim pl-4">
            <h3 className="text-lg text-parchment">2. 點選剛才下載的 APK</h3>
            <p className="body-cjk mt-2 leading-7">在 Chrome 下載清單點選 <code className="break-all">{android.file}</code>。也可以到手機「檔案」的 Downloads／下載資料夾開啟同一檔案；不需要解壓縮 APK。</p>
          </li>
          <li className="border-l-2 border-brass-dim pl-4">
            <h3 className="text-lg text-parchment">3. 依系統提示允許本次安裝來源</h3>
            <p className="body-cjk mt-2 leading-7">若系統詢問來源權限，確認檔案來自本官網，再按該畫面的「設定」，允許這次使用的 Chrome 或檔案管理員安裝應用程式。返回安裝畫面按「安裝」，完成後可關閉該來源權限。不同手機的按鈕名稱可能不同。</p>
          </li>
          <li className="border-l-2 border-brass-dim pl-4">
            <h3 className="text-lg text-parchment">4. 完成後從手機開啟遊戲</h3>
            <p className="body-cjk mt-2 leading-7">系統顯示安裝完成後，按「開啟」或到應用程式清單找到「{android.displayName ?? "紙鴉牌"}」。本版 Android 實機安裝、啟動與觸控仍未完成驗收，遇到問題請保留完整訊息。</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="installation-troubleshooting" className="mt-12 border-t border-rule-soft pt-8">
        <h2 id="installation-troubleshooting" className="text-xl text-parchment">卡在哪一步？</h2>
        <div className="mt-5 space-y-6">
          <div>
            <h3 className="text-lg text-parchment">只有下載完成，沒有安裝視窗</h3>
            <p className="body-cjk mt-2 leading-7">這時先照第 2 步手動開啟 APK。若點選後仍完全沒有反應，記下是從 Chrome 還是「檔案」開啟，以及手機型號與 Android 版本。</p>
          </div>
          <div>
            <h3 className="text-lg text-parchment">已看到安裝視窗，但顯示錯誤</h3>
            <p className="body-cjk mt-2 leading-7">「無法解析套件」、「應用程式未安裝」或不相容等訊息，需要另查原因。請保留完整錯誤、APK 檔名、手機型號與 Android 版本，並確認下載清單顯示完整下載。更新失敗時不要先解除安裝舊版，以免遺失本機資料。</p>
          </div>
          <div>
            <h3 className="text-lg text-parchment">Play 安全防護或裝置政策阻擋</h3>
            <p className="body-cjk mt-2 leading-7">先停止安裝並保留警告訊息。不要關閉 Play 安全防護、公司管理限制或其他防護，也不要改用來路不明的 APK。</p>
          </div>
        </div>
      </section>

      <details className="body-cjk mt-10 border-y border-rule-soft py-4">
        <summary className="cursor-pointer text-parchment">版本說明、驗收限制與校驗碼</summary>
        <p className="mt-4 leading-7">{android.note}</p>
        {android.sha256 && <p className="mt-4 break-all text-sm">SHA-256：<code>{android.sha256}</code></p>}
      </details>
      <p className="body-cjk mt-6 text-sm leading-7">
        找不到手機上的下載清單時，可參考{" "}
        <a href="https://support.google.com/chrome/answer/95759?co=GENIE.Platform%3DAndroid&hl=zh-Hant" className="text-brass-hi underline underline-offset-4">Google Chrome 官方下載說明</a>。
        APK 適用 Android，不能安裝在 iPhone。
      </p>
    </main>
  );
}
