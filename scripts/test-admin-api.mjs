import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/app/admin/admin-api.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { AdminAPI, AdminError } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const originalFetch = globalThis.fetch;
const originalNow = Date.now;
const calls = [];
const replies = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, ...options, body: JSON.parse(options.body) });
  const next = replies.shift();
  if (next instanceof Error) throw next;
  assert.ok(next, "No unexpected HTTP request");
  return new Response(JSON.stringify(next.body), { status: next.status ?? 200 });
};
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; console.log("PASS", label); };
try {
  const api = new AdminAPI();
  for (const invalid of ["not-an-email-code", "12345", "12345678901", "12345a"]) {
    await assert.rejects(() => api.signIn("owner@example.test", invalid),
      (error) => error instanceof AdminError && error.message.includes("數字驗證碼"));
  }
  check(calls.length === 0, "Passwords and malformed OTPs are rejected before any Auth request");
  replies.push({ body: {} }); await api.sendCode("owner@example.test");
  check(calls.at(-1).body.create_user === true, "First login may register an Auth account, with no client-supplied management role");
  check(!calls.at(-1).body.data && !calls.at(-1).body.access_level, "Signup cannot request an administrator role");
  await assert.rejects(() => api.rpc("tcg_admin_players", {}), (e) => e.status === 401);
  checks++;
  replies.push({ body: { access_token: "fake-access", refresh_token: "fake-refresh", expires_in: 3600 } },
    { body: { account_id: "test-admin", email: "owner@example.test", access_level: "operator" } });
  const session = await api.signIn("owner@example.test", "000000");
  check(session.access_level === "operator" && calls.at(-1).url.endsWith("tcg_admin_session"), "Login requires database administrator verification");
  check(calls.at(-1).headers.Authorization === "Bearer fake-access", "RPC uses the signed-in user's JWT");
  check(calls.every((c) => c.headers.apikey.startsWith("sb_publishable_")), "No service-role credential in browser requests");
  const change = { p_request: "10000000-0000-4000-8000-000000000001", p_account: "test-player", p_action: "grant_tickets", p_payload: { amount: 2 }, p_reason: "測試補發" };
  replies.push(new Error("lost reply"));
  await assert.rejects(() => api.rpc("tcg_admin_change", change), (e) => e instanceof AdminError && e.uncertain);
  const first = calls.at(-1).body;
  replies.push({ body: { replayed: true } });
  await api.rpc("tcg_admin_change", change);
  check(JSON.stringify(calls.at(-1).body) === JSON.stringify(first), "Retry preserves the complete ambiguous mutation and UUID");
  const gift = { ...change, p_action: "send_mail", p_payload: { amount: 2, title: "試玩禮物", body: "謝謝參與測試" } };
  replies.push(new Error("lost mail response"));
  await assert.rejects(() => api.change(gift), (e) => e.uncertain);
  const mailRequest = calls.at(-1).body;
  check(calls.at(-1).url.endsWith("tcg_admin_send_mail") && mailRequest.p_request === gift.p_request
    && mailRequest.p_tickets === 2 && mailRequest.p_title === gift.p_payload.title && !mailRequest.p_action,
  "Gift action uses the mail RPC and preserves the reviewed title, recipient, tickets and request ID");
  replies.push({ status: 401, body: { message: "expired" } });
  await assert.rejects(() => api.change(gift), (e) => e.uncertain && e.status === 401);
  checks++;
  replies.push({ body: { replayed: true } });
  await api.change(gift);
  check(JSON.stringify(calls.at(-1).body) === JSON.stringify(mailRequest), "Mail retry after lost response or auth failure retains one immutable intent");
  replies.push({ status: 400, body: { code: "22023", message: "card copy cap exceeded" } });
  await assert.rejects(() => api.rpc("tcg_admin_change", change), (e) => !e.uncertain && e.message.includes("三張"));
  checks++;
  replies.push({ status: 503, body: { message: "temporary outage" } });
  await assert.rejects(() => api.rpc("tcg_admin_change", change), (e) => e.uncertain);
  checks++;
  const now = Date.now(); Date.now = () => now + 3600000;
  replies.push({ body: { access_token: "refreshed", refresh_token: "next-refresh", expires_in: 3600 } }, { body: { players: [] } });
  await api.rpc("tcg_admin_players", {});
  check(calls.at(-2).url.includes("grant_type=refresh_token") && calls.at(-1).headers.Authorization === "Bearer refreshed", "Session refresh stays in memory and updates the JWT");
  Date.now = () => now + 7200000;
  const refreshBefore = calls.filter(c => c.url.includes("grant_type=refresh_token")).length;
  replies.push({ body: { access_token: "shared-refresh", refresh_token: "shared-next", expires_in: 3600 } },
    { body: { counts: {} } }, { body: { players: [] } });
  await Promise.all([api.rpc("tcg_admin_play_dashboard", { p_days: 28 }), api.rpc("tcg_admin_guest_players", { p_page: 0 })]);
  check(calls.filter(c => c.url.includes("grant_type=refresh_token")).length === refreshBefore + 1,
    "Concurrent chart/list requests share one token refresh");
  Date.now = originalNow;
  replies.push({ body: {} }); await api.signOut();
  const before = calls.length;
  await assert.rejects(() => api.rpc("tcg_admin_players", {}), (e) => e.status === 401);
  check(calls.length === before, "Sign-out blocks later private queries before any HTTP request");
  const outsider = new AdminAPI();
  replies.push({ body: { access_token: "outsider", refresh_token: "outsider-refresh", expires_in: 3600 } },
    { status: 403, body: { code: "42501", message: "administrator required" } }, { body: {} });
  await assert.rejects(() => outsider.signIn("player@example.test", "000000"), (e) => e.message.includes("管理權限"));
  await assert.rejects(() => outsider.rpc("tcg_admin_players", {}), (e) => e.status === 401);
  check(calls.at(-1).url.includes("/logout"), "An ordinary authenticated player is rejected and its browser session is cleared");
  const longerCode = new AdminAPI();
  replies.push({ body: { access_token: "longer-code-access", refresh_token: "longer-code-refresh", expires_in: 3600 } },
    { body: { account_id: "test-admin", email: "owner@example.test", access_level: "viewer" } });
  await longerCode.signIn("owner@example.test", " 12345678 ");
  check(calls.at(-2).body.token === "12345678", "Configured longer numeric OTPs remain valid and surrounding whitespace is trimmed");
  replies.push({ body: {} }); await longerCode.signOut();
  check(replies.length === 0, "All scripted HTTP outcomes were consumed");
  console.log(`Admin API: ${checks} checks PASS`);
} finally { globalThis.fetch = originalFetch; Date.now = originalNow; }
