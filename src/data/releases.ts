/**
 * 下載成品與程式開發紀錄分開維護。
 * 公開附件的檔名、大小與檢查碼核對後才部署；各平台驗證範圍另載於版本說明。
 * RELEASE_BASE 可指向公開 GitHub Release 的 /releases/download/<tag>。
 */
export const RELEASE_BASE: string = "https://github.com/wuharry/twilight-codex-downloads/releases/download/v2026.10.13-r5";

export type BuildStatus = "available" | "preparing" | "planned";

export interface Build {
  id: string;
  platform: string;
  en: string;
  status: BuildStatus;
  file: string | null;
  version: string | null;
  size: string | null;
  /** 版本化 ZIP 的實際位元組數，用於核對附件。 */
  bytes?: number;
  updated: string | null;
  requirement: string;
  note?: string;
  /** 版本化 ZIP 的實際 SHA-256；未產生成品時不填假值。 */
  sha256?: string;
  /** 可讓單一平台更新，不把其他平台連到不存在的新附件。 */
  releaseBase?: string;
}

export const BUILDS: Build[] = [
  {
    id: "windows",
    platform: "Windows",
    en: "ZIP · 64-bit",
    status: "available",
    file: "TwilightCodex-Windows-20261013-Analytics.zip",
    releaseBase: "https://github.com/wuharry/twilight-codex-downloads/releases/download/v2026.10.13-analytics",
    version: "2026.10.13-R5-Analytics",
    size: "622.2 MiB",
    bytes: 652393310,
    updated: "2026-10-13",
    sha256: "b9125d909485bf4a58964f6afc2af45da8e4da00107590e79a194effcd78375b",
    requirement: "64 位元 Windows · 滑鼠與鍵盤",
    note: "解壓縮後執行 TwilightCodex.exe。新增匿名遊玩統計，可在設定關閉；不傳收藏或牌組。尚未在 Windows 原生系統實測啟動。",
  },
  {
    id: "macos",
    platform: "macOS",
    en: "ZIP · Universal",
    status: "available",
    file: "TwilightCodex-macOS-20261013-R5.zip",
    version: "2026.10.13-R5",
    size: "644.1 MiB",
    bytes: 675349629,
    updated: "2026-10-13",
    sha256: "70085c66199e32e119cbcc445290e718a6dfca60335cd4c666ca31baecf2927f",
    requirement: "Apple Silicon / Intel · 滑鼠與鍵盤",
    note: "此 R5 版尚無匿名遊玩統計。ad-hoc 簽章、尚未 Apple 公證，首次開啟方式見下方說明。",
  },
  {
    id: "linux",
    platform: "Linux",
    en: "Desktop",
    status: "planned",
    file: null,
    version: null,
    size: null,
    updated: null,
    requirement: "玩家版尚未提供",
  },
  {
    id: "android",
    platform: "Android",
    en: "APK",
    status: "planned",
    file: null,
    version: null,
    size: null,
    updated: null,
    requirement: "行動版尚未提供",
  },
];

