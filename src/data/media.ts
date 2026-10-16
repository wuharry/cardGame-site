import manifest from "../../public/media/import-manifest.json";

/** 圖片內容改變時換網址，讓 Next/image 與瀏覽器取得新版素材。 */
export function mediaUrl(source: string): string {
  const asset = manifest.find((entry) => entry.output === source);
  return asset ? `${source}?v=${asset.outputSha256.slice(0, 12)}` : source;
}

/** 擷取日期與遊戲版號分開顯示，避免將新版場景誤標成舊版對局。 */
export function mediaCaptureCaption(source: string): string {
  const asset = manifest.find((entry) => entry.output === source);
  if (asset && "sourceVersion" in asset && "capturedOn" in asset) {
    return `${asset.sourceVersion} · ${asset.capturedOn} 原生展示畫面`;
  }
  return "遊戲畫面；不同平台與畫質設定的效果可能不同";
}
