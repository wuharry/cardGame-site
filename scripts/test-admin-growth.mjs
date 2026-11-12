import { strict as assert } from "node:assert";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const load = (file, imports = {}) => loadTsModule(new URL(file, import.meta.url), imports);
const { AdminError } = await load("../src/app/admin/admin-api.ts");
const data = await load("../src/app/admin/growth-data.ts", { "./admin-api": { AdminError } });
const visuals = await load("../src/app/admin/growth-visuals.tsx", { "./growth-data": data, "./admin.module.css": {} });
const render = (component, props) => renderToStaticMarkup(createElement(component, props));
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };

const growth = {
  schema_version: 1, generated_at: "2026-11-12T06:00:00Z", days: 28, today: "2026-11-12",
  funnel: { installs: 42, onboarding_reported: 30, tutorial_started: 28, tutorial_completed: 17, first_match_started: 21,
    first_match_finished: 16, second_match_started: 9 },
  tutorial_steps: [
    { version: "2026.11.11-R25", step: 3, name: "SUMMON", steps: 16, installs: 4, completed: 0 },
    { version: "2026.11.11-R25", step: 14, name: "COMPLETE", steps: 16, installs: 12, completed: 12 },
    { version: "2026.11.03-R24", step: 1, name: "INSPECT", steps: 15, installs: 2, completed: 0 }],
  retention: [
    { day: "2026-11-01", installs: 10, d1: 4, d7: 2, within7: 6 },
    { day: "2026-11-10", installs: 5, d1: 1, d7: null, within7: null },
    { day: "2026-11-12", installs: 3, d1: null, d7: null, within7: null }],
  platforms: [{ platform: "Android", installs: 25 }], versions: [{ version: "2026.11.11-R25", installs: 24 }],
  turns: [{ mode: "casual", samples: 40, median: 24, p90: 34, max: 52 }],
  economy: [{ action: "buy_pack", receipts: 61, gold_in: 0, gold_out: 9150 }, { action: "mystery", receipts: 1, gold_in: 5, gold_out: 0 }],
};
const frozen = JSON.stringify(growth);
check(data.readGrowth(growth) === growth, "a complete growth payload is accepted as-is");
for (const broken of [{ ...growth, schema_version: 2 }, { ...growth, funnel: { ...growth.funnel, installs: -1 } },
  { ...growth, retention: [{ day: "x", installs: 1, d1: "1", d7: null, within7: null }] }, { ...growth, economy: null }])
  assert.throws(() => data.readGrowth(broken), /格式不符/);
checks++;

const guest = data.funnelRates(data.guestFunnel(growth.funnel));
check(guest.every(step => step.ofFirst === null || step.ofFirst <= 1), "steps that are not nested never exceed the starting count");
check(guest.find(step => step.label === "開始第一場").ofFirst === 0.5, "a step is a share of the first step");
check(data.funnelRates([{ label: "a", value: 0 }, { label: "b", value: 0 }]).every(step => step.ofFirst === null), "an empty start has no rates");
check(data.accountFunnel({ registered: 5, collection_users: 4, admitted_users: 2, completed_users: 1 }).map(s => s.value).join() === "5,4,2,1",
  "account funnel keeps the dashboard counts in order");

const totals = Object.fromEntries(data.retentionTotals(growth.retention).map(t => [t.key, t]));
check(totals.d1.installs === 15 && totals.d1.returned === 5, "next-day retention only counts cohorts whose day has passed");
check(totals.within7.installs === 10 && totals.within7.rate === 0.6, "seven-day retention skips open windows instead of counting zero");
check(data.retentionRate(null, 4) === null && data.retentionRate(0, 0) === null && data.retentionRate(0, 3) === 0,
  "null windows and empty cohorts have no rate; a closed window can be a real zero");

