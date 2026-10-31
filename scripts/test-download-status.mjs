import { strict as assert } from "node:assert";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTsModule } from "./lib/load-ts-module.mjs";
import { availableFixture } from "./lib/download-fixtures.mjs";

const load = (file, imports) => loadTsModule(new URL(file, import.meta.url), imports);
const shine = await loadTsModule(new URL("../src/components/download-shine.tsx", import.meta.url), {}, { allowNodeModules: true });
const arrow = await load("../src/components/arrow-relay.tsx");
const releases = await load("../src/data/releases.ts");
const game = await load("../src/data/game.ts");
const help = await load("../src/data/install-help.ts");
const link = { __esModule: true, default: ({ children, href, className }) => createElement("a", { href, className }, children) };
const image = { __esModule: true, default: ({ src, alt }) => createElement("img", { src, alt }) };
const render = (component) => renderToStaticMarkup(createElement(component));
const zh = "熱修中，近期發布";
const en = "Hotfix in progress, update coming soon";
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks += 1; }

async function views(builds) {
  const data = { ...releases, BUILDS: builds };
  const shared = { "@/data/releases": data, "@/data/game": game, "next/link": link,
    "@/components/download-shine": shine, "@/components/arrow-relay": arrow };
  const panel = await load("../src/components/download-panel.tsx", { ...shared, "@/data/install-help": help });
  const entry = await load("../src/components/entry-screen.tsx", {
    ...shared, "next/image": image, "@/data/media": { mediaUrl: (url) => url, mediaCaptureCaption: () => "Recorded capture" },
    "@/components/download-link": { DownloadLink: ({ children }) => createElement("a", { href: "/#download" }, children) },
  });
  const patches = await load("../src/components/patch-notes.tsx", { "@/data/releases": data });
  const news = await load("../src/app/news/page.tsx", {
    ...shared, "@/data/seo": { pageMetadata: () => ({}) },
    "@/components/site-header": { SiteHeader: () => null },
    "@/components/site-footer": { SiteFooter: () => null },
    "@/components/patch-notes": patches,
  });
  const latest = await load("../src/components/home-sections.tsx", {
    ...shared, "next/image": image, "@/data/site": { FEEDBACK_URL: "https://example.invalid/feedback" },
    "@/data/media": { mediaUrl: (url) => url, mediaCaptureCaption: () => "Recorded capture" },
    "@/components/screenshot-viewer": { ScreenshotViewer: () => null },
  });
  const android = await load("../src/app/install/android/page.tsx", { ...shared, "@/data/seo": { pageMetadata: () => ({}) } });
  return { panel: render(panel.DownloadPanel), entry: render(entry.EntryScreen), news: render(news.default),
    latest: render(latest.LatestNews), android: render(android.default) };
}

async function api(builds) {
  const versions = await load("../src/data/game-version.ts", { "./releases": { ...releases, BUILDS: builds } });
  const route = await load("../src/app/api/game-version/route.ts", { "@/data/game-version": versions });
  const response = route.GET();
  check(response.status === 200 && response.headers.get("cache-control") === "no-store", "Update endpoint stays usable and uncached");
  return response.json();
}

