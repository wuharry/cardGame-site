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
check(releases.websiteDownloadUrl(mirror) === canonical, "Configured mirror cannot replace the direct main download");
check(releases.downloadMirrorPageUrl(mirror) === mirrorUrl, "Validated official itch page remains a separate backup");
check(releases.downloadUrl(mirror) === canonical, "Mirror cannot replace the canonical GitHub source");
check(releases.releasePageUrl(mirror) === releases.releasePageUrl(fixture), "Release page remains the same GitHub version");
check(JSON.stringify(versions.versionManifest([mirror])) === JSON.stringify(versions.versionManifest([fixture])), "Version API metadata and client-trusted URL stay unchanged");
check(releases.downloadMirrorPageUrl({ ...mirror, mirrorProvider: undefined }) === null, "Provider must be explicitly configured for a mirror page");

for (const mirrorPageUrl of ["", "not a URL", "/relative", "http://wuharry.itch.io/project", "javascript:alert(1)", "file:///project", "https://user:password@wuharry.itch.io/project", "https://wuharry.itch.io/project?token=secret", "https://wuharry.itch.io/project#fragment", "https://wuharry.itch.io/", "https://other-user.itch.io/project", "https://wuharry.itch.io.attacker.invalid/project", "https://wuharry.itch.io/project/file.zip", "https://cdn.itch.io/signed-package.zip?expires=1"]) {
  check(releases.websiteDownloadUrl({ ...mirror, mirrorPageUrl }) === canonical, "Invalid or nonofficial mirror page retains GitHub: " + mirrorPageUrl);
  check(releases.downloadMirrorPageUrl({ ...mirror, mirrorPageUrl }) === null, "Invalid or nonofficial page cannot become a backup");
}
for (const status of ["planned", "preparing", "suspended"]) {
  check(releases.websiteDownloadUrl({ ...mirror, status }) === null, status + " build cannot expose a mirror download");
  check(releases.downloadMirrorPageUrl({ ...mirror, status }) === null, status + " build cannot expose a backup page");
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
check(panel.includes(`href="${canonical}" download="${fixture.file}"`), "Main website action downloads the exact platform ZIP");
check(panel.includes(`href="${mirrorDownloadUrl}" target="_blank" rel="noopener noreferrer"`), "Optional itch backup opens separately, preserving the on-site help");
check(panel.includes("itch.io 備用頁") && panel.includes(fixture.file), "Backup explains which exact file to select");
check(panel.indexOf(`href="${canonical}"`) < panel.indexOf(`href="${mirrorDownloadUrl}"`), "Canonical ZIP precedes the optional backup");
check(panel.includes("完整解壓縮 → TwilightCodex.exe") && panel.includes("Extract all → TwilightCodex.exe") && panel.indexOf("完整解壓縮 → TwilightCodex.exe") < panel.indexOf("<details"), "Short bilingual first step is visible before disclosures");
check(panel.includes("無法開啟？") && panel.indexOf(installHelp.installationHelp(fixture)[0].body) > panel.indexOf("<details"), "Full installation help stays inside the troubleshooting disclosure");
check(panel.includes(`href="${releases.releasePageUrl(fixture)}"`), "GitHub version page remains available");
const fallback = await renderPanel([fixture]);
check(fallback.includes(`href="${canonical}"`) && !fallback.includes(mirrorUrl) && !fallback.includes("itch.io 備用頁"), "Unconfigured main action uses GitHub without a placeholder backup");
const unavailable = await renderPanel([{ ...mirror, status: "suspended" }]);
check(!unavailable.includes(`href="${mirrorUrl}"`) && !unavailable.includes(`href="${canonical}"`), "Suspension disables both download sources");
const android = releases.BUILDS.find((build) => build.id === "android");
check(releases.websiteDownloadUrl({ ...android, status: "suspended", mirrorProvider: mirror.mirrorProvider, mirrorPageUrl: mirrorUrl }) === null, "Suspended Android cannot be bypassed by mirror metadata");
check(releases.downloadMirrorPageUrl({ ...android, status: "suspended", mirrorProvider: mirror.mirrorProvider, mirrorPageUrl: mirrorUrl }) === null, "Android suspension also blocks backup page links");

const chineseSummary = "繁體中文版本摘要測試。";
const englishSummary = "English release summary fixture.";
const bilingual = await renderPanel([{ ...fixture, note: chineseSummary, noteEn: englishSummary }]);
check(/<p\b[^>]*lang="zh-Hant"[^>]*>繁體中文版本摘要測試。<\/p>/.test(bilingual), "Chinese release summary is rendered with its language");
check(/<p\b[^>]*lang="en"[^>]*>English release summary fixture\.<\/p>/.test(bilingual), "English release summary is visible content, not only manifest data");
check(bilingual.includes("紙鴉牌 · Deckmarch") && bilingual.includes("Release notes"), "Bilingual notes show the current paper-raven brand");
const englishOnly = await renderPanel([{ ...fixture, note: undefined, noteEn: englishSummary }]);
check(englishOnly.includes(englishSummary) && englishOnly.includes("版本說明與驗收範圍"), "English-only metadata remains readable without a Chinese placeholder");
const chineseOnly = await renderPanel([{ ...fixture, note: chineseSummary, noteEn: undefined }]);
check(chineseOnly.includes(chineseSummary) && !/<p\b[^>]*lang="en"[^>]*>\s*<\/p>/.test(chineseOnly), "Missing English metadata does not create an empty paragraph");
const noSummary = await renderPanel([{ ...fixture, note: undefined, noteEn: undefined }]);
check(!noSummary.includes("版本說明與驗收範圍"), "No empty release-notes disclosure is generated");

const mixedBuilds = releases.BUILDS.map((build) => ({
  ...build,
  mirrorProvider: build.id === "windows" ? "itch.io" : undefined,
  mirrorPageUrl: build.id === "windows" ? mirrorUrl : undefined,
}));
const mixed = await renderPanel(mixedBuilds);
check((mixed.match(/itch\.io 備用頁/g) ?? []).length === 1, "Mixed-platform release only exposes its configured backup");
check(mixed.includes(`href="${mirrorDownloadUrl}"`), "Mixed-platform Windows backup reaches the itch page");
for (const id of ["macos", "linux"]) {
  const build = mixedBuilds.find((item) => item.id === id);
  const platform = await renderPanel([build]);
  check(platform.includes(`href="${releases.downloadUrl(build)}"`) && !platform.includes("itch.io 備用頁"), `${id} keeps GitHub primary without another platform's backup`);
}
check(JSON.stringify(versions.versionManifest(mixedBuilds)) === JSON.stringify(versions.versionManifest(mixedBuilds.map((build) => ({ ...build, mirrorProvider: undefined, mirrorPageUrl: undefined })))), "Mixed-platform website routing cannot change the canonical game update API");

const published = await renderPanel(releases.BUILDS);
check((published.match(/itch\.io 備用頁/g) ?? []).length === 0, "Unverified itch packages remain disabled");
check((published.match(/Download from GitHub/g) ?? []).length === 3 && (published.match(/Download from this site/g) ?? []).length === 1,
  "Desktop packages use GitHub; Android's primary APK is served by the website");
for (const id of ["windows", "macos", "linux"]) {
  const build = releases.BUILDS.find((item) => item.id === id);
  const platform = await renderPanel([build]);
  check(releases.websiteDownloadUrl(build) === releases.downloadUrl(build), `${id} starts its exact GitHub ZIP from the website`);
  check(releases.downloadMirrorPageUrl(build) === null, `${id} has no unverified backup`);
  check(!platform.includes('href="https://wuharry.itch.io/deckmarch#download"') && platform.includes(build.file), `${id} cannot send players to an old-version itch download`);
  check(platform.includes(`href="${releases.downloadUrl(build)}"`) && platform.includes(`下載 ${build.platform} ZIP`), `${id} retains the same-file GitHub main download`);
  const visible = platform.slice(0, platform.indexOf("<details"));
  const entry = id === "windows" ? "TwilightCodex.exe" : id === "macos" ? `${build.displayName}.app` : "launch.sh";
  check(visible.includes(entry) && !visible.includes(installHelp.installationHelp(build)[0].body), `${id} shows its short entry step and keeps the long help collapsed`);
}
const staticApk = `/downloads/android/${android.sha256}/${android.file}`;
check(releases.websiteDownloadUrl(android) === staticApk && published.includes(`href="${staticApk}" download="${android.file}"`), "Android's primary download identifies the exact APK hash and filename");
check(published.includes(`href="${releases.downloadUrl(android)}" download="${android.file}"`) && published.includes("GitHub 備用下載（同一份 APK）"), "Android retains the canonical same-file fallback");
check(published.indexOf(`href="${staticApk}"`) < published.indexOf(`href="${releases.downloadUrl(android)}"`), "The static APK precedes the GitHub fallback");
check(JSON.stringify(versions.versionManifest(releases.BUILDS)) === JSON.stringify(versions.versionManifest(releases.BUILDS.map((build) => ({ ...build, mirrorProvider: undefined, mirrorPageUrl: undefined })))), "Published desktop mirrors leave all canonical update metadata unchanged");

console.log(`PASS download mirror and bilingual notes: ${checks} checks for main/backup links, bilingual summaries, unavailable builds and unchanged game update API`);
