// Builds an isolated copy without environment files, then exercises synthetic RPCs only.
// node scripts/test-play-analytics-browser.mjs [screenshot-directory]
import { strict as assert } from "node:assert";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { chromium } from "playwright-core";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = await mkdtemp(join(tmpdir(), "cardgame-admin-fixture-"));
const output = resolve(process.argv[2] ?? join(repo, "shots/admin-analytics"));
await mkdir(output, { recursive: true });
let server, browser;
const run = (args, cwd) => new Promise((accept, reject) => {
  const child = spawn(process.execPath, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout.on("data", b => { log += b; }); child.stderr.on("data", b => { log += b; });
  child.on("error", reject);
  child.on("exit", code => code === 0 ? accept(log) : reject(new Error(`Command failed (${code}):\n${log}`)));
});
try {
  for (const path of ["src", "public", "package.json", "tsconfig.json", "next.config.ts", "postcss.config.mjs", "next-env.d.ts"]) {
    await cp(join(repo, path), join(scratch, path), { recursive: true, filter: path => !/(^|\/)\.env(?:\.|$)/.test(path) });
  }
  await symlink(join(repo, "node_modules"), join(scratch, "node_modules"), "dir");
  await mkdir(join(scratch, "src/app/analytics-fixture"));
  await writeFile(join(scratch, "src/app/analytics-fixture/page.tsx"), `"use client";
import { useState } from "react";
import PlayAnalytics from "../admin/play-analytics";
import { AdminAPI, AdminError } from "../admin/admin-api";
import styles from "../admin/admin.module.css";
class FixtureAPI extends AdminAPI {
  override async rpc<T>(name: string, body: unknown): Promise<T> {
    const response = await fetch("/fixture-rpc/" + name, { method: "POST", body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new AdminError(result.message, false, response.status);
    return result as T;
  }
}
export default function Fixture() {
  const [api] = useState(() => new FixtureAPI());
  const [signed, setSigned] = useState(true);
  return <main className={styles.root}><h1>管理統計 · 合成資料驗證</h1>
    <button onClick={() => setSigned(value => !value)}>{signed ? "Fixture 登出" : "Fixture 登入"}</button>
    {signed ? <PlayAnalytics api={api} disabled={false} onExpired={() => setSigned(false)} /> : <p>PRIVATE DATA CLEARED</p>}
  </main>;
}`);
  const buildLog = await run([join(repo, "node_modules/next/dist/bin/next"), "build", scratch, "--webpack"], scratch);
  await writeFile(join(output, "build.log"), buildLog);
  console.log("PASS full Next production build in isolated copy (no .env, existing dependencies, webpack)");
  const portProbe = createServer();
  await new Promise(resolve => portProbe.listen(0, "127.0.0.1", resolve));
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
  server = spawn(process.execPath, [join(repo, "node_modules/next/dist/bin/next"), "start", scratch, "--hostname", "127.0.0.1", "-p", String(port)], { cwd: scratch, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Fixture server did not become ready")), 30000);
    server.stdout.on("data", b => { if (b.toString().includes("Ready")) { clearTimeout(timeout); resolve(); } });
    server.on("error", reject); server.on("exit", code => reject(new Error(`Fixture server exited ${code}`)));
  });
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const generated_at = new Date().toISOString();
  const daily = Array.from({ length: 28 }, (_, i) => ({ day: `2026-10-${String(i + 1).padStart(2, "0")}`, registered: i === 8 ? null : i % 6,
    guest_installs: i % 4, guest_active: i === 8 ? null : i % 13, matches: i % 9 }));
  const online_samples = Array.from({ length: 31 }, (_, i) => ({ minute: new Date(Date.parse("2026-10-19T03:00:00Z") + i * 60000).toISOString(),
    online_connections: i === 10 ? null : i % 11, lobby_connections: i % 4, playing_connections: i % 7 })).filter((_, i) => i < 15 || i > 19);
  const dashboard = { generated_at, days: 28, counts: { registered: 96, collection_users: 81, admitted_users: 63, completed_users: 59,
    guest_installs: 145, guest_played: 102, guest_online: 0, formal_matches: 287, guest_play_seconds: 3600 }, daily,
    online_samples, servers: [{ server_id: "fixture-local", received_at: generated_at, fresh: true, verified_accounts: 0,
      presence: { online_players: 0, lobby_players: 0, playing_players: 0, public_rooms: 0, matches: 0, protocol: 1 } }],
    guest_modes: [{ mode: "pve", started: 20, wins: 12, losses: 3, draws: 0, abandoned: 5 }, { mode: "lan", started: 5, wins: 2, losses: 1, draws: 1, abandoned: 1 }],
    formal_outcomes: { defeat: 20, disconnect: 3, draws: 0 } };
  const group = (source, mode, reason, n) => ({ source, mode, version: "v1.2.3", reason, samples: n,
    avg_seconds: n ? 145.25 : null, median_seconds: n ? 120 : null, p90_seconds: n ? 240 : null, total_seconds: n ? 145.25 * n : null });
  const duration = { schema_version: 1, generated_at, groups: [group("server", "ranked", "defeat", 12), group("server", "ranked", "concede", 3),
    group("server", "casual", "disconnect", 0), group("self_reported", "pve", "completed", 5), group("self_reported", "hotseat", "abandoned", 2)],
    matches: [
      { match_id: "fixture-formal-new", source: "server", mode: "ranked", version: "v1.2.3", reason: "defeat", duration_seconds: 125.5, completed_at: "2026-10-19T03:00:00Z" },
      { match_id: "fixture-formal-legacy", source: "server", mode: "casual", version: null, reason: "disconnect", duration_seconds: null, completed_at: "2026-10-18T03:00:00Z" },
      { match_id: "fixture-anonymous-zero", source: "self_reported", mode: "hotseat", version: "v1.2.3", reason: "abandoned", duration_seconds: 0, completed_at: "2026-10-17T03:00:00Z" },
    ], accounts: [
      { account_id: "fixture-account-001", total_seconds: 2137.25, server_seconds: 1500, self_reported_seconds: 637.25, matches: 15 },
      { account_id: "fixture-legacy-account", total_seconds: null, matches: 2 },
      { account_id: "fixture-zero-account", total_seconds: 0, server_seconds: 0, self_reported_seconds: 0, matches: 1 },
    ] };
  let scenario = "normal";
  let delayDashboard = false;
  const requests = [], errors = [], outside = [];
  const contexts = [];
  const makePage = async mobile => {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile });
    contexts.push(context);
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") { outside.push(url.origin); return route.abort(); }
      if (!url.pathname.startsWith("/fixture-rpc/")) return route.continue();
      const name = url.pathname.split("/").at(-1), params = route.request().postDataJSON();
      requests.push({ name, params });
      let result;
      if (name === "tcg_admin_match_analytics") {
        if (scenario === "missing") return route.fulfill({ status: 404, json: { message: "管理資料庫尚未安裝，請先完成後台遷移。" } });
        if (scenario === "expired") return route.fulfill({ status: 403, json: { message: "沒有管理權限" } });
        const matches = row => (!params.p_mode || row.mode === params.p_mode) && (!params.p_version || row.version === params.p_version) && (!params.p_reason || row.reason === params.p_reason);
        result = { ...duration, groups: duration.groups.filter(matches), matches: duration.matches.filter(matches), accounts: params.p_mode || params.p_version || params.p_reason ? [] : duration.accounts };
        if (params.p_version === "delayed") {
          await new Promise(resolve => setTimeout(resolve, 600));
          result = { ...duration, matches: [{ ...duration.matches[0], match_id: "STALE-PRIVATE-RESULT" }] };
        }
      } else if (name === "tcg_admin_play_dashboard") {
        if (delayDashboard) await new Promise(resolve => setTimeout(resolve, 600));
        result = dashboard;
      }
      else if (name === "tcg_admin_guest_players") result = { page: 0, total: 0, players: [] };
      else if (name === "tcg_admin_player_rates") result = { page: 0, players: [{ id: "fixture-player", email: "fixture@example.invalid", wins: 3, losses: 1, draws: 0, total: 4, win_rate: 75, loss_rate: 25, verified_match_online: false }] };
      else throw new Error(`Unexpected fixture RPC ${name}`);
      return route.fulfill({ json: result });
    });
    const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/analytics-fixture`, { waitUntil: "networkidle" });
    return page;
  };
  for (const mobile of [false, true]) {
    scenario = "normal";
    const page = await makePage(mobile), prefix = mobile ? "mobile" : "desktop";
    const section = page.getByRole("region", { name: "對局耗時分析", exact: true });
    await section.getByText("fixture-formal-new", { exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Page has no horizontal overflow");
    const dailyPanel = page.locator("article").filter({ has: page.getByRole("heading", { name: "每日玩家活動 · 近 28 日" }) });
    const plot = dailyPanel.locator("svg");
    await plot.focus(); await page.keyboard.press("Home");
    assert((await dailyPanel.locator('[aria-live="polite"]').innerText()).includes("2026-10-01"));
    await page.keyboard.press("ArrowRight");
    assert((await dailyPanel.locator('[aria-live="polite"]').innerText()).includes("2026-10-02"));
    await dailyPanel.screenshot({ path: join(output, `${prefix}-daily-bar.png`) });
    await dailyPanel.getByRole("combobox", { name: "每日趨勢圖類型" }).selectOption("line");
    await plot.focus(); await page.keyboard.press("Home");
    for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowRight");
    assert((await dailyPanel.locator('[aria-live="polite"]').innerText()).includes("無資料"));
    await dailyPanel.getByRole("button", { name: /新增註冊/ }).click();
    assert.equal(await dailyPanel.getByRole("button", { name: /新增註冊/ }).getAttribute("aria-pressed"), "false");
    await dailyPanel.getByRole("button", { name: /新增註冊/ }).click();
    await plot.scrollIntoViewIfNeeded();
    if (mobile) await plot.tap({ position: { x: 90, y: 100 } }); else await plot.hover({ position: { x: 90, y: 100 } });
    assert(!(await dailyPanel.locator('[aria-live="polite"]').innerText()).includes("2026-10-09"), "Pointer/touch selects exact day");
    await dailyPanel.screenshot({ path: join(output, `${prefix}-daily.png`) });
    const online = page.locator("article").filter({ has: page.getByRole("heading", { name: "主機連線 · 最近 24 小時" }) });
    await online.locator("svg").focus(); await page.keyboard.press("Home");
    assert((await online.locator('[aria-live="polite"]').innerText()).includes("全部連線：0 條"));
    await online.screenshot({ path: join(output, `${prefix}-online.png`) });
    assert((await section.innerText()).includes("0 秒") && (await section.innerText()).includes("未記錄"));
    for (const text of ["歷史累計，不限近 28 日", "含管理者參與的對局", "自行回報包含登入者及匿名者", "僅帳號名單排除管理者"]) {
      assert((await section.innerText()).includes(text), text);
    }
    const accounts = section.getByRole("region", { name: "帳號累積時間表", exact: true });
    const accountRow = accounts.getByRole("row").filter({ hasText: "fixture-account-001" });
    for (const text of ["2,137.25 秒", "1,500 秒", "637.25 秒"]) assert((await accountRow.innerText()).includes(text), text);
    assert.equal(await accounts.getByRole("row").filter({ hasText: "fixture-legacy-account" }).getByRole("cell", { name: "未提供來源拆分", exact: true }).count(), 2);
    assert.equal(await accounts.getByRole("row").filter({ hasText: "fixture-zero-account" }).getByRole("cell", { name: "0 秒", exact: true }).count(), 2);
    await section.screenshot({ path: join(output, `${prefix}-duration.png`) });
    await accounts.screenshot({ path: join(output, `${prefix}-account-sources.png`) });
    if (mobile) {
      const summaryTable = section.getByRole("region", { name: "正式伺服器耗時表", exact: true });
      await summaryTable.focus(); await page.keyboard.press("ArrowRight");
      await page.waitForFunction(() => document.activeElement.scrollLeft > 0);
      await summaryTable.evaluate(element => { element.scrollLeft = element.scrollWidth; });
      await summaryTable.screenshot({ path: join(output, "mobile-duration-statistics.png") });
      const matchTable = section.getByRole("region", { name: "近期對局耗時表", exact: true });
      await matchTable.evaluate(element => { element.scrollLeft = element.scrollWidth; });
      await matchTable.screenshot({ path: join(output, "mobile-duration-values.png") });
      await accounts.evaluate(element => { element.scrollLeft = element.scrollWidth; });
      await accounts.screenshot({ path: join(output, "mobile-account-source-values.png") });
    }
    await page.getByRole("combobox", { name: "耗時模式" }).selectOption("ranked");
    await page.getByRole("textbox", { name: "耗時版本" }).fill("v1.2.3");
    await page.getByRole("combobox", { name: "耗時原因" }).selectOption("concede");
    await section.getByRole("button", { name: "套用／更新耗時" }).click();
    await page.waitForFunction(() => !document.body.innerText.includes("耗時資料載入中"));
    assert.deepEqual(requests.filter(r => r.name === "tcg_admin_match_analytics").at(-1).params, { p_mode: "ranked", p_version: "v1.2.3", p_reason: "concede" });
    assert(!(await section.innerText()).includes("fixture-formal-new"));
    await page.getByRole("textbox", { name: "耗時版本" }).fill("delayed");
    const delayed = page.waitForRequest(request => request.url().includes("tcg_admin_match_analytics") && request.postDataJSON().p_version === "delayed");
    await section.getByRole("button", { name: "套用／更新耗時" }).click(); await delayed;
    await page.getByRole("textbox", { name: "耗時版本" }).fill("no-such-version");
    await section.getByRole("button", { name: "套用／更新耗時" }).click();
    await page.waitForTimeout(850);
    assert(!(await section.innerText()).includes("STALE-PRIVATE-RESULT"), "Stale filter response is discarded");
    assert((await section.innerText()).includes("尚無近期對局"));
    scenario = "missing";
    await section.getByRole("button", { name: "套用／更新耗時" }).click();
    await section.getByText(/對局耗時分析尚未啟用/).waitFor();
    assert((await page.locator("body").innerText()).includes("fixture@example.invalid") && await dailyPanel.isVisible(), "Missing duration RPC does not erase overview");
    delayDashboard = true;
    const delayedOverview = page.waitForRequest(request => request.url().includes("tcg_admin_play_dashboard"));
    await page.getByRole("button", { name: "更新統計", exact: true }).click(); await delayedOverview;
    scenario = "expired";
    await section.getByRole("button", { name: "套用／更新耗時" }).click();
    await page.getByText("PRIVATE DATA CLEARED").waitFor();
    await page.waitForTimeout(850); delayDashboard = false;
    assert(!(await page.locator("body").innerText()).includes("fixture@example.invalid"));
    assert.equal(await page.getByRole("region", { name: "遊玩統計", exact: true }).count(), 0);
    scenario = "normal";
    await page.getByRole("button", { name: "Fixture 登入" }).click();
    await section.getByText("fixture-formal-new", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Fixture 登出" }).click();
    await page.getByText("PRIVATE DATA CLEARED").waitFor();
    assert(!(await page.locator("body").innerText()).includes("fixture-account-001"));
    console.log(`PASS ${prefix}: keyboard/hover/touch, units/ticks, zero/null, series filters, exact backend params, stale responses, missing RPC isolation, revoked access/logout`);
  }
  assert.deepEqual(errors, []); assert.deepEqual(outside, []);
  console.log(`PASS no browser errors or external backend requests; screenshots: ${output}`);
} finally {
  if (browser) await browser.close();
  if (server) { server.kill("SIGTERM"); await new Promise(resolve => server.once("exit", resolve)); }
  await rm(scratch, { recursive: true, force: true });
}
