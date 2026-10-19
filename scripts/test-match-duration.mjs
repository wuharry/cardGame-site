import { strict as assert } from "node:assert";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const load = (path, imports = {}) => loadTsModule(new URL(path, import.meta.url), imports, { allowNodeModules: true });
const types = await load("../src/app/admin/play-analytics-types.ts");
const { AdminError } = await load("../src/app/admin/admin-api.ts");
const view = await load("../src/app/admin/match-duration.tsx", {
  "./play-analytics-types": types, "./admin-api": { AdminError }, "./admin.module.css": {},
});
assert.deepEqual(types.matchFilterParams({ mode: "ante", version: " 1.2.3 ", reason: "concede" }), {
  p_mode: "ante", p_version: "1.2.3", p_reason: "concede",
});
assert.deepEqual(types.matchFilterParams({ mode: "", version: "", reason: "" }), { p_mode: "", p_version: "", p_reason: "" });
assert.equal(types.durationLabel(0), "0 秒");
for (const n of [null, undefined, NaN, Infinity, -1]) assert.equal(types.durationLabel(n), "未記錄");
for (const [source, reason, expected] of [
  ["server", "defeat", "正常結束"], ["server", "disconnect", "中途結束"], ["server", "concede", "中途結束"],
  ["self_reported", "completed", "正常結束"], ["self_reported", "abandoned", "中途結束"],
  ["server", "completed", "未分類原因"], ["self_reported", "defeat", "未分類原因"],
]) assert.equal(types.matchCompletion(source, reason), expected);
assert(view.missingMatchRPC(new AdminError("管理資料庫尚未安裝，請先完成後台遷移。", true, 404)));
assert(!view.missingMatchRPC(new AdminError("沒有權限", false, 403)));
assert(!view.missingMatchRPC(new AdminError("Proxy not found", false, 404)));
assert.throws(() => types.readMatchAnalytics({ schema_version: 2, groups: [], matches: [], accounts: [] }));
assert.throws(() => types.readMatchAnalytics({ schema_version: 1, generated_at: "now", groups: [{ source: "unknown" }], matches: [], accounts: [] }));
const data = { schema_version: 1, generated_at: "2026-10-19T00:00:00Z", groups: [
  { source: "server", mode: "ranked", version: "1.0", reason: "defeat", samples: 2, avg_seconds: 45, median_seconds: 40, p90_seconds: 60, total_seconds: 90 },
  { source: "server", mode: "ante", version: null, reason: "concede", samples: 0, avg_seconds: null, median_seconds: null, p90_seconds: null, total_seconds: null },
  { source: "self_reported", mode: "pve", version: "1.0", reason: "completed", samples: 1, avg_seconds: 0, median_seconds: 0, p90_seconds: 0, total_seconds: 0 },
], matches: [
  { match_id: "older", source: "server", mode: "casual", version: null, reason: "disconnect", duration_seconds: null, completed_at: "2026-10-18T00:00:00Z" },
  { match_id: "newer", source: "self_reported", mode: "hotseat", version: "1.0", reason: "abandoned", duration_seconds: 0, completed_at: "2026-10-19T00:00:00Z" },
], accounts: [
  { account_id: "fixture-account", total_seconds: null, matches: 2 },
  { account_id: "fixture-mixed", total_seconds: 120, server_seconds: 90, self_reported_seconds: 30, matches: 3 },
  { account_id: "fixture-zero-source", total_seconds: 0, server_seconds: 0, self_reported_seconds: 0, matches: 1 },
  { account_id: "fixture-partial-source", total_seconds: 100, self_reported_seconds: 25, matches: 2 },
] };
const original = JSON.stringify(data);
assert.equal(types.readMatchAnalytics(data), data);
const html = renderToStaticMarkup(createElement(view.MatchDurationView, { data }));
for (const text of ["正式伺服器耗時", "自行回報（登入者／匿名者）耗時", "不作正式戰績證明", "正常結束", "中途結束", "無樣本", "未記錄", "0 秒", "45 秒", "40 秒", "60 秒", "90 秒",
  "歷史累計，不限近 28 日", "含管理者參與的對局", "自行回報包含登入者及匿名者", "耗時樣本只計有記錄的有效耗時", "正式伺服器每局只計一次", "僅帳號名單排除管理者", "來源可能混合", "不能合計帳號總時再算每局平均"]) assert(html.includes(text), text);
assert(!html.includes("匿名自行回報"), "Self-reported source is not labelled as entirely anonymous");
const accountRows = html.match(/aria-label="帳號累積時間表"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)[1];
const accountRow = id => accountRows.match(new RegExp(`<tr><td>${id}</td>([\\s\\S]*?)</tr>`))[1];
assert.equal((accountRow("fixture-account").match(/未提供來源拆分/g) ?? []).length, 2, "Legacy accounts never imply a server-only total");
assert(accountRow("fixture-mixed").includes("120 秒") && accountRow("fixture-mixed").includes("90 秒") && accountRow("fixture-mixed").includes("30 秒"), "Mixed account total and source breakdown remain separate");
assert.equal((accountRow("fixture-zero-source").match(/0 秒/g) ?? []).length, 3, "Measured zero source durations remain zero");
assert(accountRow("fixture-partial-source").includes("未提供來源拆分") && accountRow("fixture-partial-source").includes("25 秒") && !accountRow("fixture-partial-source").includes("75 秒"), "Missing source is not inferred by subtracting from a mixed total");
assert(html.indexOf("newer") < html.indexOf("older"), "Recent matches sort independently newest first");
assert.equal(JSON.stringify(data), original, "Never mutate RPC response while sorting");
const empty = renderToStaticMarkup(createElement(view.MatchDurationView, { data: { ...data, groups: [], matches: [], accounts: [] } }));
assert(empty.includes("尚無正式伺服器耗時樣本") && empty.includes("尚無自行回報（登入者／匿名者）耗時樣本") && empty.includes("尚無帳號累積時間"));
console.log("PASS duration schema, source/reason classification, exact RPC filters, null vs zero, empty states, independent missing-RPC detection, table ordering, optional account source breakdown and historical/admin scope");
