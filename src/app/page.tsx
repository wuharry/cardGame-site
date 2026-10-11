import { SiteHeader } from "@/components/site-header";
import { EntryScreen } from "@/components/entry-screen";
import { TurnFlow } from "@/components/turn-flow";
import { LaneDoctrine } from "@/components/lane-doctrine";
import { CardTypeShowcase } from "@/components/card-types";
import { SystemsPanel } from "@/components/systems-panel";
import { CollectionPanel } from "@/components/collection-panel";
import { ArenaBand } from "@/components/arena-band";
import { GameModes } from "@/components/game-modes";
import { DownloadPanel } from "@/components/download-panel";
import { PatchNotes } from "@/components/patch-notes";
import { SiteFooter } from "@/components/site-footer";

/**
 * 頁面段落順序：從宏觀心流到細部實戰，層層推進：
 *   入口 (EntryScreen)       這是什麼遊戲、核心特色與下載
 *   流程 (TurnFlow)          30 秒看懂一回合的交鋒循環 (4 階段)
 *   路線 (LaneDoctrine)      四路前後排實戰交鋒演練 (動態軌跡)
 *   卡型 (CardTypeShowcase)  三卡合一武裝生態與六種卡型
 *   規則 (SystemsPanel)      一回合資源與行動上限
 *   組牌 (CollectionPanel)   自組 60 張與硬派「勝者奪卡」法則
 *   戰場 (ArenaBand)         實機地圖與陣容角色
 *   模式 (GameModes)         單人練習、區網與連線對戰
 *   下載 (DownloadPanel)     Windows 版下載與驗證
 *   更新 (PatchNotes)        版本開發進度紀錄
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <EntryScreen />
        <TurnFlow />
        <LaneDoctrine />
        <CardTypeShowcase />
        <SystemsPanel />
        <CollectionPanel />
        <ArenaBand />
        <GameModes />
        <DownloadPanel />
        <PatchNotes />
      </main>
      <SiteFooter />
    </>
  );
}
