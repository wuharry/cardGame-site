import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { HOME_TITLE, HOME_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "@/data/seo";
import { LayoutOnInteraction } from "@/components/layout-on-interaction";
import "../fonts/site-font.css";
import "./globals.css";
import "./marketing.css";

// Keep fonts local: the Google font loader failed in Vercel Turbopack builds.
// Original sources, hashes and existing OFL licenses: ../fonts/latin-fonts.json.
/* 銘刻感的羅馬碑刻體：只給徽標與段落編號，維持「金屬牌」的印象。 */
const cinzel = localFont({
  variable: "--font-cinzel",
  src: [
    { path: "../fonts/cinzel-600-latin.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cinzel-700-latin.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

/* 內文。刻意不用 Inter——Barlow 的方肩比較像遊戲介面而非 SaaS。 */
const barlow = localFont({
  variable: "--font-barlow",
  src: [
    { path: "../fonts/barlow-400-latin.woff2", weight: "400", style: "normal" },
    { path: "../fonts/barlow-500-latin.woff2", weight: "500", style: "normal" },
    { path: "../fonts/barlow-600-latin.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  preload: false,
});

/* HUD 標籤與數值：窄體大寫，直接借遊戲介面的語氣。 */
const barlowCondensed = localFont({
  variable: "--font-barlow-condensed",
  src: [
    { path: "../fonts/barlow-condensed-500-latin.woff2", weight: "500", style: "normal" },
    { path: "../fonts/barlow-condensed-600-latin.woff2", weight: "600", style: "normal" },
    { path: "../fonts/barlow-condensed-700-latin.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  verification: {
    google: "PKJXLoQy0VwSEQOSFLZfBSNhxVWk0PgPVjLETktDAv4",
  },
  metadataBase: new URL(SITE_ORIGIN),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  title: {
    default: HOME_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  keywords: [
    "紙鴉牌",
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
      {/* Mounted in the root layout: an interaction on /guide must release
          layout before client navigation reaches /#download. */}
      <body className="min-h-full antialiased"><LayoutOnInteraction />{children}</body>
    </html>
  );
}
