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
  calls.push({ url, ...options, body: options.body === undefined ? undefined : JSON.parse(options.body) });
  const next = await replies.shift();
  if (next instanceof Error) throw next;
  assert.ok(next, "No unexpected HTTP request");
  return new Response(JSON.stringify(next.body), { status: next.status ?? 200 });
};
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; console.log("PASS", label); };
// Every admin login: password or email code -> database admin check -> authenticator lookup,
// then the authenticator code -> challenge -> verify (aal2 tokens) -> database admin check again.
const FACTOR = "00000000-0000-4000-8000-0000000000f1";
const CHALLENGE = "00000000-0000-4000-8000-0000000000c1";
const adminSession = (level = "operator") => ({ body: { account_id: "test-admin", email: "owner@example.test", access_level: level } });
const tokenReply = token => ({ body: { access_token: token, refresh_token: `${token}-refresh`, expires_in: 3600 } });
const firstFactor = (token, level) => [tokenReply(token), adminSession(level),
  { body: { factors: [{ id: FACTOR, factor_type: "totp", status: "verified" }] } }];
const secondFactor = (token, level) => [{ body: { id: CHALLENGE } }, tokenReply(`${token}-aal2`), adminSession(level)];
const signInFully = async (client, token, level = "operator") => {
  replies.push(...firstFactor(token, level));
  await client.signIn("owner@example.test", "fixture-password");
  replies.push(...secondFactor(token, level));
  return client.completeMfa("123456");
};
const setupFully = async (client, token, level = "operator", code = "123456") => {
  replies.push(...firstFactor(token, level));
  await client.verifySetupCode("owner@example.test", code);
  replies.push(...secondFactor(token, level));
  return client.completeMfa("123456");
};
try {
  const api = new AdminAPI();
  await assert.rejects(() => api.signIn("not-an-email", "fixture-password"), (e) => e instanceof AdminError);
  await assert.rejects(() => api.signIn("owner@example.test", ""), (e) => e instanceof AdminError);
  check(calls.length === 0, "Empty passwords and invalid account addresses do not reach Auth");
  replies.push({ body: {} }); await api.sendSetupCode(" Owner@Example.test ");
  check(calls.at(-1).body.create_user === false && calls.at(-1).body.email === "owner@example.test",
    "Password setup only emails an existing account and normalizes the address");
  check(!calls.at(-1).body.data && !calls.at(-1).body.access_level, "Password setup cannot request an administrator role");
  await assert.rejects(() => api.rpc("tcg_admin_players", {}), (e) => e.status === 401);
  checks++;
  replies.push(...firstFactor("fake-access"));
  const step = await api.signIn(" Owner@Example.test ", " fixture-password ");
  check(step.kind === "verify" && calls.at(-2).url.endsWith("tcg_admin_session") && calls.at(-1).url.endsWith("/auth/v1/user")
    && calls.at(-1).method === "GET" && calls.at(-1).body === undefined,
    "Login checks database administrator membership first, then looks up the authenticator");
  check(calls.at(-3).url.endsWith("/auth/v1/token?grant_type=password")
    && calls.at(-3).body.password === " fixture-password " && calls.at(-3).body.email === "owner@example.test"
    && !Object.hasOwn(calls.at(-3).body, "token"), "Normal login sends the exact password through the password grant, never an OTP");
  const beforeCode = calls.length;
  await assert.rejects(() => api.rpc("tcg_admin_players", {}), (e) => e.status === 401);
  await assert.rejects(() => api.completeMfa("12345"), (e) => e.message.includes("6 位數字"));
  check(calls.length === beforeCode, "The password alone unlocks no administrator RPC, and malformed codes never reach Auth");
  replies.push({ body: { id: CHALLENGE } }, { status: 422, body: { error_code: "mfa_verification_failed", msg: "Invalid TOTP code entered" } });
  await assert.rejects(() => api.completeMfa("000000"), (e) => e.message.includes("驗證碼不正確") && e.status === 422);
  check(!calls.some(c => c.url.includes("/logout")), "A wrong authenticator code keeps the password step for the next code");
  replies.push(...secondFactor("fake-access"));
  const session = await api.completeMfa(" 123 456 ");
  check(session.access_level === "operator" && calls.at(-3).url.endsWith(`/auth/v1/factors/${FACTOR}/challenge`)
    && calls.at(-2).url.endsWith(`/auth/v1/factors/${FACTOR}/verify`) && calls.at(-2).body.code === "123456"
    && calls.at(-2).body.challenge_id === CHALLENGE, "The authenticator code is checked against a fresh challenge, spaces removed");
  check(calls.at(-1).url.endsWith("tcg_admin_session") && calls.at(-1).headers.Authorization === "Bearer fake-access-aal2",
    "Login requires database administrator verification with the verified (aal2) session");
  check(calls.at(-1).headers.Authorization === "Bearer fake-access-aal2", "RPC uses the signed-in user's JWT");
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
  await assert.rejects(() => outsider.signIn("player@example.test", "fixture-password"), (e) => e.message.includes("管理權限"));
  await assert.rejects(() => outsider.rpc("tcg_admin_players", {}), (e) => e.status === 401);
  check(calls.at(-1).url.includes("/logout"), "An ordinary authenticated player is rejected and its browser session is cleared");
  check(!calls.some(c => c.url.includes("/auth/v1/factors") && c.headers.Authorization === "Bearer outsider"),
    "A non-administrator is never offered or enrolled in a second factor");
  const enrolling = new AdminAPI();
  const STALE = "00000000-0000-4000-8000-0000000000e1";
  const FRESH = "00000000-0000-4000-8000-0000000000e2";
  replies.push(tokenReply("enroll-access"), { status: 400, body: { code: "P0001", message: "administrator mfa required" } },
    { body: { factors: [{ id: STALE, factor_type: "totp", status: "unverified" }] } }, { body: { id: STALE } },
    { body: { id: FRESH, type: "totp", totp: { qr_code: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP", uri: "otpauth://totp/fixture" } } });
  const enrollStep = await enrolling.signIn("owner@example.test", "fixture-password");
  check(enrollStep.kind === "enroll" && enrollStep.secret === "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"
    && enrollStep.qr.startsWith("data:image/svg+xml") && !enrollStep.qr.includes("<"),
    "A first login after the MFA migration enrolls an authenticator; the QR code is an encoded image URI, never markup");
  check(calls.at(-2).method === "DELETE" && calls.at(-2).url.endsWith(`/auth/v1/factors/${STALE}`)
    && calls.at(-1).url.endsWith("/auth/v1/factors") && calls.at(-1).body.factor_type === "totp" && calls.at(-1).body.issuer === "紙鴉牌後台",
    "An abandoned, never-verified enrollment is replaced before a new QR code is issued");
  replies.push({ body: { id: CHALLENGE } }, tokenReply("enroll-access-aal2"), adminSession());
  await enrolling.completeMfa("654321");
  check(calls.at(-3).url.endsWith(`/auth/v1/factors/${FRESH}/challenge`), "The first code proves the newly enrolled authenticator");
  replies.push({ body: {} }); await enrolling.signOut();
  const switchedOff = new AdminAPI();
  replies.push(tokenReply("off-access"), adminSession(), { body: { factors: [] } },
    { status: 422, body: { error_code: "mfa_totp_enroll_not_enabled", msg: "MFA enroll is disabled for TOTP" } }, { body: {} });
  await assert.rejects(() => switchedOff.signIn("owner@example.test", "fixture-password"), (e) => e.message.includes("TOTP"));
  check(calls.at(-1).url.includes("/logout"), "If the project has TOTP switched off, login says how to fix it and clears the session");
  const setup = new AdminAPI();
  const beforeInvalidCode = calls.length;
  for (const invalid of ["not-an-email-code", "12345", "12345678901", "12345a"]) {
    await assert.rejects(() => setup.verifySetupCode("owner@example.test", invalid),
      (error) => error instanceof AdminError && error.message.includes("數字驗證碼"));
  }
  check(calls.length === beforeInvalidCode, "Malformed setup verification codes do not reach Auth");
  await assert.rejects(() => setup.updatePassword("fixture-new-password"), (e) => e.status === 401);
  check(calls.length === beforeInvalidCode, "A new password cannot be set before verified administrator recovery");
  replies.push(...firstFactor("longer-code-access", "viewer"));
  await setup.verifySetupCode("owner@example.test", " 12345678 ");
  check(calls.at(-3).body.token === "12345678", "Configured longer numeric OTPs remain valid and surrounding whitespace is trimmed");
  check(calls.at(-2).url.endsWith("tcg_admin_session"), "Setup OTP still requires database administrator approval");
  const beforeSetupCode = calls.length;
  await assert.rejects(() => setup.updatePassword("fixture-new-password"), (e) => e.status === 401);
  check(calls.length === beforeSetupCode, "The email code alone cannot change the password before the authenticator code");
  replies.push(...secondFactor("longer-code-access", "viewer"));
  await setup.completeMfa("123456");
  const beforeWeakPassword = calls.length;
  await assert.rejects(() => setup.updatePassword("short"), (e) => e.message.includes("12"));
  await assert.rejects(() => setup.updatePassword("長".repeat(25)), (e) => e.message.includes("過長"));
  check(calls.length === beforeWeakPassword, "Setup rejects too-short and over-72-byte passwords before a change request");
  replies.push({ body: { account_id: "test-admin", email: "owner@example.test", access_level: "viewer" } },
    { status: 400, body: { code: 400, error_code: "weak_password", msg: "fixture-sensitive-password-rule" } });
  await assert.rejects(() => setup.updatePassword("fixture-rejected-password"), (e) => e.message.includes("不符合帳號安全規則"));
  check(calls.at(-1).method === "PUT", "Supabase Auth password rules remain authoritative and its structured error is sanitized");
  replies.push({ body: { account_id: "test-admin", email: "owner@example.test", access_level: "viewer" } },
    { body: { id: "test-admin" } }, { body: {} });
  await setup.updatePassword(" fixture-new-password ");
  check(calls.at(-2).url.endsWith("/auth/v1/user") && calls.at(-2).method === "PUT"
    && calls.at(-2).body.password === " fixture-new-password "
    && calls.at(-2).headers.Authorization === "Bearer longer-code-access-aal2",
    "Password setup updates the verified user's password through authenticated PUT without trimming it");
  check(calls.at(-3).url.endsWith("tcg_admin_session") && calls.at(-1).url.endsWith("/auth/v1/logout?scope=local"),
    "Password setup rechecks the backend role, then signs out instead of silently preserving the OTP session");
  await assert.rejects(() => setup.rpc("tcg_admin_players", {}), (e) => e.status === 401);
  const expiredSetup = new AdminAPI();
  await setupFully(expiredSetup, "setup-expired-access");
  const setupTime = Date.now(); Date.now = () => setupTime + 601000;
  const beforeExpiredSetup = calls.length;
  await assert.rejects(() => expiredSetup.updatePassword("fixture-new-password"), (e) => e.status === 401);
  check(calls.length === beforeExpiredSetup, "Password setup requires fresh verification within ten minutes");
  Date.now = originalNow;
  replies.push({ body: {} }); await expiredSetup.signOut();
  const revokedSetup = new AdminAPI();
  await setupFully(revokedSetup, "revoked-setup-access");
  replies.push({ status: 403, body: { code: "42501", message: "administrator required" } });
  const beforeRevokedChange = calls.length;
  await assert.rejects(() => revokedSetup.updatePassword("fixture-new-password"), (e) => e.message.includes("管理權限"));
  check(calls.length === beforeRevokedChange + 1 && calls.at(-1).url.endsWith("tcg_admin_session"),
    "A role revoked after OTP verification blocks the password change before any PUT");
  replies.push({ body: {} }); await revokedSetup.signOut();
  const rejectedPassword = new AdminAPI();
  replies.push({ status: 400, body: { error_code: "invalid_credentials", msg: "fixture-sensitive-server-message" } });
  await assert.rejects(() => rejectedPassword.signIn("owner@example.test", "fixture-wrong-password"),
    (e) => e.message === "帳號或管理後台密碼不正確。");
  check(calls.at(-1).url.includes("grant_type=password"), "Wrong credentials use a generic account/password error");
  replies.push({ status: 400, body: null });
  await assert.rejects(() => rejectedPassword.signIn("owner@example.test", "fixture-wrong-password"),
    (e) => e instanceof AdminError && e.message === "帳號或管理後台密碼不正確。");
  check(true, "A malformed error body does not leak raw data or turn into a JavaScript exception");
  const malformedLogin = new AdminAPI();
  replies.push({ body: { access_token: "incomplete-access", expires_in: 3600 } }, { body: {} });
  await assert.rejects(() => malformedLogin.signIn("owner@example.test", "fixture-password"), (e) => e.message.includes("不完整"));
  check(calls.at(-1).url.includes("/logout") && calls.at(-1).headers.Authorization === "Bearer incomplete-access",
    "Incomplete login responses revoke any returned access session and never enable RPCs");
  await assert.rejects(() => malformedLogin.rpc("tcg_admin_players", {}), (e) => e.status === 401);
  const lateLogin = new AdminAPI();
  let resolveOld;
  replies.push(new Promise((resolve) => { resolveOld = resolve; }));
  const oldLogin = lateLogin.signIn("owner@example.test", "fixture-old-password");
  await lateLogin.signOut();
  replies.push(...firstFactor("new-login-access"));
  await lateLogin.signIn("owner@example.test", "fixture-current-password");
  replies.push(...secondFactor("new-login-access"));
  await lateLogin.completeMfa("123456");
  replies.push({ body: {} });
  resolveOld({ body: { access_token: "cancelled-login-access", refresh_token: "cancelled-login-refresh", expires_in: 3600 } });
  await assert.rejects(() => oldLogin, (e) => e.message.includes("取消登入"));
  check(calls.at(-1).url.endsWith("/auth/v1/logout?scope=local")
    && calls.at(-1).headers.Authorization === "Bearer cancelled-login-access",
    "A cancelled login revokes only its late-returned session");
  replies.push({ body: { players: [] } });
  await lateLogin.rpc("tcg_admin_players", {});
  check(calls.at(-1).headers.Authorization === "Bearer new-login-access-aal2",
    "A stale password response cannot replace or clear a newer authenticated login");
  replies.push({ body: {} }); await lateLogin.signOut();
  const cancelledSetup = new AdminAPI();
  let resolveSetup;
  replies.push(new Promise((resolve) => { resolveSetup = resolve; }));
  const oldSetup = cancelledSetup.verifySetupCode("owner@example.test", "123456");
  await cancelledSetup.signOut();
  replies.push({ body: {} });
  resolveSetup({ body: { access_token: "cancelled-setup-access", refresh_token: "cancelled-setup-refresh", expires_in: 3600 } });
  await assert.rejects(() => oldSetup, (e) => e.message.includes("取消登入"));
  const beforeCancelledSetup = calls.length;
  await assert.rejects(() => cancelledSetup.updatePassword("fixture-new-password"), (e) => e.status === 401);
  check(calls.length === beforeCancelledSetup, "Cancelled OTP recovery cannot later revive password-change permission");
  const replacedSetup = new AdminAPI();
  await setupFully(replacedSetup, "old-setup-access");
  const originalRpc = replacedSetup.rpc.bind(replacedSetup);
  let notifyRoleChecked;
  let releaseRoleCheck;
  let pauseNextRoleCheck = true;
  const roleChecked = new Promise((resolve) => { notifyRoleChecked = resolve; });
  const release = new Promise((resolve) => { releaseRoleCheck = resolve; });
  // Hold the public RPC's successful result after its own epoch guard. Cancellation
  // in this continuation gap must still be checked by the password-change caller.
  replacedSetup.rpc = async (...args) => {
    const result = await originalRpc(...args);
    if (pauseNextRoleCheck && args[0] === "tcg_admin_session") {
      pauseNextRoleCheck = false;
      notifyRoleChecked();
      await release;
    }
    return result;
  };
  replies.push({ body: { account_id: "test-admin", email: "owner@example.test", access_level: "operator" } });
  const cancelledPasswordChange = replacedSetup.updatePassword("fixture-stale-password");
  await roleChecked;
  replies.push({ body: {} }); await replacedSetup.signOut();
  await setupFully(replacedSetup, "replacement-setup-access", "operator", "12345678");
  const beforeRelease = calls.length;
  releaseRoleCheck();
  await assert.rejects(() => cancelledPasswordChange);
  check(calls.length === beforeRelease,
    "Cancelling and re-verifying the same account blocks a stale password PUT after its role check");
  replies.push({ body: { account_id: "test-admin", email: "owner@example.test", access_level: "operator" } },
    { body: { id: "test-admin" } }, { body: {} });
  await replacedSetup.updatePassword("fixture-current-password");
  check(calls.at(-2).method === "PUT" && calls.at(-2).body.password === "fixture-current-password"
    && calls.at(-2).headers.Authorization === "Bearer replacement-setup-access-aal2",
    "The newly verified setup keeps its own permission and only writes its current password");
  const expiryApi = new AdminAPI();
  await signInFully(expiryApi, "old-page-access");
  let expirations = 0;
  const unsubscribe = expiryApi.onSessionExpired(() => { expirations++; });
  let resolveOldPage;
  replies.push(new Promise(resolve => { resolveOldPage = resolve; }));
  const oldPage = expiryApi.rpc("tcg_admin_card_stats", {});
  replies.push({ body: {} }); await expiryApi.signOut();
  await signInFully(expiryApi, "current-page-access");
  resolveOldPage({ status: 403, body: { code: "42501", message: "Old page was denied" } });
  await assert.rejects(() => oldPage, error => error.status === 403);
  check(expirations === 0, "An old login's delayed denial cannot expire the replacement session");
  replies.push({ status: 403, body: { code: "42501", message: "Current page was denied" } });
  await assert.rejects(() => expiryApi.rpc("tcg_admin_card_stats", {}), error => error.status === 403);
  check(expirations === 1, "A current session denial notifies the console even when its requesting page is unmounted");
  unsubscribe();
  replies.push({ status: 401, body: { message: "Expired" } });
  await assert.rejects(() => expiryApi.rpc("tcg_admin_players", {}), error => error.status === 401);
  check(expirations === 1, "Unmounted consoles unsubscribe from session expiration notifications");
  let resolveMutation;
  replies.push(new Promise(resolve => { resolveMutation = resolve; }));
  const interruptedMutation = expiryApi.change(gift);
  replies.push({ body: {} }); await expiryApi.signOut();
  resolveMutation({ body: {} });
  await assert.rejects(() => interruptedMutation, error => error.uncertain && error.message.includes("取消舊請求"));
  check(true, "An operation completed after session invalidation keeps an uncertain outcome so its journal UUID survives");
  await signInFully(expiryApi, "retry-access");
  const beforeRefresh = Date.now(); Date.now = () => beforeRefresh + 3600000;
  let resolveRetryRefresh;
  replies.push(new Promise(resolve => { resolveRetryRefresh = resolve; }));
  const interruptedRetry = expiryApi.change(gift);
  replies.push({ body: {} }); await expiryApi.signOut();
  resolveRetryRefresh({ body: { access_token: "cancelled-refresh", refresh_token: "cancelled-refresh-token", expires_in: 3600 } });
  await assert.rejects(() => interruptedRetry, error => error.uncertain && error.message.includes("取消舊請求"));
  Date.now = originalNow;
  check(true, "Cancellation during a retry's token refresh also preserves the prior uncertain mutation journal");
  check(calls.every((c) => c.body?.create_user !== true), "No admin flow creates or registers an Auth account");
  check(replies.length === 0, "All scripted HTTP outcomes were consumed");
  console.log(`Admin API: ${checks} checks PASS`);
} finally { globalThis.fetch = originalFetch; Date.now = originalNow; }
