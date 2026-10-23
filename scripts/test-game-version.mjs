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
assert.equal(versions.versionManifest([{ ...fixture, id: "android", status: "suspended" }]).platforms.android, undefined, "Suspended Android is absent from update downloads");
assert.deepEqual(Object.keys(versions.versionManifest().platforms).sort(), ["android", "linux", "macos", "windows"]);
for (const build of releases.BUILDS.filter((item) => releases.downloadUrl(item))) {
  const names = { windows: "Windows", macos: "macOS", linux: "Linux", android: "Android" };
  const extension = build.id === "android" ? "apk" : "zip";
  const trusted = new RegExp(`^https://github\\.com/wuharry/twilight-codex-downloads/releases/download/[A-Za-z0-9._-]+/TwilightCodex-${names[build.id]}-[A-Za-z0-9._-]+\\.${extension}$`);
  assert.match(releases.downloadUrl(build), trusted, "Official update links remain compatible with existing game trust rules");
}
assert.equal(releases.RELEASE_NOTES[0].version, GAME_FACTS.version, "Latest notes match the offered game version");
console.log("PASS game version manifest: published platform, exact download, minimum, invalid hashes, no-store endpoint, display version and client trust rules");
