/**
 * 下載成品與程式開發紀錄分開維護。
 * 公開附件的檔名、大小與檢查碼核對後才部署；各平台驗證範圍另載於版本說明。
 * RELEASE_BASE 可指向公開 GitHub Release 的 /releases/download/<tag>。
 */
export const RELEASE_BASE: string = "https://github.com/wuharry/twilight-codex-downloads/releases/download/v2026.10.15-r11";

/** suspended：附件仍在，但已知嚴重問題，官網與版本 API 暫停提供下載。 */
export type BuildStatus = "available" | "suspended" | "preparing" | "planned";

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
  /** Monotonic client build and minimum build permitted for official online play. */
  build?: number;
  minimumBuild?: number;
  protocol?: number;
  noteEn?: string;
  /** 可讓單一平台更新，不把其他平台連到不存在的新附件。 */
  releaseBase?: string;
}

export const BUILDS: Build[] = [
  {
    id: "windows",
    platform: "Windows",
    en: "ZIP · x86_64",
    status: "available",
    file: "TwilightCodex-Windows-20261015-R11.zip",
    version: "2026.10.15-R11",
    size: "437.7 MiB",
    bytes: 458919739,
    updated: "2026-10-15",
    sha256: "7239886523ada276a910ae8940a2bcfd826200bf6183a82584c2139f17da80a8",
    build: 2026101502,
    minimumBuild: 2026101502,
    protocol: 16,
    requirement: "Windows 10／11 · x86_64 · 滑鼠與鍵盤",
    note: "王牌戰線 Deckmarch R11；更新原創像素傷害浮字，補齊洞窟與冰原漏打包的六張法線貼圖，修正技能費用說明。五項明確遠程從者技能不受目標反擊，仍需魔力、與普攻擇一，並遵守召喚暈眩、目標限制與反制規則；不算秘術或連奏。完整解壓後執行 TwilightCodex.exe，預設 Compatibility＋ANGLE，附本機診斷工具。最終 ZIP 解壓 EXE 已在本機通過一般視窗與無畫面啟動檢查，主選單已目視確認；朋友電腦與完整真人外網對局尚未驗收。保留資源加密、授權附件與可關閉的匿名統計。正式多人需 R11（BUILD 2026101502）。",
    noteEn: "Deckmarch R11 updates original pixel damage numbers, restores six cavern and frostland normal maps and corrects skill cost text. Five explicit ranged minion skills avoid target retaliation but still cost Mana, share the normal attack action and obey summoning sickness, target and reaction rules; they are not Arcana and do not count toward Spell Combo. Extract the full ZIP and run TwilightCodex.exe. Compatibility/ANGLE and local diagnostics are included. The extracted final ZIP EXE passed local GUI and headless startup, with the main menu visually checked. Friend PCs and full two-human Internet matches remain untested. Encryption, legal documents and optional anonymous statistics are retained. Official multiplayer requires R11 (BUILD 2026101502).",
  },
  {
    id: "macos",
    platform: "macOS",
    en: "ZIP · Universal",
    status: "available",
    file: "TwilightCodex-macOS-20261015-R11.zip",
    version: "2026.10.15-R11",
    size: "457.3 MiB",
    bytes: 479545957,
    updated: "2026-10-15",
    sha256: "f70295913942a3f50ff9dc4fac27d769cc4f61212c70c07a27971640a2fe1c70",
    build: 2026101502,
    minimumBuild: 2026101502,
    protocol: 16,
    requirement: "macOS 13.0+ · Apple Silicon／Intel · 滑鼠與鍵盤",
    note: "王牌戰線 Deckmarch R11，更新原創像素傷害浮字、五項遠程從者技能規則、洞窟與冰原共六張法線貼圖及技能費用說明。macOS 13.0 以上，Apple Silicon／Intel 通用 ZIP；完整解壓後開啟包內 .app。ad-hoc 簽章，尚未 Apple 公證。本輪未在 macOS 原生系統啟動；封裝檢查不等於原生畫面或操作驗收。保留資源加密、授權附件與可關閉的匿名統計。正式多人需 R11（BUILD 2026101502）。",
    noteEn: "Deckmarch R11 updates original pixel damage numbers, five explicit ranged minion skills, six cavern and frostland normal maps and skill cost text. Universal ZIP for macOS 13.0+ on Apple Silicon and Intel. Extract all files and open the bundled .app. Ad-hoc signed and not Apple-notarized. Native macOS startup and UI remain untested; package checks are separate results. Encryption, legal documents and optional anonymous statistics are retained. Official multiplayer requires R11 (BUILD 2026101502).",
  },
  {
    id: "linux",
    platform: "Linux",
    en: "ZIP · x86_64",
    status: "available",
    file: "TwilightCodex-Linux-20261015-R11.zip",
    version: "2026.10.15-R11",
    size: "440.1 MiB",
    bytes: 461467895,
    updated: "2026-10-15",
    sha256: "5c7a2d114859971361ac646cb6f67eef978c8020df48465ade94b31ffab273a2",
    build: 2026101502,
    minimumBuild: 2026101502,
    protocol: 16,
    requirement: "x86_64 · Ubuntu 24.04+，或其他 glibc 2.39+ 發行版",
    note: "王牌戰線 Deckmarch R11 Linux 桌面玩家 ZIP，更新原創像素傷害浮字、五項遠程從者技能規則、洞窟與冰原共六張法線貼圖及技能費用說明。需要 x86_64 與 glibc 2.39 以上，例如 Ubuntu 24.04 以上。完整解壓並保留執行權限。本輪未在 Linux 桌面原生系統啟動；封裝檢查不等於桌面操作驗收。保留資源加密、授權附件與可關閉的匿名統計。正式多人需 R11（BUILD 2026101502）。",
    noteEn: "Deckmarch R11 updates original pixel damage numbers, five explicit ranged minion skills, six cavern and frostland normal maps and skill cost text. Linux desktop player ZIP for x86_64 and glibc 2.39+, such as Ubuntu 24.04+. Extract all files and retain executable permissions. Native Linux desktop startup and UI remain untested; package checks are separate results. Encryption, legal documents and optional anonymous statistics are retained. Official multiplayer requires R11 (BUILD 2026101502).",
  },
  {
    id: "android",
    platform: "Android",
    en: "APK · arm64 · Preview",
    status: "preparing",
    file: "TwilightCodex-Android-20261014-R9.apk",
    version: "2026.10.14-R9",
    size: "442.3 MiB",
    bytes: 463810470,
    updated: "2026-10-15",
    sha256: "642d868da2822ed00efad335819d55468261db9f4c95303ff92c7c3ebf02dbf6",
    build: 2026101404,
    minimumBuild: 2026101402,
    protocol: 16,
    requirement: "本次支援基準：Android 9+ · arm64（64 位元 ARM）",
    note: "暫停下載：2026-10-15 實機試玩發現嚴重問題，修正前暫停提供 R9 Android APK。進入對局後嚴重卡頓、記憶體占用過高，手機可能卡住；遊戲內無法截圖，畫面模糊；操作仍是電腦版介面，出現捲軸且無法用手指滑動。已安裝 R9 APK 的玩家請等待修正版。",
    noteEn: "Download paused: on-device testing on 2026-10-15 found severe issues, so the R9 Android APK is unavailable until fixed. Matches lag heavily and use so much memory the phone can freeze; in-game screenshots are blocked and the display is blurry; the UI still behaves like the desktop version, with scrollbars that cannot be swiped. If you already installed the R9 APK, please wait for the fixed build.",
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
  if (build.status === "suspended") return "暫停下載";
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
    version: "2026.10.15-R11",
    date: "2026-10-15",
    title: "像素傷害浮字、遠程技能與地形貼圖修補",
    changes: [
      "傷害改為原創像素數字、暖黃色與深色外框，依序短暫放大、停留閱讀與淡出（pop／read／fade）；治療、護盾保留各自顏色。擁擠時局部縮短移動，避免遮住生命數值與 HUD 操作按鈕。",
      "巫師「火球術」、術士「靈魂吸取」、邪眼魔「精神衝擊」、蛙人薩滿「寒潭水彈」、暮色術士「暮焰」標示為遠程法術，不受目標反擊；傷害與費用不變，仍需魔力、與普攻共用一次行動，並遵守召喚暈眩、原有目標限制與反制規則。",
      "上述遠程法術仍是從者技能，不算打出秘術（Arcana），也不計入連奏（Spell Combo）；普通攻擊與其他強化攻擊維持原有反擊規則。卡文、詞典、牌組詳情與雙語教學同步更新。",
      "印衛守望者「補築結界」的 UI 費用說明由 1 改為 2 魔力，與實際扣費一致。",
      "補齊洞窟與冰原場景漏打包的六張法線貼圖，修正進入對局時的資源載入錯誤。",
      "正式多人最低 BUILD 提升為 R11（2026101502），舊桌面版需先更新；協定維持 16，保留原有帳號、收藏、牌組與玩家資料。",
      "本輪公開 Windows／macOS／Linux 三個桌面玩家 ZIP。Windows 最終 ZIP 解壓 EXE 已在本機通過一般視窗與無畫面啟動檢查，主選單已目視確認；macOS／Linux 原生啟動、朋友電腦與完整真人外網對局仍未驗收。",
      "macOS 13.0 以上通用版採 ad-hoc 簽章，尚未 Apple 公證；Linux x86_64 需要 glibc 2.39 以上，例如 Ubuntu 24.04。Android 等待 Samsung Galaxy S24 FE 真人實機驗收，本版不公開 APK，也不提供舊 R9 APK 備援。",
      "保留 R10 的卡牌更新、手牌與技能提示、Windows 相容模式及診斷工具、可關閉的匿名統計；桌面版保留選擇性資源加密與授權附件，玩家包不包含專用伺服器程式。",
    ],
  },
  {
    version: "2026.10.15-R10",
    date: "2026-10-15",
    title: "王牌戰線 Deckmarch：新版介面與引導練習",
    changes: [
      "正式更名為「王牌戰線 Deckmarch」。顯示名稱更新；既有帳號、收藏、牌組、玩家資料位置、官方網址與 TwilightCodex 附件前綴保留相容性。",
      "重新整理主選單與對戰 HUD，使用新的像素風介面插畫與統一卡背；保留原有 HD-2D 英雄，讓魔力資訊與主要操作更清楚。",
      "新增引導練習，先練召喚、結束回合與攻擊，再進入開包和組牌。練習借牌不寫入收藏，也不計正式勝利；一般對局仍要求合法持有的六十張牌組。",
      "新手 150 張額度以每包五張顯示為 30 包，保留舊玩家零散剩額；新增玩家信箱與卡包券禮物領取流程，重試不重複入帳。",
      "開包揭曉與閱讀分開；批次聚焦整份結果的最高稀有度一次，可略過並尊重減少動態。同步調整卡牌費用、數值、技能描述與稀有度。",
      "本輪公開 Windows／macOS／Linux 三個桌面玩家包。三平台各通過 1183 項封裝資源檢查與完整 ZIP 解壓核對；macOS／Linux 原生啟動、朋友電腦與完整真人外網對局未驗收。",
      "Android 先保留測試包，等待 Samsung Galaxy S24 FE 實機安裝、啟動與對戰驗收，不提供舊 R9 APK 備援。",
      "保留選擇性資源加密、25 份完整授權與著作權附件、匿名遊玩統計（可關閉）；協定維持 16、線上最低 BUILD 維持 2026101402。",
    ],
  },
  {
    version: "2026.10.14-R9",
    date: "2026-10-15",
    title: "四平台玩家包與啟動相容性",
    changes: [
      "Windows／macOS 同步更新，新增 Linux 桌面玩家 ZIP 與 Android arm64 預覽 APK。四平台共用 R9，iPhone 尚未提供安裝版本。",
      "Windows 預設使用 Compatibility＋ANGLE。最終 ZIP 解壓後的 EXE 已在本機通過一般視窗與無畫面啟動檢查，記錄主選單第一幀；朋友電腦與完整真人外網對局仍未驗收。",
      "Linux 版需要 x86_64、glibc 2.39 以上（例如 Ubuntu 24.04 以上）；macOS 版需要 13.0 以上，Universal、ad-hoc 簽章且未 Apple 公證。兩者本輪均未做原生啟動驗收。",
      "Android 預覽版提供已簽署 arm64 APK，支援基準為 Android 9 以上；manifest 最低 API 24、target API 36。長按卡牌 0.5 秒可查看說明，實機安裝、啟動與觸控仍未驗收，本次不承諾支援 Android 7／8。",
      "Android 已知匯出圖示資源警告保留，profile 初始化可能略過，實際影響尚待實機驗證；不把靜態封裝與簽章檢查當作實機驗收。",
      "四平台各通過 332 項封裝資源檢查；保留選擇性資源加密、原作者署名、25 份授權與著作權附件及匿名遊玩統計（可關閉），排除伺服器程式與開發來源。加密提高直接解包門檻，不能保證無法逆向。",
      "協定維持 16、正式連線最低版號維持 R7（2026101402），不重設收藏、牌組或正式玩家資料。",
    ],
  },
  {
    version: "2026.10.14-R8",
    date: "2026-10-14",
    title: "玩家包保護與連線安全",
    changes: [
      "Windows／macOS 玩家包加入選擇性 PCK 加密，保護專案程式、卡牌資料與核對過的生成素材；第三方、開放授權與待釐清素材保留可讀。加密提高直接解包門檻，不能保證無法逆向。",
      "保留原作者署名、第三方授權與著作權聲明；排除伺服器程式、開發原稿、製作紀錄與金鑰。舊 R6／R7 未加密公開附件暫時收回並保留為草稿；更新檔只提供玩家包。",
      "伺服器增加行動限速、受限快照回覆與未握手連線回收；修正極大非法序號阻斷後續正常操作。協定維持 16、正式連線最低版號維持 R7，舊玩家可取得 R8 更新提醒。",
      "兩平台各通過 327 項加密成品資源與主選單背景檢查；macOS 實際執行檔無畫面啟動及簽章核對通過。Windows 原生系統與有畫面的真人對局仍待實測。macOS 需 13.0 以上，尚未 Apple 公證。",
    ],
  },
  {
    version: "2026.10.14-R7",
    date: "2026-10-14",
    title: "線上對戰統一玩家版本",
    changes: [
      "正式伺服器在大廳及對局入座檢查最低玩家版號，現在連線需 R7（BUILD 2026101402）以上；過舊或沒有版號的玩家會收到更新提示。連線協定維持 16。",
      "R6 主選單會取得新版通知；更早版本請從官網重新下載。完整解壓縮後啟動，既有帳號、本機收藏及牌組保留。",
      "Windows／macOS 玩家包各通過 326 項成品資源檢查；已使用兩平台成品驗證新版允許、舊 R6 拒絕的連線流程。macOS 簽章驗證通過；Windows 原生系統與新版真人完整對局仍待實測。",
      "延用玩家包資源白名單，排除專用伺服器腳本、未採用卡圖與開發原稿；伺服器封裝僅經私人管道部署。本輪尚未加入 PCK 加密。",
    ],
  },
  {
    version: "2026.10.14-R6",
    date: "2026-10-14",
    title: "更新提醒與玩家包隔離",
    changes: [
      "Windows／macOS 玩家包同步更新。移除專用伺服器程式、未採用卡圖、開發原稿與製作紀錄；公開版本附件不再提供伺服器部署包。",
      "主選單會背景檢查新版，並提供官方下載入口；最低版號或協定要求更新時，先更新再進行正式連線。離線練習與本機收藏、牌組保留。舊版需要先手動更新這一次。",
      "兩平台成品各通過 325 項資源與主選單檢查；macOS 簽章驗證通過。Windows 原生系統啟動及新版真人對局仍待測試。",
      "下載包加入著作權聲明、第三方授權與 Windows 相容啟動／診斷工具。連線協定保持 16；本輪尚未加入 PCK 加密。",
    ],
  },
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
