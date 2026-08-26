// 用本機 Chrome 對網站拍圖，驗證版面。用法：node scripts/shoot.mjs <outDir>
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const OUT = process.argv[2] ?? "shots";
const URL = "http://localhost:3100/";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

const shots = [
  { name: "desktop-full", w: 1440, h: 900, full: true },
  { name: "mobile-full", w: 390, h: 844, full: true },
];

for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: s.full });
  console.log("shot", s.name);
  await page.close();
}

// 捲動式戰場：拍每一步
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: "networkidle" });
const steps = await page.locator("li[data-step]").all();
for (let i = 0; i < steps.length; i++) {
  await steps[i].scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 1);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/lane-step-${i}.png` });
  console.log("shot lane step", i);
}
await page.close();

// 手機版戰場
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(URL, { waitUntil: "networkidle" });
const msteps = await m.locator("li[data-step]").all();
for (const i of [0, 4, 5]) {
  await msteps[i].scrollIntoViewIfNeeded();
  await m.waitForTimeout(900);
  await m.screenshot({ path: `${OUT}/mobile-lane-${i}.png` });
}
console.log("shot mobile lanes");
await m.close();

await browser.close();
