import type { Metadata, Viewport } from "next";
import { Cinzel, Barlow, Barlow_Condensed } from "next/font/google";
import { GAME_FACTS } from "@/data/game";
import { mediaUrl } from "@/data/media";
import "./globals.css";

/* 銘刻感的羅馬碑刻體：只給徽標與段落編號，維持「金屬牌」的印象。 */
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

/* 內文。刻意不用 Inter——Barlow 的方肩比較像遊戲介面而非 SaaS。 */
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/* HUD 標籤與數值：窄體大寫，直接借遊戲介面的語氣。 */
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? (productionHost ? `https://${productionHost}` : "http://localhost:3100")),
  title: {
    default: "暮色秘典 Twilight Codex — 四路前後排的回合制卡牌對戰",
    template: "%s — 暮色秘典 Twilight Codex",
  },
  description:
    `${GAME_FACTS.nameZh} ${GAME_FACTS.nameEn}：HD-2D 回合制卡牌對戰，四路前後排、六種卡型與種族結界，${GAME_FACTS.cards} 種正式卡。合法持有六十張即可對戰，選牌直接閱讀效果。查看 Windows 版下載資訊及開發進度。`,
  keywords: [
    "暮色秘典",
    "Twilight Codex",
    "卡牌遊戲",
    "Godot",
    "HD-2D",
    "回合制",
    "獨立遊戲",
    "Windows 遊戲",
  ],
  openGraph: {
    title: "暮色秘典 Twilight Codex",
    description:
      `四路前後排、種族結界與自己的六十張。244 種正式卡，Windows ${GAME_FACTS.version} 下載資訊與雙人房間對戰。`,
    type: "website",
    locale: "zh_TW",
    images: [{ url: mediaUrl("/media/screens/hero-battlefield.webp"), width: 1280, height: 720, alt: "暮色秘典實機戰場" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0b09",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-Hant-TW"
      className={`${cinzel.variable} ${barlow.variable} ${barlowCondensed.variable} h-full`}
    >
      <head>
        {/* 中文明體走 Google 的 unicode-range 分片，只下載真正用到的字塊；
            交給 next/font 自架會把整套 CJK 拉進 build。 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* 這條規則是給 pages/_document 用的；App Router 的 root layout 本來就
            套用到每一頁，不會只載入單頁。 */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