const groups = data.stepsByVersion(growth.tutorial_steps);
check(groups.length === 2 && groups[0].version === "2026.11.11-R25" && groups[0].installs === 16
  && groups[0].steps.map(s => s.name).join() === "SUMMON,COMPLETE", "tutorial steps are grouped by client version and ordered");

for (const [input, expected] of [["Traveler-1A2B3C4D", "1a2b3c4d"], [" 1a2b3c4d ", "1a2b3c4d"],
  ["1a2b3c4d-0000-4000-8000-000000000001", "1a2b3c4d"], ["traveler-ABCDEF12", "abcdef12"],
  ["1a2b3c4", null], ["1a2b3c4%", null], ["Traveler-1A2B3C4D9", null], ["", null]])
  assert.equal(data.guestCode(input), expected, input);
checks++;
check(data.missingGrowthRPC(new AdminError("管理資料庫尚未安裝，請先完成後台遷移。", false, 404))
  && !data.missingGrowthRPC(new AdminError("管理資料庫尚未安裝", false, 500)) && !data.missingGrowthRPC(new Error("PGRST202")),
  "only a 404 from the database marks growth as not installed");

const funnel = render(visuals.FunnelChart, { steps: data.guestFunnel(growth.funnel), label: "遊客漏斗" });
check(funnel.includes("佔 50%") && !funnel.includes("124%") && !funnel.includes("NaN"), "funnel shows shares of the start only");
check(render(visuals.FunnelChart, { steps: [{ label: "註冊", value: 0 }], label: "空" }).includes("尚無資料"), "an empty funnel says so");
const retention = render(visuals.RetentionPanel, { rows: growth.retention });
check(retention.includes("60%") && retention.includes("6／10 台") && retention.includes('data-open="true"'), "retention tiles show the denominator and open windows");
check(render(visuals.RetentionPanel, { rows: [] }).includes("沒有新遊客"), "no cohorts renders an empty state");
const steps = render(visuals.TutorialSteps, { growth });
check(steps.includes("4／16 召喚") && steps.includes("2026.11.03-R24") && steps.includes("12 台完成"), "tutorial steps use readable names per version");
check(render(visuals.TutorialSteps, { growth: { ...growth, tutorial_steps: [] } }).includes("新版遊戲"), "no tutorial reports explains the client requirement");
const economy = render(visuals.EconomyPanel, { growth });
check(economy.includes("買卡包") && economy.includes("−9,150") && economy.includes("mystery") && economy.includes("+5"), "gold flow labels known actions and keeps unknown ones");
check(render(visuals.TurnsPanel, { growth }).includes("休閒") && render(visuals.TurnsPanel, { growth: { ...growth, turns: [] } }).includes("沒有記錄回合數"),
  "turn counts render, and an empty period says so");
const modes = { pve: { started: 4, wins: 2, losses: 1, draws: 0, abandoned: 1 }, lan: { started: 0, wins: 0, losses: 0, draws: 0, abandoned: 0 } };
const device = render(visuals.DeviceModes, { modes });
check(device.includes("單人 AI") && !device.includes("區網") && device.includes("width:50%"), "device bars show only played modes, scaled by starts");
check(render(visuals.DeviceModes, { modes: { pve: { ...modes.lan } } }).includes("尚未開局"), "a device without matches says so");
const badge = render(visuals.TutorialBadge, { onboarding: { version: "x", tutorial_started: 1, tutorial_completed: 0, tutorial_step: 7,
  tutorial_step_name: "BLOCK", tutorial_steps: 16, updated_at: "2026-11-12T00:00:00Z" } });
check(badge.includes("停在 前排阻擋") && badge.includes("width:50%"), "tutorial badge shows where the tester stopped");
check(render(visuals.TutorialBadge, { onboarding: null }).includes("無教學紀錄"), "devices without reports show no progress");
check(JSON.stringify(growth) === frozen, "rendering never mutates RPC data");
console.log(`PASS admin growth: ${checks} checks for payload validation, funnels, retention windows, tutorial steps, guest codes and visuals`);
