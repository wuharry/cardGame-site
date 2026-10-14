import { BUILDS, downloadUrl, type Build } from "./releases";

/** Reads the same verified artifacts as the website; planned platforms are omitted. */
export function versionManifest(builds: readonly Build[] = BUILDS) {
  const platforms: Record<string, {
    build: number; minimum_build: number; protocol: number; version: string;
    download_url: string; sha256: string; bytes: number;
    notes: { zh_TW: string; en: string };
  }> = {};
  for (const build of builds) {
    const url = downloadUrl(build);
    if (!url || !build.version || !build.build || !build.minimumBuild || !build.protocol
      || !build.sha256 || !build.bytes) continue;
    if (!Number.isSafeInteger(build.build) || !Number.isSafeInteger(build.minimumBuild)
      || build.minimumBuild < 1 || build.minimumBuild > build.build
      || !Number.isSafeInteger(build.protocol) || build.protocol < 1
      || !/^[a-f0-9]{64}$/.test(build.sha256) || build.bytes < 1) {
      throw new Error(`Invalid published build metadata: ${build.id}`);
    }
    platforms[build.id] = {
      build: build.build, minimum_build: build.minimumBuild, protocol: build.protocol,
      version: build.version, download_url: url, sha256: build.sha256, bytes: build.bytes,
      notes: { zh_TW: build.note ?? "", en: build.noteEn ?? "" },
    };
  }
  return { schema_version: 1, platforms };
}
