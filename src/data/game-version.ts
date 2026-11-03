import { BUILDS, downloadUrl, type Build } from "./releases";

/** Only available artifacts reach clients. An empty platforms object is a valid schema 1 response. */
export function versionManifest(builds: readonly Build[] = BUILDS) {
  const platforms: Record<string, {
    build: number; minimum_build: number; protocol: number; version: string;
    download_url: string; sha256: string; bytes: number;
    notes: { zh_TW: string; en: string };
  }> = {};
  const offlinePlatforms: typeof platforms = {};
  const records: [Build, typeof platforms][] = [];
  for (const offered of builds) {
    if (offered.status !== "available") continue;
    if (offered.onlineUpdate) {
      if (offered.onlineUpdate.id !== offered.id || offered.onlineUpdate.onlineUpdate) {
        throw new Error(`Invalid online fallback: ${offered.id}`);
      }
      records.push([offered, offlinePlatforms], [offered.onlineUpdate, platforms]);
    } else records.push([offered, platforms]);
  }
  for (const [build, destination] of records) {
    const url = downloadUrl(build);
    if (!url || !build.version || !build.build || !build.minimumBuild || !build.protocol
      || !build.sha256 || !build.bytes) continue;
    if (!Number.isSafeInteger(build.build) || !Number.isSafeInteger(build.minimumBuild)
      || build.minimumBuild < 1 || build.minimumBuild > build.build
      || !Number.isSafeInteger(build.protocol) || build.protocol < 1
      || !/^[a-f0-9]{64}$/.test(build.sha256) || build.bytes < 1) {
      throw new Error(`Invalid published build metadata: ${build.id}`);
    }
    destination[build.id] = {
      build: build.build, minimum_build: build.minimumBuild, protocol: build.protocol,
      version: build.version, download_url: url, sha256: build.sha256, bytes: build.bytes,
      notes: { zh_TW: build.note ?? "", en: build.noteEn ?? "" },
    };
  }
  return Object.keys(offlinePlatforms).length
    ? { schema_version: 1, platforms, offline_platforms: offlinePlatforms }
    : { schema_version: 1, platforms };
}
