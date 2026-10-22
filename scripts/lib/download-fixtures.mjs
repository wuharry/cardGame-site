/** Synthetic packages for download-flow tests; these never modify published metadata. */
export function availableFixture(build) {
  const platform = { windows: "Windows", macos: "macOS", linux: "Linux", android: "Android" }[build.id];
  const releaseBase = "https://github.com/wuharry/twilight-codex-downloads/releases/download/fixture";
  const filename = `PaperRaven-${platform}-fixture-Content.pck`;
  return {
    ...build,
    status: "available", hotfix: undefined,
    file: `TwilightCodex-${platform}-fixture.${build.id === "android" ? "apk" : "zip"}`,
    version: "fixture", build: 1, minimumBuild: 1, protocol: 1,
    bytes: 1048576, size: "1.0 MiB", sha256: "a".repeat(64), releaseBase,
    note: "測試用版本說明。", noteEn: "Synthetic release notes for tests.",
    mirrorProvider: undefined, mirrorPageUrl: undefined,
    content: build.delivery === "streamed" ? {
      filename, bytes: 422201600, sha256: "b".repeat(64), url: `${releaseBase}/${filename}`,
    } : undefined,
  };
}
