import type { Build } from "./releases";

/** 下載區「常見問題」的一則說明。 */
export interface HelpItem {
  title: string;
  body: string;
}

export const FIRST_MATCH_HELP: HelpItem = {
  title: "第一次進遊戲怎麼開始？",
  body: "先閱讀主選單的「新手教學」，再用持有卡建立並選用合法的 60 張牌組。新手免費抽卡可慢慢領，不必抽完才組牌或對戰。",
};

export const CONNECTION_HELP: HelpItem = {
  title: "連不上朋友？",
  body: "先確認兩邊都已更新至本頁提供的最新玩家包。區網從「進階／區網」進入，兩台電腦要在同一個網路，房主要允許遊戲通過防火牆。",
};

/** 改名為 Deckmarch 之前的玩家包，macOS 的 .app 仍是舊檔名。 */
const FIRST_DECKMARCH_BUILD = 2026101501;

function usesLegacyBrand(build: Build): boolean {
  return build.build !== undefined && build.build < FIRST_DECKMARCH_BUILD;
}

/** 各平台開啟與安裝時最常卡住的步驟。 */
export function installationHelp(build: Build): HelpItem[] {
  switch (build.id) {
    case "windows":
      return [
        { title: "Windows ZIP 怎麼開啟？", body: "完整解壓縮到資料夾，再執行 TwilightCodex.exe，不要在壓縮檔裡直接開。若卡在開頭畫面，可用包內的 Start-Compatibility.cmd 改以相容模式啟動，並保留診斷日誌。" },
        { title: "Windows 顯示不明發行者？", body: "未簽署或尚未建立信譽的測試版可能顯示警告，ZIP 也不會消除它。請核對本頁下載來源與 SHA-256；若防毒回報具體威脅，先停止執行並回報，不要關掉防毒。" },
      ];
    case "macos":
      return [
        { title: "macOS ZIP 怎麼開啟？", body: `完整解壓縮後，開啟包內的 .app${usesLegacyBrand(build) ? "（舊版檔名為「暮色秘典.app」）" : ""}。請先確認下載旁的 macOS 版本需求，Intel 與 Apple Silicon 使用同一份 Universal 包。` },
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
