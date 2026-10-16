import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // Keep /admin crawlable so its noindex tag can be seen. This file is not
    // access control; admin data remains protected by the existing API checks.
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
