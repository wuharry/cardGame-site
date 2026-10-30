import { strict as assert } from "node:assert";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const load = (file, imports) => loadTsModule(new URL(file, import.meta.url), imports, { allowNodeModules: true });
const helpers = await load("../src/app/admin/play-analytics-types.ts");
const charts = await load("../src/app/admin/play-analytics.tsx", {
  "./play-analytics-types": helpers, "./admin-api": {}, "./match-duration": { default: () => null },
  "./card-stats": { default: () => null }, "./admin.module.css": {},
  "./dashboard-visuals": { DashboardOverview: () => null, WinLossBar: () => null },
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
check(online.includes('role="img"') && (online.match(/<circle/g) ?? []).length === 6, "Isolated measurements remain visible and chart has accessible label");
data.daily = [{ day: "2026-10-12", registered: 1, guest_installs: 2, guest_active: 3, matches: 4 },
  { day: "2026-10-13", registered: 0, guest_installs: 0, guest_active: 0, matches: 0 }];
const daily = renderToStaticMarkup(createElement(charts.DailyChart, { data }));
check(daily.includes("每日數據") && daily.includes("2026-10-12") && !daily.includes("NaN"), "Daily chart includes exact values in an accessible table");
const body = daily.match(/<tbody>([\s\S]*?)<\/tbody>/)[1];
check(body.indexOf("2026-10-13") < body.indexOf("2026-10-12") && daily.includes('aria-sort="descending"'), "Daily table defaults to newest first with sort semantics");
const original = JSON.stringify(data.daily);
check(helpers.dailyRows([...data.daily].reverse())[0].day === "2026-10-12" && helpers.dailyRows(data.daily, true)[0].day === "2026-10-13", "Chart and table sort independently even for unordered input");
check(JSON.stringify(data.daily) === original, "Sorting never mutates cached dashboard data");
for (const kind of ["bar", "line"]) {
  const plot = renderToStaticMarkup(createElement(charts.DailyPlot, { data: { ...data, daily: [...data.daily].reverse() }, kind }));
  check(plot.includes(kind === "bar" ? "<rect" : "<polyline") && !plot.includes("NaN") && plot.indexOf("2026-10-12") < plot.lastIndexOf("2026-10-13"), `${kind} plot runs oldest to newest with exact-value titles`);
}
check(renderToStaticMarkup(createElement(charts.DailyPlot, { data: { ...data, daily: [] }, kind: "bar" })).includes("尚無每日統計"), "No fake chart for missing daily data");
const oneDay = renderToStaticMarkup(createElement(charts.DailyPlot, { data: { ...data, daily: [data.daily[0]] }, kind: "line" }));
check(oneDay.includes("<circle") && !oneDay.includes("NaN"), "A single-day line still has visible data points");
check(!renderToStaticMarkup(createElement(charts.ModeChart, { data })).includes("<svg"), "Empty mode distribution is not shown as a zero-player pie");
data.guest_modes = [{ mode: "pve", started: 3 }, { mode: "pvp", started: 1 }, { mode: "lan", started: 0 }];
const pie = renderToStaticMarkup(createElement(charts.ModeChart, { data }));
check(pie.includes("75.0%") && pie.includes("25.0%") && pie.includes("共 4 次開始") && !pie.includes("NaN"), "Pie denominator is mode starts, with exact accessible counts and shares");
check((pie.match(/<circle/g) ?? []).length === 2 && !pie.includes("區網"), "Zero samples do not create slices or misleading mode shares");
const oneMode = renderToStaticMarkup(createElement(charts.ModeChart, { data: { ...data, guest_modes: [data.guest_modes[0]] } }));
check(oneMode.includes("100.0%") && !oneMode.includes("NaN"), "A single mode renders a full ring");
console.log(`Play charts: ${checks} checks PASS`);

for (const maximum of [0, 1, 3, 99, 1500]) {
  const axis = helpers.countAxis([maximum, null, NaN, undefined]);
  check(axis.max >= Math.max(1, maximum) && axis.ticks.length === new Set(axis.ticks).size && axis.ticks.every(Number.isInteger), `Readable integer axis at maximum ${maximum}`);
}
check(JSON.stringify(helpers.tickIndices(28)) === "[0,7,14,20,27]", "Timeline includes three middle date ticks");
check(JSON.stringify(helpers.tickIndices(1)) === "[0]", "Single sample has one non-overlapping tick");
const missingRows = [{ t: 0, n: 1 }, { t: 1, n: null }, { t: 2, n: 0 }, { t: 5, n: 3 }];
check(helpers.measuredSegments(missingRows, r => r.n, r => r.t, 2).length === 3, "Null and time gaps split lines; measured zero remains");
const nullData = { ...data, daily: [{ ...data.daily[0], registered: null, guest_active: 0, matches: null }] };
const nullable = renderToStaticMarkup(createElement(charts.DailyChart, { data: nullData }));
check(nullable.includes("無資料") && nullable.includes("0 台") && !nullable.includes("NaN"), "Missing daily measurements differ from zero in readout and table");
check(nullable.includes('tabindex="0"') && nullable.includes('aria-live="polite"') && nullable.includes('aria-pressed="true"'), "Charts expose keyboard focus, live exact values and series toggles");
console.log("Extended chart checks PASS");
