import { strict as assert } from "node:assert";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTsModule } from "./lib/load-ts-module.mjs";
import { availableFixture } from "./lib/download-fixtures.mjs";

const load = (file, imports) => loadTsModule(new URL(file, import.meta.url), imports);
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
  const shared = { "@/data/releases": data, "@/data/game": game, "next/link": link };
  const panel = await load("../src/components/download-panel.tsx", { ...shared, "@/data/install-help": help });
  const entry = await load("../src/components/entry-screen.tsx", {
    ...shared, "next/image": image, "@/data/media": { mediaUrl: (url) => url },
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
    "@/data/media": { mediaUrl: (url) => url },
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
for (const build of releases.BUILDS) {
  if (build.version === "2026.10.19-R15") check(build.status === "suspended", `${build.id} retains the R15 metadata without re-enabling that old release`);
  if (build.status === "available") continue;
  check(!manifest.platforms[build.id], `${build.id} retained metadata is absent from the live update API`);
  if (build.file) check(!Object.values(live).join("").includes(releases.downloadUrl({ ...build, status: "available" })), `${build.id} old download URL is absent from all live views`);
  check(!build.content?.url || !Object.values(live).join("").includes(build.content.url), `${build.id} retained content URL is absent from all live views`);
}
console.log(`PASS download status: ${checks} checks for all entrances, empty API, retained metadata and each single-platform recovery fixture`);
