import * as React from "react";
import { strict as assert } from "node:assert";
import { loadTsModule } from "./lib/load-ts-module.mjs";
const { readDemoQueue, reviewIntent } = await loadTsModule(new URL("../src/app/admin/demo-requests.tsx", import.meta.url), {
  react: React,
  "./admin-api": { AdminAPI: class {}, AdminError: class extends Error {} },
  "./growth-visuals": { DeviceModes: () => null }, "./admin.module.css": {},
});
let checks = 0;
const check = (ok, label) => { assert.ok(ok, label); checks++; };
const id = "11111111-1111-4111-8111-111111111111";
const row = { id, install_id: id, account_id: id, email: "fixture@example.invalid", state: "pending", amount: 0,
  created_at: "2026-11-12T01:00:00Z", resolved_at: null, history_linked: false, audit: [] };
check(readDemoQueue({ enabled: true, pending_count: 1, total: 1, items: [row] }).items[0] === row, "queue accepts a signed account request");
check(readDemoQueue({ enabled: false, pending_count: 1, total: 1, items: [{ ...row, account_id: null, email: null }] }).enabled === false, "closed demo still exposes historical guest requests to admins");
for (const invalid of [null, {}, { enabled: "yes", pending_count: 1, total: 1, items: [] },
  { enabled: true, pending_count: -1, total: 1, items: [] }, { enabled: true, pending_count: 1, total: 1, items: [{ ...row, id: "bad" }] }]) {
  assert.throws(() => readDemoQueue(invalid)); checks++;
}
const grant = reviewIntent(row, true, 100, "  Demo testing  ", id);
check(grant.args.p_account === id && grant.args.p_application === id && grant.args.p_request === id && grant.args.p_amount === 100, "review pins recipient, application, amount and retry ID");
check(grant.args.p_reason === "Demo testing", "review preserves trimmed reason");
for (const amount of [0, -1, 0.5, Infinity, NaN, 100001]) {
  assert.throws(() => reviewIntent(row, true, amount, "reason", id)); checks++;
}
assert.throws(() => reviewIntent({ ...row, account_id: null }, true, 100, "reason", id)); checks++;
assert.throws(() => reviewIntent({ ...row, state: "granted" }, true, 100, "reason", id)); checks++;
assert.throws(() => reviewIntent(row, true, 100, "x", id)); checks++;
check(reviewIntent({ ...row, account_id: null }, false, 999, "closed by author", id).args.p_amount === 0, "declining a guest request never grants diamonds");
console.log(`PASS Demo requests: ${checks} checks`);
