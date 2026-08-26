/**
 * 下載與版本紀錄。
 *
 * ▸ 要讓下載按鈕真的能按：把 RELEASE_BASE 填成實際存放檔案的網址
 *   （GitHub Releases / itch.io / 自架），並把該平台的 status 改成 "available"。
 *   RELEASE_BASE 是空字串時，所有平台一律顯示成「尚未發佈」，不會產生死連結。
 * ▸ 要新增平台：往 BUILDS 陣列加一筆就好，版面會自己長出來。
 */

export const RELEASE_BASE: string = "";

export type BuildStatus = "available" | "preparing" | "planned";

export interface Build {
  id: string;
  platform: string;
  en: string;
  status: BuildStatus;
  /** 檔名。與 RELEASE_BASE 組成下載網址。 */
  file: string | null;
  version: string | null;
  /** 檔案大小，人看的字串 */
  size: string | null;
  /** ISO 日期 */
  updated: string | null;
  requirement: string;
  note?: string;
}

export const BUILDS: Build[] = [
  {
    id: "android",
    platform: "Android",
    en: "APK",
    status: "preparing",
    file: "CardGameDemo-Android.apk",
    version: null,
    size: null,
    updated: null,
    requirement: "Android 7.0 以上 · arm64-v8a",
    note: "安裝時系統會擋一次，需在設定裡允許此來源安裝應用程式。",
  },
  {
    id: "windows",
    platform: "Windows",
    en: "Zip",
    status: "preparing",
    file: "CardGameDemo-Windows.zip",
    version: "v0.9.0-demo",
    size: "124 MB",
    updated: "2026-07-12",
    requirement: "Windows 10 以上 · 64 位元",
    note: "解壓後直接執行 CardGameDemo.exe，不需安裝。",
  },
  {
    id: "macos",
    platform: "macOS",
    en: "Zip",
    status: "planned",
    file: null,
    version: null,
    size: null,
    updated: null,
    requirement: "Apple Silicon · Intel",
  },
  {
    id: "linux",
    platform: "Linux",
    en: "Zip",
    status: "planned",
    file: null,
    version: null,
    size: null,
    updated: null,
    requirement: "x86_64",
  },
];

/** 只有 RELEASE_BASE 有值、狀態是 available、且有檔名，才算真的能下載。 */
export function downloadUrl(build: Build): string | null {
  if (build.status !== "available" || !build.file || !RELEASE_BASE) return null;
  return `${RELEASE_BASE.replace(/\/$/, "")}/${build.file}`;
}

/* ------------------------------------------------------------------ */

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

/** 由開發紀錄整理，最新的排前面。 */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "0.9.0",
    date: "2026-08-10",
    title: "卡池重新配平",
    changes: [
      "卡池擴到 92 張：60 張從者，加上秘術、瞬咒、靈裝、伏印。",
      "技能與關鍵字全面對齊新的配平表。",
      "訂正後排卡槽的規則：後排站得了從者，只是不當阻擋——但【貫穿】打得到。",
    ],
  },
  {
    version: "0.8.0",
    date: "2026-07-17",
    title: "伏印宿主制",
    changes: [
      "伏印改成埋在我方從者底下，一名從者一張，不再佔用卡槽。",
      "埋設後我方整排卡槽紅色警戒：對手知道有陷阱，不知道在誰底下。",
      "靈裝改成一次一件，新的蓋掉舊的，舊卡入墓。",
      "技能三分類（強化攻擊／獨立攻擊／非攻擊）補上卡面與指令選單的標示。",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-07-16",
    title: "墓地與丟牌回魔",
    changes: [
      "所有離場的牌統一入墓；牌堆旁多了一座墓地，看得到最後入土的那張。",
      "把手牌拖到墓地即可換取暫時魔力，Cost 除以二，隔回合冷卻。",
      "開房時自動向路由器申請 UDP 轉發，失敗會直接說明原因與備案。",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-07-15",
    title: "單人練習與景深",
    changes: [
      "新增單人練習模式，敵方 AI 走與連線相同的結算路徑。",
      "攝影機加上遠景景深，強化 HD-2D 的微縮感——手牌刻意留在對焦範圍內。",
      "對手手牌以卡背扇形呈現，並顯示張數。",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-07-14",
    title: "牌桌構圖改版",
    changes: [
      "鏡頭沿中線一眼看穿雙方陣線，改為歧路旅人式的斜視角。",
      "敵方卡槽改為鏡像：前排貼著中線，修正舊版「敵方前排反而更遠」的語意顛倒。",
      "手牌壓在畫面下緣只露卡頂，hover 時整張浮出。",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-07-12",
    title: "連線對戰可以打了",
    changes: [
      "host / client 連線對戰跑通，兩台的終局結算完全一致。",
      "客戶端視角翻轉，從自己那一側看桌。",
      "任一方掉線會收線並回到主選單。",
    ],
  },
];
