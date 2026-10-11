import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
const OUT = process.argv[2] ?? "shots";
const W = Number(process.argv[3] ?? 1440);
const H = Number(process.argv[4] ?? 900);
const PREFIX = process.argv[5] ?? "sec";
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
for (const id of ["cards", "systems", "collection", "modes", "download", "changelog"]) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator(`#${id}`).screenshot({ path: `${OUT}/${PREFIX}-${id}.png` });
  console.log("shot", id);
}
// 戰場與陣容那段沒有 id，用截圖抓 figure 的祖父層
await page.evaluate(() => window.scrollTo(0, 0));
await browser.close();
