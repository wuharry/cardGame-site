// This is the same PUBLIC publishable configuration shipped in the game.
// Privileged access is checked by the database's administrator allowlist on every RPC.
const ORIGIN = "https://xmyksnpupebxkskydkes.supabase.co";
const PUBLIC_KEY = "sb_publishable_3yiCd0_cN9CVTYSEZkflLQ_KXTdoy2D";

export class AdminError extends Error {
  constructor(message: string, readonly uncertain = false, readonly status = 0) { super(message); }
}

export type Change = {
  p_request: string; p_account: string;
  p_action: "grant_tickets" | "grant_card" | "suspend" | "restore" | "send_mail";
  p_payload: { amount?: number; card_id?: string; title?: string; body?: string }; p_reason: string;
};

export class AdminAPI {
  private access = "";
  private refresh = "";
  private expiresAt = 0;
  private epoch = 0;
  private refreshing: Promise<void> | null = null;

  private async request(path: string, body: unknown, token = ""): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${ORIGIN}${path}`, {
        method: "POST", headers: { apikey: PUBLIC_KEY, "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15000),
      });
    } catch { throw new AdminError("連線未完成。若是補發操作，請重試同一筆，不要重新建立操作。", true); }
    let data: unknown;
    try { data = await response.json(); }
    catch { throw new AdminError("服務回覆無法辨識，請重試同一筆操作。", true, response.status); }
    if (!response.ok) {
      const error = data as { code?: string; message?: string; msg?: string; error_description?: string };
      const raw = error.message ?? error.msg ?? error.error_description ?? "服務拒絕這次操作";
      const message = error.code === "42501" ? "這個帳號沒有玩家管理權限。"
        : error.code === "PGRST202" ? "管理資料庫尚未安裝，請先完成後台遷移。"
        : raw.includes("card copy cap") ? "補發後會超過同卡三張，資料沒有變更。"
        : raw.includes("wallet not initialized") ? "玩家尚未初始化收藏，請先讓他在遊戲登入並同步收藏。"
        : raw.includes("request conflict") ? "操作編號已用於不同內容，請查核操作紀錄。"
        : response.status === 401 ? "登入已到期，請重新登入。" : raw;
      // Auth/rate-limit/schema failures cannot disprove a previous committed attempt.
      // Only a recognized business rejection may discard a persisted mutation UUID.
      throw new AdminError(message, !["22023", "23514"].includes(error.code ?? ""), response.status);
    }
    return data;
  }

  async sendCode(email: string) {
    // Signup is allowed, just as in the game. It creates NO management permission.
    // Only an owner-created invitation + Auth-verified email can activate an administrator.
    return this.request("/auth/v1/otp", { email, create_user: true });
  }

  async signIn(email: string, code: string) {
    const token = code.trim();
    // Email OTP supports 6–10 digits. Reject passwords before making an Auth request.
    if (!/^[0-9]{6,10}$/.test(token)) {
      throw new AdminError("請輸入信中的 6 至 10 位數字驗證碼。此處不接受信箱或其他服務的密碼。");
    }
    const result = await this.request("/auth/v1/verify", { email, token, type: "email" }) as {
      access_token?: string; refresh_token?: string; expires_in?: number;
    };
    if (!result.access_token || !result.refresh_token) throw new AdminError("登入回覆不完整。");
    this.access = result.access_token;
    this.refresh = result.refresh_token;
    this.expiresAt = Date.now() + (result.expires_in ?? 3600) * 1000;
    try { return await this.rpc<AdminSession>("tcg_admin_session", {}); }
    catch (error) { await this.signOut(); throw error; }
  }

  async rpc<T>(name: string, body: unknown): Promise<T> {
    const current = this.epoch;
    if (!this.access) throw new AdminError("請先登入。", false, 401);
    if (Date.now() > this.expiresAt - 60000) {
      if (!this.refreshing) {
        this.refreshing = (async () => {
          const refreshed = await this.request("/auth/v1/token?grant_type=refresh_token", {
            refresh_token: this.refresh,
          }) as { access_token: string; refresh_token: string; expires_in: number };
          if (current !== this.epoch) throw new AdminError("已登出，取消舊請求。");
          if (!refreshed.access_token || !refreshed.refresh_token) throw new AdminError("請重新登入。", false, 401);
          this.access = refreshed.access_token; this.refresh = refreshed.refresh_token;
          this.expiresAt = Date.now() + refreshed.expires_in * 1000;
        })().finally(() => { this.refreshing = null; });
      }
      await this.refreshing;
    }
    const result = await this.request(`/rest/v1/rpc/${name}`, body, this.access);
    if (current !== this.epoch) throw new AdminError("已登出，取消舊請求。");
    return result as T;
  }

  async signOut() {
    const token = this.access;
    this.epoch++; this.access = ""; this.refresh = ""; this.expiresAt = 0;
    if (token) { try { await this.request("/auth/v1/logout?scope=local", {}, token); } catch { /* Local session is already gone. */ } }
  }

  async change(change: Change) {
    if (change.p_action === "send_mail") {
      return this.rpc("tcg_admin_send_mail", {
        p_request: change.p_request, p_account: change.p_account, p_title: change.p_payload.title,
        p_body: change.p_payload.body, p_tickets: change.p_payload.amount, p_reason: change.p_reason,
      });
    }
    return this.rpc("tcg_admin_change", change);
  }
}

export type PlayerMail = {
  id: string; title: string; body: string; pack_tickets: number; sender_id: string; reason: string;
  created_at: string; claimed_at: string | null; tickets_before: number | null; tickets_after: number | null;
};
export type PlayerMailList = { items: PlayerMail[]; total: number };

export type AdminSession = { account_id: string; email: string; access_level: "viewer" | "operator" };
export type Player = {
  id: string; email: string; created_at: string; email_confirmed_at: string | null;
  last_sign_in_at: string | null; suspended: boolean; has_wallet: boolean;
  pack_tickets: number | null; starter_draws_remaining: number | null;
  card_types: number; card_copies: number;
};
export type PlayerList = { registered: number; total: number; page: number; page_size: number; players: Player[] };
export type PlayerDetail = {
  user: Player;
  wallet: { pack_tickets: number; starter_draws_remaining: number; opened_packs: number; last_claim_day: string | null } | null;
  collection: Record<string, number>;
  restriction: { suspended: boolean; reason?: string };
  record: { wins: number; losses: number; draws: number; total: number };
  receipts: { source: string; request_id: string; created_at: string; draw_count: number; pack_id: string; card_ids: string[] }[];
  matches: { match_id: string; completed_at: string; opponent_id: string; outcome: string; reason: string }[];
  last_submitted_deck: { deck_id: string; cards: Record<string, number>; submitted_at: string } | null;
  audit: { request_id: string; actor_id: string; action: string; reason: string; before_value: unknown; after_value: unknown; created_at: string }[];
};
