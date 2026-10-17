import { strict as assert } from "node:assert";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const load = (file, imports) => loadTsModule(new URL(file, import.meta.url), imports);

const releases = await load("../src/data/releases.ts");
const versions = await load("../src/data/game-version.ts", { "./releases": releases });
const game = await load("../src/data/game.ts");
const installHelp = await load("../src/data/install-help.ts");
const fixture = {
  ...releases.BUILDS.find((build) => build.id === "windows"),
  mirrorProvider: undefined,
  mirrorPageUrl: undefined,
};
const canonical = releases.downloadUrl(fixture);
const mirror = { ...fixture, mirrorProvider: "itch.io", mirrorPageUrl: "https://wuharry.itch.io/fixture-build" };
const mirrorUrl = mirror.mirrorPageUrl;
const mirrorDownloadUrl = `${mirrorUrl}#download`;
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks += 1; }

check(releases.websiteDownloadUrl(fixture) === canonical, "Unconfigured website download remains GitHub");
check(releases.websiteDownloadUrl(mirror) === mirrorUrl, "Configured mirror opens the stable official itch.io project page");
check(releases.downloadUrl(mirror) === canonical, "Mirror cannot replace the canonical GitHub source");
check(releases.releasePageUrl(mirror) === releases.releasePageUrl(fixture), "Release page remains the same GitHub version");
check(JSON.stringify(versions.versionManifest([mirror])) === JSON.stringify(versions.versionManifest([fixture])), "Version API metadata and client-trusted URL stay unchanged");
check(releases.websiteDownloadUrl({ ...mirror, mirrorProvider: undefined }) === canonical, "Provider must be explicitly configured for a mirror page");

for (const mirrorPageUrl of ["", "not a URL", "/relative", "http://wuharry.itch.io/project", "javascript:alert(1)", "file:///project", "https://user:password@wuharry.itch.io/project", "https://wuharry.itch.io/project?token=secret", "https://wuharry.itch.io/project#fragment", "https://wuharry.itch.io/", "https://other-user.itch.io/project", "https://wuharry.itch.io.attacker.invalid/project", "https://wuharry.itch.io/project/file.zip", "https://cdn.itch.io/signed-package.zip?expires=1"]) {
  check(releases.websiteDownloadUrl({ ...mirror, mirrorPageUrl }) === canonical, "Invalid or nonofficial mirror page retains GitHub: " + mirrorPageUrl);
}
for (const status of ["planned", "preparing", "suspended"]) {
  check(releases.websiteDownloadUrl({ ...mirror, status }) === null, status + " build cannot expose a mirror download");
}
check(releases.websiteDownloadUrl({ ...mirror, file: null }) === null, "Missing artifact cannot expose a mirror download");

async function renderPanel(builds) {
  const component = await load("../src/components/download-panel.tsx", {
    "@/data/releases": { ...releases, BUILDS: builds },
    "next/link": { __esModule: true, default: (props) => createElement("a", props) },
    "@/data/game": game,
    "@/data/install-help": installHelp,
  });
  return renderToStaticMarkup(createElement(component.DownloadPanel));
}
const panel = await renderPanel([mirror]);
check(panel.includes(`href="${mirrorDownloadUrl}"`), "Main website action opens the validated project download section");
check(panel.includes("前往 itch.io 下載") && panel.includes(`請選擇 ${fixture.platform} 版`) && panel.includes(fixture.file), "Project-page action explains the platform and exact file to select");
check(panel.includes(`href="${canonical}"`) && panel.includes("GitHub 備用下載"), "Same-file GitHub backup remains directly clickable");
check(panel.indexOf("GitHub 備用下載") < panel.indexOf("<details"), "GitHub backup is visible without opening a disclosure");
check(panel.includes(`href="${releases.releasePageUrl(fixture)}"`), "GitHub version page remains available");
const fallback = await renderPanel([fixture]);
check(fallback.includes(`href="${canonical}"`) && !fallback.includes(mirrorUrl) && !fallback.includes("前往 itch.io 下載") && !fallback.includes("GitHub 備用下載"), "Unconfigured main action uses GitHub once, without a placeholder URL or duplicate backup action");
const unavailable = await renderPanel([{ ...mirror, status: "suspended" }]);
check(!unavailable.includes(`href="${mirrorUrl}"`) && !unavailable.includes(`href="${canonical}"`), "Suspension disables both download sources");
const android = releases.BUILDS.find((build) => build.id === "android");
check(releases.websiteDownloadUrl({ ...android, mirrorProvider: mirror.mirrorProvider, mirrorPageUrl: mirrorUrl }) === null, "Current Android actual-device gate cannot be bypassed by mirror metadata");

const chineseSummary = "繁體中文版本摘要測試。";
const englishSummary = "English release summary fixture.";
const bilingual = await renderPanel([{ ...fixture, note: chineseSummary, noteEn: englishSummary }]);
check(/<p\b[^>]*lang="zh-Hant"[^>]*>繁體中文版本摘要測試。<\/p>/.test(bilingual), "Chinese release summary is rendered with its language");
check(/<p\b[^>]*lang="en"[^>]*>English release summary fixture\.<\/p>/.test(bilingual), "English release summary is visible content, not only manifest data");
check(bilingual.includes("紙鴉牌 · Deckmarch") && bilingual.includes("Release notes"), "Bilingual notes show the current paper-raven brand");
const englishOnly = await renderPanel([{ ...fixture, note: undefined, noteEn: englishSummary }]);
check(englishOnly.includes(englishSummary) && englishOnly.includes("版本說明與驗收範圍"), "English-only metadata remains readable without a Chinese placeholder");
const chineseOnly = await renderPanel([{ ...fixture, note: chineseSummary, noteEn: undefined }]);
check(chineseOnly.includes(chineseSummary) && !/<p\b[^>]*lang="en"/.test(chineseOnly), "Missing English metadata does not create an empty paragraph");
const noSummary = await renderPanel([{ ...fixture, note: undefined, noteEn: undefined }]);
check(!noSummary.includes("版本說明與驗收範圍"), "No empty release-notes disclosure is generated");

const mixedBuilds = releases.BUILDS.map((build) => ({
  ...build,
  mirrorProvider: build.id === "windows" ? "itch.io" : undefined,
  mirrorPageUrl: build.id === "windows" ? mirrorUrl : undefined,
}));
const mixed = await renderPanel(mixedBuilds);
check((mixed.match(/前往 itch\.io 下載/g) ?? []).length === 1 && (mixed.match(/GitHub 備用下載/g) ?? []).length === 1, "Mixed-platform release exposes one mirror action and one visible backup");
check(mixed.includes(`href="${mirrorDownloadUrl}"`), "Mixed-platform Windows action reaches itch download section");
for (const id of ["macos", "linux"]) {
  const build = mixedBuilds.find((item) => item.id === id);
  const platform = await renderPanel([build]);
  check(platform.includes(`href="${releases.downloadUrl(build)}"`) && !platform.includes("前往 itch.io 下載") && !platform.includes("GitHub 備用下載"), `${id} keeps GitHub primary without another platform's mirror or backup`);
}
check(JSON.stringify(versions.versionManifest(mixedBuilds)) === JSON.stringify(versions.versionManifest(mixedBuilds.map((build) => ({ ...build, mirrorProvider: undefined, mirrorPageUrl: undefined })))), "Mixed-platform website routing cannot change the canonical game update API");

console.log(`PASS download mirror and bilingual notes: ${checks} checks for main/backup links, bilingual summaries, unavailable builds and unchanged game update API`);
