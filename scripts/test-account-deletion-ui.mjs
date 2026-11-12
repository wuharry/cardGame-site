// Run against a local dev server. All external requests are intercepted; no real OTP/deletion.
import { strict as assert } from "node:assert";
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
const base = new URL(process.argv[2] ?? "http://127.0.0.1:3139");
assert.ok(["localhost", "127.0.0.1"].includes(base.hostname), "local test server only");
const output = process.argv[4] ?? "/tmp/deckmarch-privacy-ui";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.argv[3] ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true,
});
const account = "a0000000-0000-4000-8000-000000000001";
try {
  for (const [width, height] of [[1280, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const requests = [];
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === base.origin) return route.continue();
      if (url.origin !== "https://xmyksnpupebxkskydkes.supabase.co") return route.abort();
      requests.push({ path: url.pathname, body: request.postDataJSON() });
      const json = url.pathname === "/auth/v1/otp" ? {}
        : url.pathname === "/auth/v1/verify" ? { access_token: "synthetic", expires_in: 3600, user: { id: account, email: "fixture@example.invalid" } }
          : { schema_version: 1, deleted: true, account_id: account };
      return route.fulfill({ headers: { "access-control-allow-origin": "*" }, json });
    });
    await page.goto(new URL("/privacy", base).href, { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `${output}/privacy-${width}.png`, fullPage: true });
    await page.goto(new URL("/account/delete", base).href, { waitUntil: "networkidle" });
    await page.getByLabel("帳號 Email", { exact: true }).fill("fixture@example.invalid");
    await page.getByRole("button", { name: "寄送刪帳驗證碼", exact: true }).click();
    await page.getByLabel("刪除帳號驗證碼", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "驗證信箱", exact: true }).click();
    await page.getByLabel("輸入大寫 DELETE 確認", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "永久刪除我的帳號" }).isDisabled(), true);
    await page.getByLabel("輸入大寫 DELETE 確認", { exact: true }).fill("DELETE");
    await page.screenshot({ path: `${output}/delete-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole("button", { name: "永久刪除我的帳號", exact: true }).click();
    await page.getByText("刪除完成", { exact: true }).waitFor();
    assert.deepEqual(requests.map(r => r.path), ["/auth/v1/otp", "/auth/v1/verify", "/rest/v1/rpc/tcg_delete_account"]);
    assert.equal(requests[0].body.create_user, false);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => /auth|token|email/i.test(key))), false);
    assert.deepEqual(errors, []);
    console.log(`PASS browser deletion and privacy at ${width}px; fake transport, no real account changes`);
    await page.close();
  }
} finally { await browser.close(); }
