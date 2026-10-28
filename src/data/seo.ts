import type { Metadata } from "next";
import { GAME_FACTS } from "./game";
import { BUILDS, downloadUrl } from "./releases";
import { mediaDimensions, mediaUrl } from "./media";

// Deployment aliases must not become canonical URLs. SITE_URL may change when
// the site moves to its own domain; previews still refer to production.
export const SITE_ORIGIN = new URL(process.env.SITE_URL ?? "https://twilight-codex.vercel.app").origin;
export const SITE_NAME = `${GAME_FACTS.nameZh} ${GAME_FACTS.nameEn}`;
export const HOME_TITLE = `${SITE_NAME} — 四路前後排的回合制卡牌對戰`;
const platforms = BUILDS.filter((build) => downloadUrl(build)).map((build) => build.platform);
export const HOME_DESCRIPTION = `${SITE_NAME}：HD-2D 回合制卡牌對戰，四路前後排、六種卡型與種族結界，${GAME_FACTS.cards} 種正式卡。組建自己的六十張，挑戰 AI 或與朋友連線對戰。${platforms.length ? `查看${platforms.join("／")}試玩下載與更新。` : "目前下載暫停，請查看各平台狀態與更新進度。"}`;

export const PUBLIC_PATHS = ["/", "/guide", "/news", "/credits", "/install/android"] as const;
export const siteUrl = (path: string) => new URL(path, `${SITE_ORIGIN}/`).href;

export function pageMetadata(path: string, title: string, description: string): Metadata {
  const fullTitle = path === "/" ? title : `${title} — ${SITE_NAME}`;
  const image = siteUrl(mediaUrl("/media/screens/hero-battlefield.webp"));
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: siteUrl(path) },
    openGraph: {
      title: fullTitle, description, url: siteUrl(path), siteName: SITE_NAME,
      type: "website", locale: "zh_TW",
      images: [{ url: image, ...mediaDimensions("/media/screens/hero-battlefield.webp"), alt: "紙鴉牌實機戰場" }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
  };
}

export function homeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": siteUrl("/#website"), name: SITE_NAME,
        alternateName: [GAME_FACTS.nameEn, GAME_FACTS.nameZh], url: siteUrl("/"), inLanguage: "zh-Hant-TW" },
      { "@type": "VideoGame", "@id": siteUrl("/#game"), name: GAME_FACTS.nameZh,
        alternateName: GAME_FACTS.nameEn, url: siteUrl("/"), description: HOME_DESCRIPTION,
        image: siteUrl(mediaUrl("/media/screens/hero-battlefield.webp")),
        genre: ["回合制策略", "卡牌對戰"], gamePlatform: platforms, inLanguage: ["zh-Hant", "en"],
      },
    ],
  };
}
