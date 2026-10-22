import { strict as assert } from "node:assert";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const load = (file, imports) => loadTsModule(new URL(file, import.meta.url), imports);
const releases = await load("../src/data/releases.ts");
const versions = await load("../src/data/game-version.ts", { "./releases": releases });
const { GAME_FACTS } = await load("../src/data/game.ts");
const route = await load("../src/app/api/game-version/route.ts", { "@/data/game-version": versions });
const fixture = {
  id: "windows", status: "available", file: "TwilightCodex-Windows-20261014-R6.zip",
  version: "2026.10.14-R6", build: 2026101401, minimumBuild: 2026101401, protocol: 16,
  bytes: 100, sha256: "a".repeat(64), note: "新版本", noteEn: "New version",
};
const manifest = versions.versionManifest([fixture, { id: "linux", status: "planned", file: null }]);
assert.deepEqual(Object.keys(manifest.platforms), ["windows"]);
assert.equal(manifest.platforms.windows.download_url, releases.downloadUrl(fixture));
assert.equal(manifest.platforms.windows.build, fixture.build);
assert.equal(manifest.platforms.windows.notes.en, "New version");
assert.throws(() => versions.versionManifest([{ ...fixture, minimumBuild: fixture.build + 1 }]));
assert.throws(() => versions.versionManifest([{ ...fixture, sha256: "invalid" }]));
assert.equal(versions.versionManifest([{ ...fixture, status: "preparing" }]).platforms.windows, undefined);
assert.equal(versions.versionManifest([{ ...fixture, status: "suspended" }]).platforms.windows, undefined);
const response = route.GET();
assert.equal(response.status, 200);
assert.equal(response.headers.get("Cache-Control"), "no-store");
assert.deepEqual(await response.json(), versions.versionManifest());
const current = versions.versionManifest();
const macos = releases.BUILDS.find((build) => build.id === "macos");
const r17Base = "https://github.com/wuharry/twilight-codex-downloads/releases/download/v2026.10.22-r17";
assert.deepEqual(Object.keys(current.platforms), ["macos"], "R17 restores only macOS to the actual update API");
assert.deepEqual(current.platforms.macos, {
  build: 2026102201, minimum_build: 2026102101, protocol: 28, version: "2026.10.22-R17",
  download_url: `${r17Base}/TwilightCodex-macOS-20261022-R17.zip`,
  sha256: "c2f768a3fde7303d98b2cf71a6a07027c4fd4af4e4f024d205ff52cb221ad8f1",
  bytes: 83713638, notes: { zh_TW: macos.note, en: macos.noteEn },
}, "Schema 1 pins the exact R17 ZIP and preserves the lower minimum build");
assert.equal(macos.releaseBase, r17Base, "R17 never inherits the historical R15 global base");
assert.equal(macos.hotfix, undefined, "Available macOS does not retain a current suspension notice");
assert.equal(macos.delivery, "streamed");
assert.equal(macos.size, `${(macos.bytes / 1024 ** 2).toFixed(1)} MiB`);
assert.deepEqual(macos.content, {
  filename: "PaperRaven-macOS-20261022-R17-Content.pck", bytes: 425476328,
  sha256: "6e0ab36a330deb6743c5889a8b557220a1a210c0bbc367dc4bceca11c1dd894b",
  url: `${r17Base}/PaperRaven-macOS-20261022-R17-Content.pck`,
}, "R17 streamed content is pinned separately from the ZIP");
assert.equal(GAME_FACTS.version, current.platforms.macos.version);
assert.equal(GAME_FACTS.protocol, current.platforms.macos.protocol);
assert.ok(Buffer.byteLength(JSON.stringify(current), "utf8") < 16 * 1024, "Actual R17 response fits the existing client limit");
for (const build of releases.BUILDS.filter((item) => item.id !== "macos")) {
  assert.equal(build.status, "suspended", `${build.id} remains suspended during the macOS release`);
  assert.ok(build.hotfix?.note && build.hotfix.noteEn, `${build.id} retains bilingual hotfix notices`);
  assert.equal(current.platforms[build.id], undefined, `${build.id} cannot fall back to historical API metadata`);
}
assert.equal(releases.BUILDS.find((build) => build.id === "android").file, null, "No APK is restored");
assert.deepEqual(versions.versionManifest([]), { schema_version: 1, platforms: {} }, "No platforms remains a valid manifest");
for (const build of releases.BUILDS.filter((item) => !releases.downloadUrl(item))) {
  assert.equal(versions.versionManifest().platforms[build.id], undefined, `${build.id} is absent from live update downloads`);
}
for (const build of releases.BUILDS.filter((item) => releases.downloadUrl(item))) {
  const names = { windows: "Windows", macos: "macOS", linux: "Linux", android: "Android" };
  const extension = build.id === "android" ? "apk" : "zip";
  const trusted = new RegExp(`^https://github\\.com/wuharry/twilight-codex-downloads/releases/download/[A-Za-z0-9._-]+/TwilightCodex-${names[build.id]}-[A-Za-z0-9._-]+\\.${extension}$`);
  assert.match(releases.downloadUrl(build), trusted, "Official update links remain compatible with existing game trust rules");
}
assert.equal(releases.RELEASE_NOTES[0].version, GAME_FACTS.version, "Latest notes match the offered game version");
console.log("PASS game version manifest: macOS-only R17 ZIP/content identity, exact minimum/protocol, suspended platforms, invalid hashes, no-store endpoint, display version and client trust rules");
