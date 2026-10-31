import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { basename, dirname, resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTsModule } from "./lib/load-ts-module.mjs";

let releasePath;
let helpPath;
let androidReleasePath;
let androidReleaseSha256;
const originalManifestSha256 = "a63cc2a3ee7ac01da461f864e723bcd6f4795fd1d1d284df17b5ecb581a968c5";
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--install-help") {
    helpPath = process.argv[++index];
    assert.ok(helpPath, "--install-help needs an exported HEAD source file");
  } else if (argument === "--android-release") {
    assert.ok(!androidReleasePath, "Supply the Android manifest only once");
    androidReleasePath = process.argv[++index];
    assert.ok(androidReleasePath, "--android-release needs the final release-android.json");
  } else if (argument === "--android-release-sha256") {
    assert.ok(!androidReleaseSha256, "Supply the Android manifest SHA-256 only once");
    androidReleaseSha256 = process.argv[++index];
    assert.match(androidReleaseSha256 ?? "", /^[a-f0-9]{64}$/, "--android-release-sha256 needs the actual fixed supplemental manifest SHA-256");
  } else {
    assert.ok(!argument.startsWith("--") && !releasePath, "Supply one original release.json, optional --install-help source and pinned --android-release");
    releasePath = argument;
  }
}
assert.equal(Boolean(androidReleasePath), Boolean(androidReleaseSha256), "The Android manifest and its SHA-256 pin must be supplied together");
assert.equal(Boolean(androidReleasePath), Boolean(releasePath), "Final-artifact validation requires both the original R23 desktop manifest and pinned Android supplement");
const load = (file, imports) => loadTsModule(new URL(file, import.meta.url), imports);
const shine = await loadTsModule(new URL("../src/components/download-shine.tsx", import.meta.url), {}, { allowNodeModules: true });
const releases = await load("../src/data/releases.ts");
const game = await load("../src/data/game.ts");
const { GAME_FACTS } = game;
const versions = await load("../src/data/game-version.ts", { "./releases": releases });
const help = helpPath
  ? await loadTsModule(pathToFileURL(resolve(helpPath)))
  : await load("../src/data/install-help.ts");
const component = await load("../src/components/download-panel.tsx", {
  "@/components/download-shine": shine,
  "@/data/releases": releases,
  "@/data/game": { GAME_FACTS },
  "@/data/install-help": help,
  "next/link": { __esModule: true, default: (props) => createElement("a", props) },
});
const panel = renderToStaticMarkup(createElement(component.DownloadPanel));
const downloads = releases.BUILDS.filter((build) => releases.downloadUrl(build));
assert.deepEqual(downloads.map((build) => build.id).sort(), ["android", "linux", "macos", "windows"]);
const latestDesktop = downloads.filter((build) => ["windows", "macos"].includes(build.id));
const latestBuild = latestDesktop[0].build;
assert.ok(Number.isSafeInteger(latestBuild) && latestBuild >= 2026102801);
assert.ok(latestDesktop.every((build) => build.version === GAME_FACTS.version && build.build === latestBuild),
  "Windows and macOS share the current release while retained platforms keep their accepted packages");
assert.equal(GAME_FACTS.protocol, 30);
assert.equal(GAME_FACTS.version, "2026.10.30-R23");
assert.equal(latestBuild, 2026103001);
assert.equal(releases.RELEASE_NOTES[0].version, GAME_FACTS.version);
const latestNotes = releases.RELEASE_NOTES[0].changes.join("\n");
assert.ok(latestNotes.includes("Windows／macOS／Android 提供 R23") && latestNotes.includes("Linux 保留 R19"),
  "Latest R23 news reflects Android's update while preserving Linux's offline R19 status");
assert.ok(!latestNotes.includes("Linux／Android 保留 R19") && !latestNotes.includes("Linux and Android remain on R19"),
  "Latest news cannot retain the obsolete shared Linux/Android R19 announcement");
