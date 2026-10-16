import type { Metadata, Viewport } from "next";
import { Cinzel, Barlow, Barlow_Condensed } from "next/font/google";
import { HOME_TITLE, HOME_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "@/data/seo";
import { DeferredChineseFont } from "@/components/deferred-chinese-font";
import "./globals.css";
import "./marketing.css";

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

export const metadata: Metadata = {
  verification: {
    google: "PKJXLoQy0VwSEQOSFLZfBSNhxVWk0PgPVjLETktDAv4",
  },
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: HOME_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  keywords: [
    "王牌戰線",
    "Deckmarch",
    "卡牌遊戲",
    "Godot",
    "HD-2D",
    "回合制",
    "獨立遊戲",
    "Windows 遊戲",
  ],
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
        {/* Retain unicode-range chunks; load their stylesheet after first paint. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;700&display=swap" rel="stylesheet" />
        </noscript>
      </head>
      <body className="min-h-full antialiased"><DeferredChineseFont />{children}</body>
    </html>
  );
}
