import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const [manifestPath, baselinePath] = process.argv.slice(2);
assert.ok(manifestPath && baselinePath, "Supply the fixed Android release.json and prior production API snapshot");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const releases = await loadTsModule(new URL("../src/data/releases.ts", import.meta.url));
const versions = await loadTsModule(new URL("../src/data/game-version.ts", import.meta.url), { "./releases": releases });
const offered = releases.BUILDS.find((build) => build.id === "android");
assert.equal(manifest.schema, "paper-raven-android-release/v1");
assert.equal(manifest.artifacts.length, 1);
const artifact = manifest.artifacts[0];
assert.equal(artifact.platform, "android");
assert.deepEqual(manifest.public_asset_allowlist.slice().sort(), [artifact.filename, artifact.content.filename, "release.json", "SHA256SUMS"].sort());
for (const [key, value] of Object.entries({
  version: manifest.version, build: manifest.build, minimumBuild: manifest.minimum_build,
  protocol: manifest.protocol, file: artifact.filename, bytes: artifact.bytes, sha256: artifact.sha256,
})) assert.equal(offered[key], value, `Website Android ${key} must match the fixed candidate`);
assert.deepEqual(offered.content, artifact.content);
assert.equal(releases.downloadUrl(offered), `https://github.com/wuharry/twilight-codex-downloads/releases/download/${manifest.tag}/${artifact.filename}`);
assert.equal(offered.websiteDelivery, "static-apk");
assert.match(releases.websiteDownloadUrl(offered), new RegExp(`^/downloads/android/${artifact.sha256}/`));
assert.ok(offered.downloadNotice.zh.includes("離線") && offered.downloadNotice.en.toLowerCase().includes("offline"));
assert.ok(offered.downloadNotice.zh.includes("未") && offered.downloadNotice.en.toLowerCase().includes("untested"));
const api = versions.versionManifest();
assert.deepEqual(api.platforms, baseline.platforms, "The new offline offer must leave every existing online update pin and note unchanged");
assert.equal(api.offline_platforms.android.build, manifest.build);
assert.equal(api.offline_platforms.android.protocol, manifest.protocol);
assert.equal(api.offline_platforms.android.sha256, artifact.sha256);
assert.equal(api.offline_platforms.android.download_url, releases.downloadUrl(offered));
assert.equal(manifest.publication_eligible, false, "Packaging must retain its pending device-validation state");
console.log("PASS Android-only release: fixed APK/content pins, same-origin download, offline notice, unchanged legacy online API, separate offline identity and honest native status");
