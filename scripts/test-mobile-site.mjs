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
  await page.getByRole("button", { name: "開啟導覽選單" }).click();
  assert(await page.getByRole("navigation", { name: "手機導覽" }).isVisible());
  await page.getByRole("button", { name: "關閉導覽選單" }).click();
  await page.getByRole("button", { name: /冰原/ }).click();
  assert((await page.locator("#arena-preview img").getAttribute("src")).includes("arena-frostlands"));
  assert(await page.getByRole("button", { name: /^下載 Android APK/ }).isDisabled());
  for (const viewport of [{ width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    console.log("PASS responsive", JSON.stringify(viewport));
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(externalFonts, []);
  console.log("PASS mobile navigation, gallery switching, APK gate and no runtime errors");
} finally { await browser.close(); }
