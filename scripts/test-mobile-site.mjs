import { chromium } from "playwright-core";
import { strict as assert } from "node:assert";

const base = process.argv[2] ?? "http://localhost:3100";
const executablePath = process.env.CHROME_PATH ?? (process.platform === "darwin"
  ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  : "C:/Program Files/Google/Chrome/Application/chrome.exe");
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  // Font failure must never hide page content or break controls.
  await page.route("**/*.woff2", r => r.abort());
  const externalFonts = [];
  page.on("request", request => { if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalFonts.push(request.url()); });
  for (const path of ["/", "/guide", "/news", "/credits", "/install/android"]) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    assert(await page.locator("h1").isVisible(), `${path} content is visible without downloaded fonts`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} horizontal overflow`);
    console.log("PASS mobile 390×844", path, "content readable with unavailable fonts");
  }
  await page.goto(base + "/", { waitUntil: "networkidle" });
  assert(await page.evaluate(() => document.querySelectorAll('link[rel="preload"][as="font"]').length <= 1), "Only the display font may be globally preloaded");
  assert(await page.evaluate(() => document.querySelectorAll('link[rel="stylesheet"]').length === 0), "Cold first paint uses styles delivered with HTML");
  assert.equal(await page.locator(".hero-backdrop").getAttribute("fetchpriority"), "high");
  await page.getByRole("button", { name: "開啟導覽選單" }).click();
  assert(await page.getByRole("navigation", { name: "手機導覽" }).isVisible());
  await page.getByRole("button", { name: "關閉導覽選單" }).click();
  await page.getByRole("button", { name: /冰原/ }).click();
  assert((await page.locator("#arena-preview img").getAttribute("src")).includes("arena-frostlands"));
  assert(await page.getByRole("button", { name: /^下載 Android APK/ }).isDisabled());
  await page.getByRole("button", { name: /秘術/ }).click();
  assert.equal(await page.getByRole("button", { name: /秘術/ }).getAttribute("aria-pressed"), "true");
  // CSS inlining must also work after client navigation and back/forward.
  await page.getByRole("button", { name: "開啟導覽選單" }).click();
  await page.getByRole("navigation", { name: "手機導覽" }).getByRole("link", { name: "新手指南", exact: true }).click();
  await page.waitForURL("**/guide");
  assert(await page.locator(".subpage-heading h1").isVisible());
  assert.equal(await page.locator(".site-header").evaluate(el => getComputedStyle(el).position), "sticky");
  await page.getByRole("link", { name: "王牌戰線首頁", exact: true }).click();
  await page.waitForURL("**/#main-content");
  assert(await page.locator(".hero-copy h1").isVisible());
  await page.goBack(); await page.waitForURL("**/guide");
  assert.equal(await page.locator(".site-header").evaluate(el => getComputedStyle(el).position), "sticky");
  await page.goForward(); await page.waitForURL("**/#main-content");
  assert.equal(await page.locator(".site-header").evaluate(el => getComputedStyle(el).position), "sticky");
  for (const id of ["cards", "arenas", "download", "support"]) {
    await page.goto(`${base}/#${id}`, { waitUntil: "networkidle" });
    const target = await page.locator(`#${id} h2`).first().evaluate(el => {
      const rect = el.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom, viewport: innerHeight };
    });
    assert(target.bottom > 0 && target.top < target.viewport, `${id} deep link reveals the actual section heading`);
  }
  await page.goto(base + "/", { waitUntil: "networkidle" });
  for (const viewport of [{ width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    console.log("PASS responsive", JSON.stringify(viewport));
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(externalFonts, []);
  console.log("PASS mobile navigation/history, card and gallery switching, deep links, APK gate and no runtime errors");

  // Measure actual delivery in a fresh context, without the failure fixture.
  const normal = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await normal.goto(base + "/", { waitUntil: "networkidle" });
  const firstScreenFonts = await normal.evaluate(() => performance.getEntriesByType("resource")
    .filter(entry => entry.name.includes("noto-serif-tc-site-") && entry.name.endsWith(".woff2"))
    .map(entry => ({ name: entry.name, bytes: entry.encodedBodySize })));
  assert.equal(firstScreenFonts.length, 1, "First screen must not download the entire Chinese family");
  assert(firstScreenFonts[0].bytes > 0 && firstScreenFonts[0].bytes <= 120000, "First-screen Chinese font budget is 120 KB");
  await normal.locator("#support").scrollIntoViewIfNeeded();
  await normal.waitForLoadState("networkidle");
  await normal.evaluate(() => document.fonts.ready);
  assert(await normal.evaluate(() => document.fonts.check('500 40px "Noto Serif TC"', "下一場好對局，從你的回饋開始")), "Deferred sections retain the original Chinese typeface");
  assert(await normal.evaluate(() => performance.getEntriesByType("resource").filter(entry => entry.name.includes("noto-serif-tc-site-") && entry.name.endsWith(".woff2")).length > 1), "Scrolling loads the remaining original glyphs instead of dropping them");
  console.log("PASS cold first-screen font budget and original typeface after scrolling");
  await normal.close();
} finally { await browser.close(); }
