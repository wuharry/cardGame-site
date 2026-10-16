import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public site's CSS is small: deliver it with HTML for cold mobile loads.
  // Next 16.3.8 pins this experimental behavior; test client navigation as well.
  experimental: { inlineCss: true },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        ...(process.env.VERCEL_ENV === "preview" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" },
      ],
    }];
  },
  images: {
    // 匯入清單的內容 hash 會放在 query，更新素材時避開舊圖片快取。
    localPatterns: [{ pathname: "/media/**" }],
  },
};

export default nextConfig;
