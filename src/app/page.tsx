import { SiteHeader } from "@/components/site-header";
import { EntryScreen } from "@/components/entry-screen";
import { LatestNews, GameIntroduction, ModesOverview, PlayerSupport } from "@/components/home-sections";
import { CardDiscovery } from "@/components/card-discovery";
import { ArenaGallery } from "@/components/arena-gallery";
import { DownloadPanel } from "@/components/download-panel";
import { SiteFooter } from "@/components/site-footer";
import { HOME_TITLE, HOME_DESCRIPTION, pageMetadata, homeStructuredData } from "@/data/seo";

export const metadata = pageMetadata("/", HOME_TITLE, HOME_DESCRIPTION);

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData()).replace(/</g, "\\u003c") }} />
      <SiteHeader />
      <main id="main-content" className="marketing-home">
        <EntryScreen />
        <LatestNews />
        <GameIntroduction />
        <CardDiscovery />
        <ArenaGallery />
        <ModesOverview />
        <DownloadPanel />
        <PlayerSupport />
      </main>
      <SiteFooter />
    </>
  );
}
