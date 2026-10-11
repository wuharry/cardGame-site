/**
 * 下載成品與程式開發紀錄分開維護。
 * 本機驗收可先填成品資訊；公開附件實際可下載後才填 RELEASE_BASE 並開放下載。
 * RELEASE_BASE 可指向公開 GitHub Release 的 /releases/download/<tag>。
 */
export const RELEASE_BASE: string = "https://github.com/wuharry/twilight-codex-downloads/releases/download/v2026.10.11-r3";

export type BuildStatus = "available" | "preparing" | "planned";

export interface Build {
  id: string;
  platform: string;
  en: string;
  status: BuildStatus;
  file: string | null;
  version: string | null;
  size: string | null;
  updated: string | null;
  requirement: string;
  note?: string;
  /** 實際上傳 ZIP 的 SHA-256；未產生成品時不填假值。 */
  sha256?: string;
}

export const BUILDS: Build[] = [
  {
    id: "windows",
    platform: "Windows",
    en: "ZIP · 64-bit",
    status: "available",
    file: "TwilightCodex-Windows-20261011-local-1244.zip",
    version: "2026.10.11-R3",
    size: "583.3 MiB",
    updated: "2026-10-11",
    sha256: "b4807044b0e40b33b681c1e625270b0805e573b70e2e4189ca2d57da8803aa2f",
    requirement: "64 位元 Windows · 滑鼠與鍵盤",
    note: "Windows ZIP 已提供公開下載，本機解壓、啟動與單人前三回合操作已驗證。請完整解壓縮，再執行 TwilightCodex.exe，不需另外安裝 Godot。線上版本與兩人實測另行驗收。",
  },
  {
    id: "macos",
    platform: "macOS",
    en: "ZIP",
    status: "planned",
    file: null,
    version: null,
    size: null,
    updated: null,
    requirement: "Apple Silicon / Intel · 尚未提供驗證完成的下載包",
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
    const url = new URL(`${RELEASE_BASE.replace(/\/+$/, "")}/${encodeURIComponent(build.file)}`);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
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
    version: "2026.10.11-R3",
    date: "2026-10-11",
    title: "暮色秘典：種族結界與自己的六十張",
    changes: [
      "正式名稱更新為《暮色秘典 Twilight Codex》，卡池擴充為 244 種正式卡與 21 種衍生物或形態。",
      "加入第六種卡型「結界 / Domain」；每側最多一張，依種族與卡文持續支援戰場。",
      "新玩家先完成 150 次新手抽卡，再用持有卡自組合法六十張並選用；19 副內部預組只供 AI 對手使用。",
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
      "此為當時的開發紀錄；目前新手抽卡、玩家組牌與卡池內容，以 2026.10.11-R3 的規則為準。",
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
