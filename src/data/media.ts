import manifest from "../../public/media/import-manifest.json";

/** 圖片內容改變時換網址，讓 Next/image 與瀏覽器取得新版素材。 */
export function mediaUrl(source: string): string {
  const asset = manifest.find((entry) => entry.output === source);
  return asset ? `${source}?v=${asset.outputSha256.slice(0, 12)}` : source;
}
