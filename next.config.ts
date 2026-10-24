import type { NextConfig } from "next";
import { BUILDS, staticApkPath } from "./src/data/releases";

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
    }, ...BUILDS.flatMap((build) => {
      const source = staticApkPath(build);
      return source ? [{ source, headers: [
        { key: "Content-Type", value: "application/vnd.android.package-archive" },
        { key: "Content-Disposition", value: `attachment; filename="${build.file}"` },
        { key: "Cache-Control", value: "public, max-age=31536000, immutable, no-transform" },
      ] }] : [];
    })];
  },
  images: {
    // 匯入清單的內容 hash 會放在 query，更新素材時避開舊圖片快取。
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/apple-icon.png", search: "" }],
  },
};

export default nextConfig;
