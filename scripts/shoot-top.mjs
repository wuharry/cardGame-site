import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
const OUT = process.argv[2] ?? "shots";
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
for (const [name, w, h] of [["desk", 1440, 900], ["mob", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${name}-entry.png` });
  // 戰場與陣容那一段
  await page.locator("text=每一局的戰場都是抽出來的").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}-arenas.png` });
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}-roster.png` });
  await page.close();
  console.log("shot", name);
}
await browser.close();
