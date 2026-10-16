import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

async function load(file, imports = {}) {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const dependencies = { "react/jsx-runtime": jsxRuntime, ...imports };
  new Function("require", "exports", compiled)((name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
    return dependencies[name];
  }, exports);
  return exports;
}

// TypeScript 6 always emits esModuleInterop helpers, so the mock must declare itself an ES module.
const link = { __esModule: true, default: (props) => createElement("a", props) };
const releases = await load("../src/data/releases.ts");
const game = await load("../src/data/game.ts");
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks += 1; }

async function renderPanel(builds) {
  const component = await load("../src/components/download-panel.tsx", {
    "@/data/releases": { ...releases, BUILDS: builds }, "next/link": link, "@/data/game": game,
  });
  return renderToStaticMarkup(createElement(component.DownloadPanel));
}
async function renderGuide(builds) {
  const component = await load("../src/app/install/android/page.tsx", {
    "@/data/releases": { ...releases, BUILDS: builds }, "next/link": link,
    "@/data/seo": { pageMetadata: () => ({}) },
  });
  return renderToStaticMarkup(createElement(component.default));
}

const current = releases.BUILDS.find((build) => build.id === "android");
check(Boolean(current && (current.status !== "available" || releases.downloadUrl(current))), "Actual available Android metadata must provide a verified download");
if (current.status !== "available") {
  const currentPanel = await renderPanel(releases.BUILDS);
  const currentGuide = await renderGuide(releases.BUILDS);
  check(!/href="[^"]+\.apk"/.test(currentPanel + currentGuide) && !currentPanel.includes('href="/install/android"'), "Actual unavailable Android metadata offers no APK link or install flow");
  check(/<button\b[^>]*disabled/.test(currentPanel) && currentPanel.includes("下載 Android APK"), "Unavailable Android download button is visibly disabled");
  check(currentPanel.includes("Galaxy S24 FE") && currentGuide.includes("Galaxy S24 FE"), "Current Android gate names the pending actual-device acceptance");
}

// 可下載流程用 available fixture 驗證，不受目前是否暫停下載影響。
const actual = { ...current, status: "available" };
const publishedBuilds = releases.BUILDS.map((build) => build.id === "android" ? actual : build);
const panel = await renderPanel(publishedBuilds);
check(/<a\b[^>]*href="[^"]+\.apk"[^>]*>[\s\S]*?下載 Android APK/.test(panel), "Android download action explicitly says APK");
check(panel.includes('href="/install/android"'), "Android card has a prominent installation guide");
check(panel.includes("下載完成後") && panel.includes("Downloads") && panel.includes(actual.file), "Instructions locate the actual downloaded APK before and after clicking");
check(panel.includes(`href="${releases.downloadUrl(actual)}"`), "Android card preserves the exact official direct asset URL");
check(panel.includes("版本說明與驗收範圍") && panel.includes(actual.note), "Dense version notes remain available under an explicit disclosure");

const guide = await renderGuide(publishedBuilds);
check(guide.includes(`找到「${actual.displayName}」`), "Install guide identifies the actual package name after a site rebrand");
const oldBrandPanel = await renderPanel([{ ...actual, displayName: "王牌戰線", version: "fixture-legacy" }]);
check(oldBrandPanel.includes("紙鴉牌 Deckmarch") && oldBrandPanel.includes("fixture-legacy（王牌戰線）"), "Download notice distinguishes current site branding from unchanged package branding");
const currentBrandPanel = await renderPanel([{ ...actual, displayName: game.GAME_FACTS.nameZh }]);
check(!currentBrandPanel.includes("玩家包仍使用舊名稱"), "A future package with the current brand does not show an obsolete rebrand warning");
for (const value of [actual.file, actual.version, actual.size, actual.requirement]) {
  check(guide.includes(value), "Guide uses current shared release metadata: " + value);
}
check(guide.includes(`href="${releases.downloadUrl(actual)}"`), "Guide download uses the same official direct URL");
check(guide.includes("只有下載完成，沒有安裝視窗"), "No-popup symptom is separated from installation rejection");
check(guide.includes("已看到安裝視窗，但顯示錯誤"), "Installer errors have a separate recovery path");
check(guide.includes("不要關閉 Play 安全防護") && guide.includes("不要先解除安裝"), "Guidance preserves protection and existing player data");
check(guide.includes("無法替你確認下載完成或自動安裝"), "Website makes no false completion or installation claim");

const future = { ...actual, version: "fixture-next", file: "TwilightCodex-Android-fixture-next.apk", size: "fixture-size", requirement: "fixture-requirement", releaseBase: "https://example.invalid/fixture" };
const changed = await renderGuide([future]);
for (const value of [future.file, future.version, future.size, future.requirement, releases.downloadUrl(future)]) {
  check(changed.includes(value), "Future metadata reaches guide without hardcoded R9 data: " + value);
}
check(!changed.includes(actual.file), "Guide does not retain the old release filename");

for (const status of ["planned", "preparing", "suspended"]) {
  const unavailable = { ...future, status, note: "fixture-suspension-reason" };
  const page = await renderGuide([unavailable]);
  const card = await renderPanel([unavailable]);
  check(!page.includes(`href="${releases.downloadUrl(future)}"`) && !card.includes(`href="${releases.downloadUrl(future)}"`) && !card.includes('href="/install/android"'), status + " Android build cannot offer a download or active card installation flow");
  if (status === "suspended") {
    check(page.includes("Android APK 暫停下載") && page.includes(unavailable.note), "suspended guide shows the pause and its reason");
    check(card.includes("暫停下載") && card.includes(unavailable.note), "suspended card shows the pause and its reason");
  } else {
    check(page.includes("目前尚未提供可下載的 Android APK"), status + " guide shows unavailable status clearly");
  }
}
const desktop = await renderPanel(releases.BUILDS.filter((build) => build.id !== "android"));
check(!desktop.includes('href="/install/android"') && !desktop.includes("下載 Android APK"), "Desktop-only panel has no Android installation action");

console.log(`PASS Android install guide: ${checks} checks for direct links, actual/future metadata, no-popup/error guidance and unavailable-platform gating`);
