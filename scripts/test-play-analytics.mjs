import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const require = createRequire(import.meta.url);
const compile = async (file) => ts.transpileModule(await readFile(new URL(file, import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const load = (source, imports = {}) => {
  const exports = {};
  new Function("require", "exports", source)((name) => imports[name] ?? require(name), exports);
  return exports;
};
const helpers = load(await compile("../src/app/admin/play-analytics-types.ts"));
const charts = load(await compile("../src/app/admin/play-analytics.tsx"), {
  "./play-analytics-types": helpers, "./admin-api": {}, "./admin.module.css": {},
});
const now = Date.parse("2026-10-13T08:00:00Z");
const sample = { minute: "2026-10-13T07:00:00Z", online_connections: 0, lobby_connections: 0, playing_connections: 0 };
const data = { generated_at: new Date(now).toISOString(), days: 28, servers: [], daily: [], online_samples: [], guest_modes: [] };
let checks = 0;
const check = (ok, label) => { assert.ok(ok, label); checks++; console.log("PASS", label); };
check(helpers.livePresence(data, now) === null, "Missing server is unknown, not zero");
data.servers = [{ fresh: true, received_at: new Date(now).toISOString(), presence: { online_players: 0, lobby_players: 0, playing_players: 0 } }];
check(helpers.livePresence(data, now).online === 0, "A fresh zero measurement is shown as zero");
check(helpers.livePresence(data, now + 45000) === null, "An open dashboard ages an expired heartbeat without a successful refresh");
data.online_samples = [sample, { ...sample, minute: "2026-10-13T07:03:00Z", online_connections: 2 }];
check(helpers.sampleSegments(data.online_samples).length === 2, "No interpolated line across missing heartbeats");
const empty = renderToStaticMarkup(createElement(charts.OnlineChart, { data: { ...data, online_samples: [] } }));
check(empty.includes("尚無伺服器心跳") && !empty.includes("<svg"), "Empty online chart has an honest empty state");
const online = renderToStaticMarkup(createElement(charts.OnlineChart, { data }));
check(online.includes('role="img"') && (online.match(/<circle/g) ?? []).length === 2, "Isolated measurements remain visible and chart has accessible label");
data.daily = [{ day: "2026-10-12", registered: 1, guest_installs: 2, guest_active: 3, matches: 4 },
  { day: "2026-10-13", registered: 0, guest_installs: 0, guest_active: 0, matches: 0 }];
const daily = renderToStaticMarkup(createElement(charts.DailyChart, { data }));
check(daily.includes("每日數據表") && daily.includes("2026-10-12") && !daily.includes("NaN"), "Daily chart includes exact values in an accessible table");
console.log(`Play charts: ${checks} checks PASS`);