assert.ok(panel.includes('id="download"') && panel.includes('id="download-windows"'), "Existing download anchors remain available");
assert.ok(!panel.includes("itch.io 備用頁") && !/href="https:\/\/wuharry\.itch\.io/.test(panel), "Unverified older itch packages are not offered");
assert.ok(panel.includes("新手教學") && panel.includes("60 張起始牌組") && !panel.includes("引導練習"), "R15 onboarding does not depend on the old install-help paragraph");
assert.ok(panel.includes("Read the built-in rulebook while it downloads") && panel.includes("下載時可以先看內建說明書"), "The waiting-time activity is visible in both languages");
assert.ok(panel.includes("同一版素材下載完成後，下次不用重載") && panel.includes("same version stays cached"), "Cache explanation is scoped to the same content version");
assert.ok(!/href="[^"]+\.pck"/.test(panel) && !panel.includes("protocol"), "Players are not asked to open raw content packs or interpret protocol numbers");
for (const build of downloads) {
  assert.equal(build.delivery, "streamed");
  if (build.id === "linux") {
    assert.equal(build.version, "2026.10.25-R19", `${build.id} remains on its accepted R19 package`);
    assert.equal(build.build, 2026102501);
    assert.equal(build.minimumBuild, 2026102101, `${build.id} keeps the online gate its R19 package shipped with`);
    assert.equal(build.protocol, 28);
    assert.ok(build.note.includes("僅支援離線遊玩") && build.noteEn.includes("offline-only"),
      `${build.id} clearly explains that its retained R19 package cannot join current online matches`);
  } else {
    assert.equal(build.version, GAME_FACTS.version, `${build.id} offers the current R23 release`);
    assert.equal(build.build, latestBuild);
    assert.equal(build.minimumBuild, latestBuild, `${build.id} matches the current official online compatibility gate`);
    assert.equal(build.protocol, GAME_FACTS.protocol);
  }
  assert.equal(build.size, `${(build.bytes / 1024 ** 2).toFixed(1)} MiB`);
  assert.ok(Number.isSafeInteger(build.content.bytes) && build.content.bytes > 0);
  assert.match(build.content.sha256, /^[a-f0-9]{64}$/);
  assert.equal(build.content.url, `${build.releaseBase ?? releases.RELEASE_BASE}/${build.content.filename}`);
  const websiteUrl = build.id === "android" ? `/downloads/android/${build.sha256}/${build.file}` : releases.downloadUrl(build);
  assert.equal(releases.websiteDownloadUrl(build), websiteUrl);
  assert.ok(panel.includes(`href="${websiteUrl}" download="${build.file}"`), `${build.id} directly downloads its exact package`);
  if (build.downloadNotice) {
    const card = panel.slice(panel.indexOf(`id="download-${build.id}"`));
    for (const notice of Object.values(build.downloadNotice)) {
      assert.ok(card.indexOf(notice) >= 0 && card.indexOf(notice) < card.indexOf(`href="${websiteUrl}"`),
        `${build.id} shows its platform limitation before the download action`);
    }
  }
  assert.ok(build.file.endsWith(build.id === "android" ? ".apk" : ".zip"));
  assert.equal(releases.downloadMirrorPageUrl(build), null);
}
const macos = downloads.find((build) => build.id === "macos");
assert.ok(macos.note.includes("本版尚未完成 macOS 實機驗證")
  && macos.noteEn.includes("Native macOS testing has not been run for this release"),
"R23 macOS download preserves its native-testing limitation");
const android = downloads.find((build) => build.id === "android");
assert.ok(android.downloadNotice?.zh.includes("Android") && /(?:尚未|未).*實機驗證/.test(android.downloadNotice.zh)
  && android.downloadNotice?.en.includes("Android") && /(?:not been run|not been tested|untested)/i.test(android.downloadNotice.en),
"R23 Android clearly discloses this APK's native NOT RUN status before download");
assert.ok(!/(?:僅支援離線|offline-only|cannot join R23)/i.test(`${android.note} ${android.noteEn} ${android.downloadNotice.zh} ${android.downloadNotice.en}`),
  "Android R23 must not inherit the retained R19 offline restriction");
assert.equal((panel.match(/首次另下載約 /g) ?? []).length, 4);
assert.equal((panel.match(/First launch adds about /g) ?? []).length, 4);
assert.equal((panel.match(/程式 ZIP · Game ZIP/g) ?? []).length, 3);
assert.equal((panel.match(/程式 APK · Game APK/g) ?? []).length, 1);
const update = versions.versionManifest();
assert.equal(update.schema_version, 1);
for (const build of downloads) {
  assert.equal(update.platforms[build.id].download_url, releases.downloadUrl(build));
  assert.equal(update.platforms[build.id].bytes, build.bytes, "Update byte count identifies the ZIP, not the content pack");
}
assert.ok(Buffer.byteLength(JSON.stringify(update), "utf8") < 16 * 1024, "Game update response remains within the existing client limit");
assert.ok(/href="[^"]+\.apk"/.test(panel), "Android preview offers the final APK");

// The guide must describe the same draw-loss boundary and starter route as R15.
const deckRule = game.RESOURCE_RULES.find((rule) => rule.label === "Deck");
assert.ok(deckRule.note.includes("最後一張不會落敗") && deckRule.note.includes("再要抽牌時落敗"), "An empty deck loses only on a required draw, not when its last card is taken");
const starter = game.COLLECTION_FEATURES.find((rule) => rule.label === "Tutorial starter");
assert.ok(starter?.value === "60 張" && starter.note.includes("直接對戰") && starter.note.includes("不扣新手抽卡額度"), "The tutorial starter is separate from free draws and ready to play");
const collection = await readFile(new URL("../src/components/collection-panel.tsx", import.meta.url), "utf8");
const guide = await readFile(new URL("../src/app/guide/page.tsx", import.meta.url), "utf8");
assert.ok(!collection.includes("湊滿") && !collection.includes("引導練習") && collection.includes("起始牌組") && collection.includes("新手教學"), "The guide no longer presents free draws as the starting gate or uses the old tutorial name");
assert.ok(collection.includes('mediaCaptureCaption("/media/screens/main-menu.webp")'), "Menu screenshot caption comes from actual capture provenance, not the current download version");
assert.ok(guide.includes("60 張起始牌組") && guide.includes("八章圖解說明書") && !guide.includes("八章圖解的「新手教學」"), "The guided tutorial and bundled illustrated rulebook are distinct");

async function pinnedManifest(path, filename, expectedSha256) {
  const name = basename(resolve(path));
  assert.ok(name === filename || (filename === "release.json" && name === "base-release.json"),
    "Compare only the named public release manifest or its fixed base-release.json evidence copy");
  const info = await lstat(path);
  assert.ok(info.isFile() && !info.isSymbolicLink() && info.size > 0 && info.size <= 2 * 1024 ** 2,
    "Release metadata is a bounded regular file");
  const bytes = await readFile(path);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedSha256, `${filename} matches its fixed SHA-256 pin`);
  return JSON.parse(bytes.toString("utf8"));
}

