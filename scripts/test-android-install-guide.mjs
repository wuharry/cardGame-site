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

const link = { default: (props) => createElement("a", props) };
const releases = await load("../src/data/releases.ts");
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks += 1; }

async function renderPanel(builds) {
  const component = await load("../src/components/download-panel.tsx", {
    "@/data/releases": { ...releases, BUILDS: builds }, "next/link": link,
  });
  return renderToStaticMarkup(createElement(component.DownloadPanel));
}
async function renderGuide(builds) {
  const component = await load("../src/app/install/android/page.tsx", {
    "@/data/releases": { ...releases, BUILDS: builds }, "next/link": link,
  });
  return renderToStaticMarkup(createElement(component.default));
}

const actual = releases.BUILDS.find((build) => build.id === "android");
check(Boolean(actual && releases.downloadUrl(actual)), "Actual Android metadata must provide a verified download");
const panel = await renderPanel(releases.BUILDS);
check(/<a\b[^>]*href="[^"]+\.apk"[^>]*>[\s\S]*?下載 Android APK/.test(panel), "Android download action explicitly says APK");
check(panel.includes('href="/install/android"'), "Android card has a prominent installation guide");
check(panel.includes("下載完成後") && panel.includes("Downloads") && panel.includes(actual.file), "Instructions locate the actual downloaded APK before and after clicking");
check(panel.includes(`href="${releases.downloadUrl(actual)}"`), "Android card preserves the exact official direct asset URL");
check(panel.includes("版本說明與驗收範圍") && panel.includes(actual.note), "Dense version notes remain available under an explicit disclosure");

const guide = await renderGuide(releases.BUILDS);
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

for (const status of ["planned", "preparing"]) {
  const unavailable = { ...future, status };
  const page = await renderGuide([unavailable]);
  const card = await renderPanel([unavailable]);
  check(!page.includes(`href="${releases.downloadUrl(future)}"`) && !card.includes('href="/install/android"'), status + " Android build cannot offer a download or active card installation flow");
  check(page.includes("目前尚未提供可下載的 Android APK"), status + " guide shows unavailable status clearly");
}
const desktop = await renderPanel(releases.BUILDS.filter((build) => build.id !== "android"));
check(!desktop.includes('href="/install/android"') && !desktop.includes("下載 Android APK"), "Desktop-only panel has no Android installation action");

console.log(`PASS Android install guide: ${checks} checks for direct links, actual/future metadata, no-popup/error guidance and unavailable-platform gating`);
