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
  private signingInEpoch: number | null = null;
  private setupAccount = "";
  private setupVerifiedAt = 0;
  private expirationListeners = new Set<() => void>();

  onSessionExpired(listener: () => void) {
    this.expirationListeners.add(listener);
    return () => { this.expirationListeners.delete(listener); };
  }

  private async request(path: string, body: unknown, token = "", method: "POST" | "PUT" = "POST"): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${ORIGIN}${path}`, {
        method, headers: { apikey: PUBLIC_KEY, "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15000),
      });
    } catch { throw new AdminError(path === "/auth/v1/user"
      ? "密碼設定結果未確認，請回到登入頁試用新密碼。"
      : path.startsWith("/auth/v1/") ? "連線未完成，請稍後重試。"
      : "連線未完成。若是補發操作，請重試同一筆，不要重新建立操作。", true); }
    let data: unknown;
    try { data = await response.json(); }
    catch { throw new AdminError(path === "/auth/v1/user"
      ? "密碼設定結果未確認，請回到登入頁試用新密碼。"
      : "服務回覆無法辨識，請稍後重試。", true, response.status); }
    if (!response.ok) {
      const error = data && typeof data === "object"
        ? data as { code?: string; error_code?: string; message?: string; msg?: string; error_description?: string } : {};
      const code = typeof error.error_code === "string" ? error.error_code : typeof error.code === "string" ? error.code : "";
      const raw = error.message ?? error.msg ?? error.error_description ?? "服務拒絕這次操作";
      const authMessage = !path.startsWith("/auth/v1/") ? ""
        : response.status === 429 ? "操作過於頻繁，請稍後再試。"
        : response.status >= 500 ? "登入服務暫時無法使用，請稍後再試。"
        : path.includes("grant_type=password") ? "帳號或管理後台密碼不正確。"
        : path.endsWith("/verify") ? "驗證碼不正確或已過期，請重新取得。"
        : path.endsWith("/otp") ? "無法寄送驗證碼，請確認管理者信箱或稍後再試。"
        : code === "same_password" ? "新密碼不可與目前密碼相同。"
        : code === "weak_password" ? "新密碼不符合帳號安全規則，請改用更強的密碼。"
        : code === "reauthentication_needed" ? "信箱驗證已到期，請重新驗證後設定密碼。"
        : response.status === 401 ? "登入已到期，請重新登入。" : "帳號操作未完成，請重新驗證後再試。";
      const message = authMessage || (code === "42501" ? "這個帳號沒有玩家管理權限。"
        : code === "PGRST202" ? "管理資料庫尚未安裝，請先完成後台遷移。"
        : raw.includes("card copy cap") ? "補發後會超過同卡三張，資料沒有變更。"
        : raw.includes("wallet not initialized") ? "玩家尚未初始化收藏，請先讓他在遊戲登入並同步收藏。"
        : raw.includes("request conflict") ? "操作編號已用於不同內容，請查核操作紀錄。"
        : response.status === 401 ? "登入已到期，請重新登入。" : raw);
      // Auth/rate-limit/schema failures cannot disprove a previous committed attempt.
      // Only a recognized business rejection may discard a persisted mutation UUID.
      throw new AdminError(message, !["22023", "23514"].includes(code), response.status);
    }
    return data;
  }

  private normalizedEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new AdminError("請輸入有效的管理者 Email。");
    }
    return normalized;
  }

  async signIn(email: string, password: string) {
    if (!password || password.length > 4096) throw new AdminError("請輸入管理後台密碼。");
    // Passwords are exact values: never trim or reinterpret them as an OTP.
    return this.authenticate("/auth/v1/token?grant_type=password", {
      email: this.normalizedEmail(email), password,
    });
  }

  async sendSetupCode(email: string) {
    if (this.access || this.signingInEpoch !== null) throw new AdminError("請先結束目前的登入操作。");
    // Recovery can authenticate an existing owner, never register a new account.
    return this.request("/auth/v1/otp", { email: this.normalizedEmail(email), create_user: false });
  }

  async verifySetupCode(email: string, code: string) {
    const token = code.trim();
    if (!/^[0-9]{6,10}$/.test(token)) {
      throw new AdminError("請輸入信中的 6 至 10 位數字驗證碼。");
    }
    return this.authenticate("/auth/v1/verify", { email: this.normalizedEmail(email), token, type: "email" }, true);
  }

  private async revoke(token: string) {
    if (token) { try { await this.request("/auth/v1/logout?scope=local", {}, token); } catch { /* Memory is already cleared. */ } }
  }

  private async authenticate(path: string, body: unknown, setup = false): Promise<AdminSession> {
    if (this.access || this.signingInEpoch !== null) throw new AdminError("請先結束目前的登入操作。");
    const current = this.epoch;
    this.signingInEpoch = current;
    try {
      const result = await this.request(path, body) as {
        access_token?: unknown; refresh_token?: unknown; expires_in?: unknown;
      } | null;
      const access = typeof result?.access_token === "string" ? result.access_token : "";
      if (current !== this.epoch) {
        await this.revoke(access);
        throw new AdminError("已取消登入，請重新登入。");
      }
      if (!access || access.length > 8192 || typeof result?.refresh_token !== "string" || !result.refresh_token
          || result.refresh_token.length > 8192 || typeof result.expires_in !== "number"
          || !Number.isFinite(result.expires_in) || result.expires_in <= 0 || result.expires_in > 86400) {
        await this.revoke(access);
        throw new AdminError("登入回覆不完整，請重新登入。");
      }
      this.access = access;
      this.refresh = result.refresh_token;
      this.expiresAt = Date.now() + result.expires_in * 1000;
      const session = await this.rpc<AdminSession>("tcg_admin_session", {});
      if (!session?.account_id || !session.email || !["viewer", "operator"].includes(session.access_level)) {
        throw new AdminError("管理權限回覆不完整，請重新登入。");
      }
      if (setup) { this.setupAccount = session.account_id; this.setupVerifiedAt = Date.now(); }
      return session;
    } catch (error) {
      if (current === this.epoch && this.access) await this.signOut();
      throw error;
    } finally {
      if (this.signingInEpoch === current) this.signingInEpoch = null;
    }
  }

  async updatePassword(password: string) {
    if (password.length < 12) throw new AdminError("新密碼至少需要 12 個字元。");
    if (new TextEncoder().encode(password).length > 72) throw new AdminError("新密碼過長，請縮短後重試。");
    if (!this.setupAccount || Date.now() - this.setupVerifiedAt > 10 * 60 * 1000) {
      throw new AdminError("請先重新驗證管理者信箱。", false, 401);
    }
    const current = this.epoch;
    // Recheck the database role immediately before changing this same Auth user.
    const session = await this.rpc<AdminSession>("tcg_admin_session", {});
    if (current !== this.epoch) throw new AdminError("已取消密碼設定，請重新驗證。");
    if (session.account_id !== this.setupAccount) throw new AdminError("管理帳號已改變，請重新驗證。", false, 401);
    const result = await this.request("/auth/v1/user", { password }, this.access, "PUT") as { id?: string } | null;
    if (current !== this.epoch) throw new AdminError("已取消密碼設定，請使用新密碼確認登入。");
    if (result?.id !== this.setupAccount) throw new AdminError("密碼設定結果未確認，請回到登入頁試用新密碼。", true);
    // Prove the next visit uses password login; setup credentials never persist.
    await this.signOut();
  }

  async rpc<T>(name: string, body: unknown): Promise<T> {
    const current = this.epoch;
    try {
      if (!this.access) throw new AdminError("請先登入。", false, 401);
      if (Date.now() > this.expiresAt - 60000) {
        if (!this.refreshing) {
          const refreshing = (async () => {
            const refreshed = await this.request("/auth/v1/token?grant_type=refresh_token", {
              refresh_token: this.refresh,
            }) as { access_token: string; refresh_token: string; expires_in: number };
            if (current !== this.epoch) throw new AdminError("已登出，取消舊請求。", true);
            if (!refreshed.access_token || !refreshed.refresh_token) throw new AdminError("請重新登入。", false, 401);
            this.access = refreshed.access_token; this.refresh = refreshed.refresh_token;
            this.expiresAt = Date.now() + refreshed.expires_in * 1000;
          })();
          this.refreshing = refreshing;
          void refreshing.finally(() => { if (this.refreshing === refreshing) this.refreshing = null; }).catch(() => {});
        }
        await this.refreshing;
      }
      const result = await this.request(`/rest/v1/rpc/${name}`, body, this.access);
      if (current !== this.epoch) throw new AdminError("已登出，取消舊請求。", true);
      return result as T;
    } catch (error) {
      // A response can arrive after its page has unmounted. Only the matching
      // login may invalidate the shared console; an old login must not affect a new one.
      if (current === this.epoch && error instanceof AdminError && [401, 403].includes(error.status)) {
        for (const listener of this.expirationListeners) listener();
      }
      throw error;
    }
  }

  async signOut() {
    const token = this.access;
    this.epoch++; this.access = ""; this.refresh = ""; this.expiresAt = 0;
    this.refreshing = null; this.signingInEpoch = null; this.setupAccount = ""; this.setupVerifiedAt = 0;
    await this.revoke(token);
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
export type PlayerCommerce = {
  initialized: true; gold: number; diamonds: number; equipped_emotes: string[];
  owned_emotes: { id: string; text: string; acquired_at: string; request_id: string }[];
  transactions: { request_id: string; action: string; item_id: string; item_text: string | null;
    terminal_error: string; created_at: string; gold_before: number; gold_after: number;
    price: number | null; expected_price: number | null; diamonds_before: number | null; diamonds_after: number | null }[];
};
export type PlayerDetail = {
  commerce?: PlayerCommerce | null;
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
