import { SiteHeader } from "@/components/site-header";
import { EntryScreen } from "@/components/entry-screen";
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
 * 段落順序照玩家的認知順序排，每一段回答一個問題：
 *   入口   這是什麼、怎麼拿
 *   路線   它跟別的卡牌遊戲差在哪
 *   卡型   牌組裡有什麼
 *   規則   一回合能做多少事
 *   戰場   打起來長什麼樣、有誰
 *   模式   跟誰打
 *   下載   怎麼拿到
 *   紀錄   改了什麼
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <EntryScreen />
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