function matchesArtifact(build, artifact) {
  assert.ok(artifact, `${build.id} has a final packaged artifact in its own manifest`);
  assert.equal(build.file, artifact.filename);
  assert.equal(build.bytes, artifact.bytes);
  assert.equal(build.sha256, artifact.sha256);
  assert.deepEqual(build.content, artifact.content);
}

async function verifyArtifact(directory, artifact) {
  assert.match(artifact.filename, /^[A-Za-z0-9][A-Za-z0-9._-]{0,179}$/);
  assert.match(artifact.sha256, /^[a-f0-9]{64}$/);
  assert.ok(Number.isSafeInteger(artifact.bytes) && artifact.bytes > 0);
  const path = resolve(directory, artifact.filename);
  const before = await lstat(path);
  assert.ok(before.isFile() && !before.isSymbolicLink(), "Final artifact is a regular nonsymlink file");
  assert.equal(before.size, artifact.bytes, `${artifact.filename} actual bytes match the fixed manifest`);
  const hash = createHash("sha256");
  for await (const block of createReadStream(path)) hash.update(block);
  const after = await lstat(path);
  assert.equal(after.size, before.size, "Artifact size remained stable during verification");
  assert.equal(after.mtimeMs, before.mtimeMs, "Artifact remained unchanged during verification");
  assert.equal(hash.digest("hex"), artifact.sha256, `${artifact.filename} actual SHA-256 matches the fixed manifest`);
}

if (releasePath) {
  const final = await pinnedManifest(releasePath, "release.json", originalManifestSha256);
  assert.equal(final.version, GAME_FACTS.version);
  assert.equal(final.build, latestBuild);
  assert.equal(final.protocol, GAME_FACTS.protocol);
  assert.equal(final.delivery, "streamed");
  assert.deepEqual(final.artifacts.map((item) => item.platform).sort(), ["macos", "windows"], "Original R23 desktop manifest remains unchanged");
  for (const build of latestDesktop) {
    const artifact = final.artifacts.find((item) => item.platform === build.id);
    matchesArtifact(build, artifact);
  }
}
if (androidReleasePath) {
  const supplement = await pinnedManifest(androidReleasePath, "release-android.json", androidReleaseSha256);
  assert.equal(supplement.schema, "paper-raven-platform-supplement/v1");
  assert.equal(supplement.version, GAME_FACTS.version);
  assert.equal(supplement.build, latestBuild);
  assert.equal(supplement.minimum_build, latestBuild);
  assert.equal(supplement.protocol, GAME_FACTS.protocol);
  assert.equal(supplement.source_revision, "c7f3146c50e9e40b99b0b55b989289fa8d6a0f88");
  assert.equal(supplement.tag, "v2026.10.30-r23");
  assert.equal(supplement.delivery, "streamed");
  assert.equal(supplement.protection_mode, "encrypted");
  assert.equal(supplement.supplements.manifest_filename, "release.json");
  assert.equal(supplement.supplements.manifest_sha256, originalManifestSha256);
  assert.equal(supplement.supplements.existing_artifacts_modified, false);
  assert.deepEqual(supplement.artifacts.map((item) => item.platform), ["android"], "This supplement only changes Android");
  const artifact = supplement.artifacts[0];
  matchesArtifact(android, artifact);
  assert.deepEqual([...supplement.public_asset_allowlist].sort(), [artifact.filename, artifact.content.filename,
    "release-android.json", "SHA256SUMS-android"].sort(), "Android supplement contains only its four approved public files");
  const checksums = await readFile(resolve(dirname(androidReleasePath), "SHA256SUMS-android"), "utf8");
  assert.equal(checksums, [artifact, artifact.content].map((item) => `${item.sha256}  ${item.filename}\n`).join(""),
    "Android supplemental checksum list matches the actual pinned APK and content");
  for (const file of [artifact, artifact.content]) {
    await verifyArtifact(dirname(resolve(androidReleasePath)), file);
  }
}
console.log(`PASS streamed downloads: Windows/macOS/Android R23, retained Linux R19 offline, separate content sizes and explicit native limitations, schema1/${Buffer.byteLength(JSON.stringify(update), "utf8")} bytes${releasePath ? "; original desktop release.json SHA/pins matched" : ""}${androidReleasePath ? "; Android supplement SHA and real APK/content bytes matched" : ""}${helpPath ? "; exported HEAD install-help matched" : ""}`);
