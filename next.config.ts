import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 匯入清單的內容 hash 會放在 query，更新素材時避開舊圖片快取。
    localPatterns: [{ pathname: "/media/**" }],
  },
};

export default nextConfig;