const mirrorUrl = "https://wuharry.itch.io/fixture-status";
// Retain valid ZIP/APK/content/mirror metadata while suspending every platform.
const suspended = releases.BUILDS.map((build) => ({ ...availableFixture(build), status: "suspended",
  hotfix: { since: "2000-01-01", note: `${zh}。測試公告。`, noteEn: `${en}. Test notice.` }, mirrorProvider: "itch.io", mirrorPageUrl: mirrorUrl,
}));
const paused = await views(suspended);
for (const [name, html] of Object.entries(paused)) {
  check(html.includes(zh) && html.includes(en), `${name} shows the current bilingual hotfix status`);
  check(!/https:\/\/(?:github\.com\/[^\s"<]+\/releases\/|wuharry\.itch\.io\/)/.test(html), `${name} leaks no old asset, release-page, content or mirror URL`);
}
check(/<button\b[^>]*disabled[^>]*>熱修中，近期發布/.test(paused.entry), "Hero download CTA is disabled during a full suspension");
check((paused.panel.match(/<button\b[^>]*disabled/g) ?? []).length === 4, "All platform download buttons are disabled");
check(!paused.panel.includes('href="/install/android"') && !paused.panel.includes("免費下載。"), "Full suspension offers no install action or immediate-download promise");
assert.deepEqual(await api(suspended), { schema_version: 1, platforms: {} });
assert.deepEqual(await api([]), { schema_version: 1, platforms: {} });
for (const build of suspended) {
  for (const getUrl of [releases.downloadUrl, releases.websiteDownloadUrl, releases.releasePageUrl, releases.downloadMirrorPageUrl]) {
    check(getUrl(build) === null, `${build.id} suspension blocks ${getUrl.name} despite retained metadata`);
  }
}

// Any single verified platform can resume, including Android, while the others stay suspended.
for (const selected of suspended) {
  const ready = { ...availableFixture(selected), hotfix: selected.hotfix, mirrorProvider: "itch.io", mirrorPageUrl: mirrorUrl };
  const builds = suspended.map((build) => build.id === selected.id ? ready : build);
  const active = await views(builds);
  const href = releases.downloadUrl(ready);
  check(active.panel.includes(`href="${href}"`) && active.panel.includes(`href="${mirrorUrl}#download"`), `${ready.id} alone can offer its exact fixture and verified mirror`);
  check(active.panel.includes(`href="${releases.releasePageUrl(ready)}"`), `${ready.id} restores only its own release-page link`);
  check(active.entry.includes('href="/#download"') && !/<button\b[^>]*disabled/.test(active.entry), `${ready.id} alone restores the homepage CTA`);
  const manifest = await api(builds);
  assert.deepEqual(Object.keys(manifest.platforms), [ready.id]);
  check(manifest.platforms[ready.id].download_url === href, `${ready.id} alone reaches the update API`);
  check(releases.buildStatusText(ready) === "可下載", "Historical hotfix metadata does not override available status");
  for (const other of builds.filter((build) => build.id !== ready.id)) {
    const oldUrl = releases.downloadUrl({ ...other, status: "available" });
    check(!Object.values(active).join("").includes(oldUrl), `${ready.id} does not re-enable ${other.id}`);
  }
  if (ready.id === "android") check(active.android.includes(`href="${href}"`) && active.panel.includes('href="/install/android"'), "Available Android restores both direct APK and installation guide");
}

const live = await views(releases.BUILDS);
const manifest = await api(releases.BUILDS);
assert.deepEqual(Object.keys(manifest.platforms).sort(), ["android", "linux", "macos", "windows"]);
check((live.panel.match(/<button\b[^>]*disabled/g) ?? []).length === 0, "Four verified platforms have available actions");
const allowed = new Set();
for (const build of releases.BUILDS) {
  const url = releases.downloadUrl(build);
  allowed.add(url); allowed.add(releases.releasePageUrl(build));
  if (build.id === "linux") {
    check(build.version === "2026.10.25-R19" && build.build === 2026102501,
      "Linux keeps its accepted R19 artifact while Android and desktop platforms update");
    check(build.protocol === 28 && build.minimumBuild === 2026102101,
      "Retained Linux metadata preserves its original compatibility gate");
    check(build.downloadNotice?.zh.includes("僅支援離線遊玩") && build.downloadNotice?.en.includes("Offline play only"),
      "Linux explicitly discloses that its R19 package remains offline-only");
  } else {
    check(build.version === game.GAME_FACTS.version && build.build === 2026103001 && build.minimumBuild === 2026103001
      && build.protocol === game.GAME_FACTS.protocol, `${build.id} offers the current R23 package and online compatibility gate`);
    if (build.id === "android") {
      check(build.downloadNotice?.zh.includes("Android") && /(?:尚未|未).*實機驗證/.test(build.downloadNotice.zh)
        && build.downloadNotice?.en.includes("Android") && /(?:not been run|not been tested|untested)/i.test(build.downloadNotice.en),
      "Android R23 clearly discloses native NOT RUN instead of inheriting the R19 offline restriction");
      check(!/(?:僅支援離線|offline-only|cannot join R23)/i.test(`${build.note} ${build.noteEn} ${build.downloadNotice.zh} ${build.downloadNotice.en}`),
        "Android R23 no longer presents its retired R19 offline-only warning");
    }
  }
  const websiteUrl = releases.websiteDownloadUrl(build);
  allowed.add(websiteUrl);
  check(live.panel.includes(`href="${websiteUrl}" download="${build.file}"`), `${build.id} offers its exact package from the configured primary source`);
}
check(live.panel.includes('href="/install/android"') && live.android.includes('.apk'), "Android installs the actual R23 APK");
for (const [name, html] of Object.entries(live)) {
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (/https:\/\/(?:github\.com\/[^\s"<]+\/releases\/|wuharry\.itch\.io\/)/.test(href)) {
      check(allowed.has(href), `${name} exposes only current accepted package or release links`);
    }
  }
}
console.log(`PASS download status: ${checks} checks for mixed platform releases, full suspension and single-platform recovery`);
