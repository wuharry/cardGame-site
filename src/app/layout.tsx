import type { Metadata, Viewport } from "next";
import { Cinzel, Barlow, Barlow_Condensed } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://cardgame-demo.example"),
  title: {
    default: "卡牌對決 CardGame Demo — 五條路線的回合制卡牌對戰",
    template: "%s — 卡牌對決 CardGame Demo",
  },
  description:
    "以 Godot 4.5 開發的 3D 回合制卡牌對戰遊戲。戰場是五條並排路線，攻擊只走正前方——你站的那一路，就是你選的那場仗。提供 Android APK 下載。",
  keywords: [
    "卡牌對決",
    "CardGame Demo",
    "卡牌遊戲",
    "Godot",
    "HD-2D",
    "回合制",
    "獨立遊戲",
    "Android APK",
  ],
  openGraph: {
    title: "卡牌對決 CardGame Demo",
    description:
      "五條路線的回合制卡牌對戰。站位就是策略。Godot 4.5 打造的 HD-2D 戰場。",
    type: "website",
    locale: "zh_TW",
    images: [{ url: "/media/screens/hero-battlefield.webp", width: 1920, height: 1080 }],
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
