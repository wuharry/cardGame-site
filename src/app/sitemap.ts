import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, siteUrl } from "@/data/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // No fabricated lastModified timestamps: a redeploy is not a content edit.
  return PUBLIC_PATHS.map((path) => ({ url: siteUrl(path) }));
}
