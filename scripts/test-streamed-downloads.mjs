import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTsModule } from "./lib/load-ts-module.mjs";

let releasePath;
let helpPath;
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--install-help") {
    helpPath = process.argv[++index];
    assert.ok(helpPath, "--install-help needs an exported HEAD source file");
  } else {
    assert.ok(!argument.startsWith("--") && !releasePath, "Supply one final release.json and optional --install-help source");
    releasePath = argument;
  }
}
const load = (file, imports) => loadTsModule(new URL(file, import.meta.url), imports);
const releases = await load("../src/data/releases.ts");
const game = await load("../src/data/game.ts");
const { GAME_FACTS } = game;
const versions = await load("../src/data/game-version.ts", { "./releases": releases });
const help = helpPath
  ? await loadTsModule(pathToFileURL(resolve(helpPath)))
  : await load("../src/data/install-help.ts");
const component = await load("../src/components/download-panel.tsx", {
  "@/data/releases": releases,
  "@/data/game": { GAME_FACTS },
  "@/data/install-help": help,
  "next/link": { __esModule: true, default: (props) => createElement("a", props) },
});
const panel = renderToStaticMarkup(createElement(component.DownloadPanel));
const desktops = releases.BUILDS.filter((build) => releases.downloadUrl(build));
assert.deepEqual(desktops.map((build) => build.id).sort(), ["linux", "macos", "windows"]);
assert.equal(GAME_FACTS.version, "2026.10.19-R15");
assert.equal(GAME_FACTS.protocol, 27);
assert.equal(releases.RELEASE_NOTES[0].version, GAME_FACTS.version);
assert.ok(panel.includes('id="download"') && panel.includes('id="download-windows"'), "Existing download anchors remain available");
assert.ok(!panel.includes("itch.io 備用頁") && !/href="https:\/\/wuharry\.itch\.io/.test(panel), "Unverified older itch packages are not offered");
assert.ok(panel.includes("新手教學") && panel.includes("60 張起始牌組") && !panel.includes("引導練習"), "R15 onboarding does not depend on the old install-help paragraph");
assert.ok(panel.includes("Read the built-in rulebook while it downloads") && panel.includes("下載時可以先看內建說明書"), "The waiting-time activity is visible in both languages");
assert.ok(panel.includes("同一版素材下載完成後，下次不用重載") && panel.includes("same version stays cached"), "Cache explanation is scoped to the same content version");
assert.ok(!/href="[^"]+\.pck"/.test(panel) && !panel.includes("protocol"), "Players are not asked to open raw content packs or interpret protocol numbers");
for (const build of desktops) {
  assert.equal(build.delivery, "streamed");
  assert.equal(build.version, "2026.10.19-R15");
  assert.equal(build.build, 2026101902);
  assert.equal(build.minimumBuild, 2026101902);
  assert.equal(build.protocol, 27);
  assert.equal(build.size, `${(build.bytes / 1024 ** 2).toFixed(1)} MiB`);
  assert.equal(build.content.bytes, 422201600);
  assert.match(build.content.sha256, /^[a-f0-9]{64}$/);
  assert.equal(build.content.url, `${releases.RELEASE_BASE}/${build.content.filename}`);
  assert.equal(releases.websiteDownloadUrl(build), releases.downloadUrl(build));
  assert.ok(panel.includes(`href="${releases.downloadUrl(build)}" download="${build.file}"`), `${build.id} directly downloads its exact ZIP`);
  assert.equal(releases.downloadMirrorPageUrl(build), null);
}
assert.equal((panel.match(/首次另下載約 422 MB/g) ?? []).length, 3);
assert.equal((panel.match(/First launch adds about 422 MB/g) ?? []).length, 3);
assert.equal((panel.match(/程式 ZIP · Game ZIP/g) ?? []).length, 3);
const update = versions.versionManifest();
assert.equal(update.schema_version, 1);
assert.equal(update.platforms.android, undefined);
for (const build of desktops) {
  assert.equal(update.platforms[build.id].download_url, releases.downloadUrl(build));
  assert.equal(update.platforms[build.id].bytes, build.bytes, "Update byte count identifies the ZIP, not the content pack");
}
assert.ok(Buffer.byteLength(JSON.stringify(update), "utf8") < 16 * 1024, "Game update response remains within the existing client limit");
assert.ok(!/href="[^"]+\.apk"/.test(panel), "Android remains unavailable");

// The guide must describe the same draw-loss boundary and starter route as R15.
const deckRule = game.RESOURCE_RULES.find((rule) => rule.label === "Deck");
assert.ok(deckRule.note.includes("最後一張不會落敗") && deckRule.note.includes("再要抽牌時落敗"), "An empty deck loses only on a required draw, not when its last card is taken");
const starter = game.COLLECTION_FEATURES.find((rule) => rule.label === "Tutorial starter");
assert.ok(starter?.value === "60 張" && starter.note.includes("直接對戰") && starter.note.includes("不扣新手抽卡額度"), "The tutorial starter is separate from free draws and ready to play");
const collection = await readFile(new URL("../src/components/collection-panel.tsx", import.meta.url), "utf8");
const guide = await readFile(new URL("../src/app/guide/page.tsx", import.meta.url), "utf8");
assert.ok(!collection.includes("湊滿") && !collection.includes("引導練習") && collection.includes("起始牌組") && collection.includes("新手教學"), "The guide no longer presents free draws as the starting gate or uses the old tutorial name");
assert.ok(collection.includes("舊版主選單截圖") && collection.includes('mediaCaptureCaption("/media/screens/main-menu.webp")'), "Historical screenshots keep their capture provenance and are labelled as historical");
assert.ok(guide.includes("60 張起始牌組") && guide.includes("八章圖解說明書") && !guide.includes("八章圖解的「新手教學」"), "The guided tutorial and bundled illustrated rulebook are distinct");

if (releasePath) {
  assert.equal(resolve(releasePath).split(/[\\/]/).at(-1), "release.json", "Compare with the final public manifest, never a private configuration");
  const final = JSON.parse(await readFile(releasePath, "utf8"));
  assert.equal(final.version, GAME_FACTS.version);
  assert.equal(final.build, 2026101902);
  assert.equal(final.protocol, GAME_FACTS.protocol);
  assert.equal(final.delivery, "streamed");
  for (const build of desktops) {
    const artifact = final.artifacts.find((item) => item.platform === build.id);
    assert.ok(artifact, `${build.id} has a final packaged artifact`);
    assert.equal(build.file, artifact.filename);
    assert.equal(build.bytes, artifact.bytes);
    assert.equal(build.sha256, artifact.sha256);
    assert.deepEqual(build.content, artifact.content);
  }
}
console.log(`PASS R15 streamed downloads: exact desktop ZIPs, separate content sizes, bilingual start/rulebook/cache guidance, no stale mirror, Android gate, schema1/${Buffer.byteLength(JSON.stringify(update), "utf8")} bytes${releasePath ? "; final release.json matched" : ""}${helpPath ? "; exported HEAD install-help matched" : ""}`);
