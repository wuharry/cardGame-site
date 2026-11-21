import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";

// Only synthetic credentials and intercepted loopback HTTP are used in this test.
export async function testAdminLogin(browser, origin, output, cardStats) {
  const fixture = JSON.parse(await readFile(new URL("../fixtures/admin-mfa-dense-qr.json", import.meta.url), "utf8"));
  const svg = gunzipSync(Buffer.from(fixture.svg_gzip_base64, "base64")).toString("utf8");
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } });
    const calls = [], errors = [];
    const factor = "00000000-0000-4000-8000-0000000000f1";
    const session = { account_id: "fixture-admin", email: "owner@example.test", access_level: "operator" };
    const tokens = { access_token: "synthetic-access", refresh_token: "synthetic-refresh", expires_in: 3600 };
    try {
      await context.route("**/*", async route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== origin) { errors.push("Unexpected external request"); return route.abort(); }
        if (!url.pathname.startsWith("/fixture-backend/")) return route.continue();
        const path = url.pathname.slice("/fixture-backend".length), body = request.postDataJSON();
        calls.push({ path, body, method: request.method() });
        let result;
        if (path === "/auth/v1/token") result = tokens;
        else if (path === "/auth/v1/otp" || path.startsWith("/auth/v1/logout")) result = {};
        else if (path === "/auth/v1/verify") result = tokens;
        else if (path === "/auth/v1/user") result = request.method() === "PUT" ? { id: session.account_id } : { factors: [] };
        else if (path === "/auth/v1/factors") result = { id: factor, type: "totp", totp: { qr_code: svg, secret: fixture.secret } };
        else if (path.endsWith("/challenge")) result = { id: "00000000-0000-4000-8000-0000000000c1" };
        else if (path.endsWith("/verify")) {
          if (body.code === "000000") return route.fulfill({ status: 422, json: { error_code: "mfa_verification_failed" } });
          result = { ...tokens, access_token: "synthetic-aal2" };
        } else if (path.endsWith("/tcg_admin_session")) result = session;
        else if (path.endsWith("/tcg_admin_card_stats")) result = cardStats;
        else return route.fulfill({ status: 404, json: { code: "PGRST202" } });
        return route.fulfill({ json: result });
      });
      const page = await context.newPage();
      page.on("pageerror", error => errors.push(error.message));
      await page.clock.install();
      await page.goto(`${origin}/admin#card-stats`);
      await page.getByLabel("管理者 Email", { exact: true }).fill(session.email);
      await page.getByLabel("管理後台密碼", { exact: true }).fill("synthetic-password-only");
      await page.getByRole("button", { name: "登入管理後台", exact: true }).click();
      const assertQr = async () => {
        const img = page.getByAltText("驗證 App 設定用 QR 碼", { exact: true });
        await img.waitFor();
        assert(await img.evaluate(async image => { await image.decode(); return image.naturalWidth > 0; }), "Dense SVG decodes in the real browser");
        assert.equal(await page.getByRole("button", { name: "登出", exact: true }).count(), 0, "No private console before MFA");
      };
      await assertQr();
      await page.screenshot({ path: join(output, `${mobile ? "mobile" : "desktop"}-mfa-enrollment.png`) });
      await page.getByLabel("驗證 App 的 6 位數字", { exact: true }).fill("123456");
      await page.getByRole("button", { name: "驗證並進入", exact: true }).click();
      await page.getByRole("button", { name: "登出", exact: true }).click();

      await page.getByRole("button", { name: "首次設定／忘記密碼", exact: true }).click();
      await page.getByRole("button", { name: "寄送設定驗證碼", exact: true }).click();
      const emailCode = page.getByLabel("Email 數字驗證碼", { exact: true });
      await emailCode.fill("123456");
      assert(await page.getByRole("button", { name: /重新寄送驗證碼.*秒後/ }).isDisabled());
      assert.equal(await emailCode.inputValue(), "123456", "Cooldown keeps the received code usable");
      await page.getByRole("button", { name: "修改 Email", exact: true }).click();
      assert(await page.getByRole("button", { name: /寄送設定驗證碼.*秒後/ }).isDisabled());
      await page.clock.fastForward(61000);
      await page.getByRole("button", { name: "寄送設定驗證碼", exact: true }).click();
      await emailCode.waitFor();
      await page.clock.fastForward(61000);
      await page.getByRole("button", { name: "重新寄送驗證碼", exact: true }).click();
      await page.getByRole("button", { name: /重新寄送驗證碼.*秒後/ }).waitFor();
      assert.equal(calls.filter(call => call.path === "/auth/v1/otp").length, 3);
      await emailCode.fill("123456");
      await page.getByRole("button", { name: "驗證管理者身分", exact: true }).click();
      await assertQr();
      await page.getByLabel("驗證 App 的 6 位數字", { exact: true }).fill("000000");
      await page.getByRole("button", { name: "驗證並進入", exact: true }).click();
      await page.getByRole("status").filter({ hasText: "驗證碼不正確或已過時" }).waitFor();
      await page.getByLabel("驗證 App 的 6 位數字", { exact: true }).fill("123456");
      await page.getByRole("button", { name: "驗證並進入", exact: true }).click();
      await page.getByLabel("新密碼", { exact: true }).fill("new-synthetic-password-only");
      await page.getByLabel("確認新密碼", { exact: true }).fill("new-synthetic-password-only");
      await page.getByRole("button", { name: "儲存新密碼", exact: true }).click();
      await page.getByText("密碼已設定，請使用 Email 與新密碼登入。", { exact: true }).waitFor();
      assert.equal(calls.filter(call => call.method === "PUT").length, 1);
      assert.equal(calls.find(call => call.method === "PUT").body.password, "new-synthetic-password-only");
      assert.deepEqual(errors, []);
      console.log(`PASS ${mobile ? "mobile" : "desktop"} login: dense QR render, first enrollment, email recovery, resend countdown, MFA retry and password reset`);
    } finally { await context.close(); }
  }
}
