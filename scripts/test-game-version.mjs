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
const newAndroid = {
  ...fixture, id: "android", file: "TwilightCodex-Android-fixture.apk",
  downloadNotice: {
    zh: "這是新 App，需要另外安裝。確認新版正常後，舊版可以移除。遊客與本機進度不會自動轉移；使用原本的帳號登入，可恢復雲端收藏與錢包。",
    en: "This is a new app and must be installed separately. You can remove the old app after confirming the new one works. Guest and local progress do not transfer automatically. Sign in with your existing account to restore your cloud collection and wallet.",
  },
};
const androidUpdate = versions.versionManifest([newAndroid]).platforms.android;
assert.equal(androidUpdate.notes.zh_TW, `${fixture.note}\n\n${newAndroid.downloadNotice.zh}`,
  "Existing Android clients see the separate-app and local-progress warning before direct APK download");
assert.equal(androidUpdate.notes.en, `${fixture.noteEn}\n\n${newAndroid.downloadNotice.en}`);
assert.equal(androidUpdate.download_url, releases.downloadUrl(newAndroid), "Keep the older client's trusted APK URL");
assert.deepEqual(versions.versionManifest([{ ...newAndroid, note: undefined, noteEn: undefined }]).platforms.android.notes,
  { zh_TW: newAndroid.downloadNotice.zh, en: newAndroid.downloadNotice.en },
  "The installation warning is retained even without separate release notes");
assert.deepEqual(versions.versionManifest([{ ...fixture, downloadNotice: newAndroid.downloadNotice }]).platforms.windows.notes,
  { zh_TW: fixture.note, en: fixture.noteEn }, "Android installation guidance does not alter desktop release notes");
assert.deepEqual(Object.keys(manifest.platforms), ["windows"]);
assert.equal(manifest.platforms.windows.download_url, releases.downloadUrl(fixture));
assert.equal(manifest.platforms.windows.build, fixture.build);
assert.equal(manifest.platforms.windows.notes.en, "New version");
assert.throws(() => versions.versionManifest([{ ...fixture, minimumBuild: fixture.build + 1 }]));
assert.throws(() => versions.versionManifest([{ ...fixture, sha256: "invalid" }]));
assert.equal(versions.versionManifest([{ ...fixture, status: "preparing" }]).platforms.windows, undefined);
assert.equal(versions.versionManifest([{ ...fixture, status: "suspended" }]).platforms.windows, undefined);
const offline = { ...fixture, build: fixture.build + 1, protocol: fixture.protocol + 1, onlineUpdate: fixture };
const splitChannels = versions.versionManifest([offline]);
assert.equal(splitChannels.platforms.windows.build, fixture.build, "Offline preview must not force online users to upgrade");
assert.equal(splitChannels.platforms.windows.protocol, fixture.protocol, "Legacy online compatibility stays unchanged");
assert.equal(splitChannels.offline_platforms.windows.build, offline.build, "Offline artifact identity remains discoverable");
assert.equal(splitChannels.offline_platforms.windows.protocol, offline.protocol);
assert.deepEqual(versions.versionManifest([{ ...offline, status: "suspended" }]), { schema_version: 1, platforms: {} },
  "Suspending an offline offer also removes its retained links from the public update response");
assert.throws(() => versions.versionManifest([{ ...offline, onlineUpdate: { ...fixture, id: "android" } }]));
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
const newestOffer = releases.BUILDS.filter((build) => releases.downloadUrl(build)).sort((a, b) => b.build - a.build)[0];
assert.equal(releases.RELEASE_NOTES[0].version, newestOffer.version, "Latest notes match the newest offered platform");
assert.ok(Object.values(versions.versionManifest().platforms).every((build) => build.version === GAME_FACTS.version),
  "Stable game facts still describe every official online update");
console.log("PASS game version manifest: published platform, exact download, minimum, invalid hashes, no-store endpoint, display version and client trust rules");
