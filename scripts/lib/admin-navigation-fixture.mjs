// Installed only in the isolated browser-test copy. Never included in the website build.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function installAdminNavigationFixture(scratch, fixtures) {
  const directory = join(scratch, "src/app/fixture-backend/[...path]");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "route.ts"), `
export const dynamic = "force-dynamic";
const fixtures = ${JSON.stringify(fixtures)};
const runtime = globalThis as typeof globalThis & {
  navigationFixture?: { mode: string; requests: { name: string; request?: string }[] };
};
const state = () => runtime.navigationFixture ??= { mode: "normal", requests: [] };
const user = { id: "navigation-player", email: "navigation-player@example.invalid", created_at: fixtures.dashboard.generated_at,
  email_confirmed_at: fixtures.dashboard.generated_at, last_sign_in_at: fixtures.dashboard.generated_at, suspended: false,
  has_wallet: true, pack_tickets: 2, starter_draws_remaining: 0, card_types: 1, card_copies: 1 };
export async function GET() {
  const current = state();
  return new Response('<!doctype html><html lang="zh-TW"><meta charset="utf-8"><title>Local admin fixture controls</title><body style="font:16px system-ui;max-width:900px;margin:40px auto"><h1>Local admin fixture controls</h1><p>Synthetic data only. Login: fixture-admin@example.invalid / synthetic-password-only</p><p>Current mode: ' + current.mode + '</p><form method="post"><label>Response mode <select name="mode"><option>normal</option><option>denied</option><option>delayed-denial</option><option>uncertain-change</option><option>slow-cards</option><option>clear-log</option></select></label> <button>Apply</button></form><p><a href="/admin#card-stats">Open admin</a></p><h2>Requests</h2><pre>' + JSON.stringify(current.requests, null, 2) + '</pre></body></html>', { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const name = new URL(request.url).pathname.split("/").at(-1);
  const current = state();
  if (name === "control") {
    const mode = new URLSearchParams(await request.text()).get("mode") ?? "normal";
    if (mode === "clear-log") current.requests = [];
    else if (["normal", "denied", "delayed-denial", "uncertain-change", "slow-cards"].includes(mode)) current.mode = mode;
    return new Response(null, { status: 303, headers: { Location: "/fixture-backend/control" } });
  }
  const body = await request.json();
  current.requests.push({ name: name ?? "unknown", ...(typeof body.p_request === "string" ? { request: body.p_request } : {}) });
  const mode = current.mode;
  if (name === "token") return Response.json({ access_token: "synthetic-access", refresh_token: "synthetic-refresh", expires_in: 3600 });
  if (name === "logout") return Response.json({});
  if (name === "tcg_admin_session") return Response.json({ account_id: "fixture-admin", email: "fixture-admin@example.invalid", access_level: "operator" });
  if (name === "tcg_admin_card_stats") {
    if (["delayed-denial", "slow-cards"].includes(mode)) await new Promise(resolve => setTimeout(resolve, 6000));
    if (["delayed-denial", "denied"].includes(mode)) return Response.json({ code: "42501", message: "Synthetic permission revoked" }, { status: 403 });
    return Response.json(fixtures.cards);
  }
  if (name === "tcg_admin_play_dashboard") return Response.json(fixtures.dashboard);
  if (name === "tcg_admin_match_analytics") return Response.json(fixtures.duration);
  if (name === "tcg_admin_players") return Response.json({ registered: 2, total: 1, page: 0, page_size: 25, players: [user] });
  if (name === "tcg_admin_player") return Response.json({ user, wallet: { pack_tickets: 2, starter_draws_remaining: 0, opened_packs: 1, last_claim_day: null }, collection: { soldier: 1 }, restriction: { suspended: false }, record: { wins: 1, losses: 0, draws: 0, total: 1 }, receipts: [], matches: [], last_submitted_deck: null, audit: [] });
  if (name === "tcg_admin_player_mail") return Response.json({ items: [], total: 0 });
  if (name === "tcg_admin_guest_players") return Response.json({ players: [], page: 0, total: 0 });
  if (name === "tcg_admin_player_rates") return Response.json({ players: [{ ...user, wins: 1, losses: 0, draws: 0, total: 1, win_rate: 100, loss_rate: 0, verified_match_online: false }], page: 0 });
  if (name === "tcg_admin_change") return mode === "uncertain-change" ? Response.json({ message: "Synthetic uncertain operation" }, { status: 503 }) : Response.json({});
  return Response.json({ message: "Unknown synthetic endpoint" }, { status: 404 });
}
`);
}