/** 沒有實際 HTTPS 下載位置時不產生可點擊的連結。 */
export function downloadUrl(build: Build): string | null {
  if (build.status !== "available" || !build.file || !RELEASE_BASE) return null;
  try {
    const url = new URL(`${(build.releaseBase ?? RELEASE_BASE).replace(/\/+$/, "")}/${encodeURIComponent(build.file)}`);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** 版本頁沿用同一份 GitHub 附件資訊，不另外維護版本網址。 */
export function releasePageUrl(build: Build): string | null {
  const href = downloadUrl(build);
  if (!href) return null;
  const url = new URL(href);
  if (url.origin !== "https://github.com") return null;
  const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/releases\/download\/(.+)\/[^/]+$/);
  if (!match) return null;
  return `${url.origin}/${match[1]}/${match[2]}/releases/tag/${match[3]}`;
}

export function buildStatusText(build: Build): string {
  if (downloadUrl(build)) return "可下載";
  return build.status === "planned" ? "尚未提供" : "新版準備中";
}

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

/** 依目前程式與版本化驗收整理；歷史開發更新不代表另有可下載的執行檔。 */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "2026.10.13-R5",
    date: "2026-10-13",
    title: "Windows／macOS 同步，替身隱藏不洩漏",
    changes: [
      "Windows 與 macOS 試玩 ZIP 同步提供；macOS 同一份包支援 Intel 與 Apple Silicon。正式線上伺服器已更新為協定 16，舊 R5 包無法連線，雙方請一起下載本輪新包。",
      "112 張遊戲卡圖以冰霜女巫統一像素表現，並對照原 sprite 保留角色辨識。官網卡圖預覽同步更新，既有場景截圖保留原擷取版本。",
      "霧幕替身被擊破後，原宿主隱藏回位；擁有者看見半透明宿主，對手看不見。揭示／保留詢問、防守伏印提示與私密紀錄只給擁有者。",
      "先手改為隨機決定，後手取得一次性後援；自然抽牌時若空手則抽兩張。雙方可見的像素 3D 骰子與 PvP 回合倒數保留。",
      "遊戲內版本標籤沿用 2026.10.11-R5，請以下載檔名中的 20261013 識別新版。成品資源、封裝 ENet 與正式外網大廳測試通過；兩個正式帳號的真人完整對局仍待實測。",
    ],
  },
  {
    version: "2026.10.11-R5",
    date: "2026-10-11",
    title: "先組自己的六十張，選牌就看效果",
    changes: [
      "150 次免費新手抽卡可分批領取；保存並選用合法持有的六十張牌組即可對戰，每卡最多三張，不必抽完額度。一般卡包仍於新手額度歸零後開放。",
      "組牌畫面加入固定效果區，懸停、聚焦或選取即可閱讀完整卡牌效果。選取牌組卡牌先查看效果，另用「移除一張」或 Delete 移除。",
      "本機訪客可瀏覽正式大廳；需要登入時會顯示原因與電子郵件登入入口。登入、收藏同步、待確認抽卡與合法牌組分別提示，不用猜開房按鈕為何停用。",
      "擲骰改用六面像素風 3D 骰子，演出翻滾、彈跳與停穩，呈現原始與最終點數及最終六點爆擊；減少動態時直接顯示停穩結果。",
      "下載包收錄 109 張重繪卡圖，更新從者、種族與法術場景；網站既有卡圖與截圖仍標示原匯入版本。",
      "PvE 回合不限時；連線真人 PvP 每回合 100 秒，最後 15 秒倒數。逾時停止接受新操作，現有效果結算完成後自動結束回合；選擇視窗自開啟起有 20 秒，逾時採用預設選項。",
      "連線協定更新為 14，兩位玩家與伺服器都需使用相容版本。下載包與正式部署狀態以下載區為準。",
    ],
  },
  {
    version: "2026.10.11-R4",
    date: "2026-10-11",
    title: "雙人大廳：看見玩家，也看見房間",
    changes: [
      "線上大廳顯示目前連線玩家數，包含大廳與對戰中的玩家；同一玩家不重複計算。",
      "公開等待房會隨建立、加入與離開更新，列出房間名稱及 1／2、2／2 人數，滿房不能加入。",
      "建立房間後仍可看見其他公開房；先離開自己的房間，才能加入另一房。私人房只透過房碼加入，不出現在公開列表。",
      "優先完成兩人對戰流程，雙方準備完成才開局；本版未新增觀戰功能。",
      "連線協定更新為 13，請兩位玩家都更新 Windows 版，再連線至新版伺服器。",
    ],
  },
  {
    version: "2026.10.11-R3",
    date: "2026-10-11",
    title: "暮色秘典：種族結界與自己的六十張",
    changes: [
      "正式名稱更新為《暮色秘典 Twilight Codex》，卡池擴充為 244 種正式卡與 21 種衍生物或形態。",
      "加入第六種卡型「結界 / Domain」；每側最多一張，依種族與卡文持續支援戰場。",
      "R3 當時的新玩家需先完成 150 次新手抽卡，再用持有卡自組合法六十張並選用；此門檻已於 R5 移除，19 副內部預組仍只供 AI 使用。",
      "正式真人 PvP 正常勝出後可選敗者起始牌組一張，勝者 +1、敗者 −1；滿三張不可領，有待領戰利品需先處理。",
      "連線協定更新為 12；Windows ZIP 已公開下載並確認解壓啟動，線上版本與兩人實測另行驗收。",
    ],
  },
  {
    version: "開發更新",
    date: "2026-10-09",
    title: "四路戰場與戰鬥操作",
    changes: [
      "戰場改為四條路線，每側前後排各四格；普通攻擊可跨路指定敵方前排。",
      "同欄活前排保護後排；前排離場後，後排立即恢復可被攻擊。",
      "更新攻擊與生命圖示、種族標示、合法目標提示及召喚暈眩顯示。",
      "自然魔力上限維持十點，回收手牌取得的暫時魔力可以超過上限。",
    ],
  },
  {
    version: "開發更新",
    date: "2026-10-09",
    title: "收藏與自組牌組的基礎功能",
    changes: [
      "訪客練習收藏、卡牌篩選、費用曲線、牌組草稿與保存，支援每副六十張、同名最多三張。",
      "開包支援一包與批次揭曉；本機訪客進度與帳號收藏分開處理。",
      "此為當時的開發紀錄；現行新手抽卡、玩家組牌與卡池內容，以本頁最新版本說明為準。",
    ],
  },
  {
    version: "開發更新",
    date: "2026-10-08",
    title: "死靈卡池與試玩體驗",
    changes: [
      "擴充死靈流派，涵蓋復活、送墓、放逐與骨盾。",
      "提供遊戲內圖解教學、召喚物與效果說明、墓地及戰鬥紀錄。",
      "支援繁體中文與英文、音量與畫質設定、UI 比例及減少動態。",
    ],
  },
];
