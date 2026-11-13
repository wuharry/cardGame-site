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

const MFA_REQUIRED = "需要先完成雙重驗證，請重新登入。";
const MFA_UNAVAILABLE = "登入服務尚未開啟驗證 App（TOTP）雙重驗證，請到 Supabase Dashboard → Authentication → Multi-Factor 開啟後再登入。";
const TOTP_ISSUER = "紙鴉牌後台";

/** After the password (or email code), the console needs an authenticator code before any admin RPC. */
export type MfaStep =
  | { kind: "verify" }
  | { kind: "enroll"; qr: string; secret: string };

export class AdminAPI {
  private access = "";
  private refresh = "";
  private expiresAt = 0;
  private epoch = 0;
  private refreshing: Promise<void> | null = null;
  private signingInEpoch: number | null = null;
  private setupAccount = "";
  private setupVerifiedAt = 0;
  private factorId = "";
  private pendingSetup = false;
  private verified = false; // aal2: an authenticator code was accepted for this session.
  private expirationListeners = new Set<() => void>();

  onSessionExpired(listener: () => void) {
    this.expirationListeners.add(listener);
    return () => { this.expirationListeners.delete(listener); };
  }

  private async request(path: string, body: unknown, token = "", method: "POST" | "PUT" | "GET" | "DELETE" = "POST"): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${ORIGIN}${path}`, {
        method, headers: { apikey: PUBLIC_KEY, "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body),
        cache: "no-store", signal: AbortSignal.timeout(15000),
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
        : path.startsWith("/auth/v1/factors") && /not_enabled|disabled/.test(code) ? MFA_UNAVAILABLE
        : path.startsWith("/auth/v1/factors/") && path.endsWith("/verify") ? "驗證 App 的 6 位數驗證碼不正確或已過時，請輸入目前顯示的那一組。"
        : path.startsWith("/auth/v1/factors") ? "雙重驗證暫時無法完成，請重新登入再試。"
        : path.endsWith("/verify") ? "驗證碼不正確或已過期，請重新取得。"
        : path.endsWith("/otp") ? "無法寄送驗證碼，請確認管理者信箱或稍後再試。"
        : code === "same_password" ? "新密碼不可與目前密碼相同。"
        : code === "weak_password" ? "新密碼不符合帳號安全規則，請改用更強的密碼。"
        : code === "reauthentication_needed" ? "信箱驗證已到期，請重新驗證後設定密碼。"
        : response.status === 401 ? "登入已到期，請重新登入。" : "帳號操作未完成，請重新驗證後再試。";
      // The database gate settles membership first; only an administrator ever sees this.
      if (!authMessage && raw.includes("administrator mfa required")) throw new AdminError(MFA_REQUIRED, false, 401);
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

  async signIn(email: string, password: string): Promise<MfaStep> {
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

  async verifySetupCode(email: string, code: string): Promise<MfaStep> {
    const token = code.trim();
    if (!/^[0-9]{6,10}$/.test(token)) {
      throw new AdminError("請輸入信中的 6 至 10 位數字驗證碼。");
    }
    return this.authenticate("/auth/v1/verify", { email: this.normalizedEmail(email), token, type: "email" }, true);
  }

  private async revoke(token: string) {
    if (token) { try { await this.request("/auth/v1/logout?scope=local", {}, token); } catch { /* Memory is already cleared. */ } }
  }

  /** Accepts a token response, or revokes whatever it carried; a cancelled login never revives. */
  private async acceptTokens(result: unknown, current: number) {
    const tokens = result as { access_token?: unknown; refresh_token?: unknown; expires_in?: unknown } | null;
    const access = typeof tokens?.access_token === "string" ? tokens.access_token : "";
    if (current !== this.epoch) {
      await this.revoke(access);
      throw new AdminError("已取消登入，請重新登入。");
    }
    if (!access || access.length > 8192 || typeof tokens?.refresh_token !== "string" || !tokens.refresh_token
        || tokens.refresh_token.length > 8192 || typeof tokens.expires_in !== "number"
        || !Number.isFinite(tokens.expires_in) || tokens.expires_in <= 0 || tokens.expires_in > 86400) {
      await this.revoke(access);
      throw new AdminError("登入回覆不完整，請重新登入。");
    }
    this.access = access;
    this.refresh = tokens.refresh_token;
    this.expiresAt = Date.now() + tokens.expires_in * 1000;
  }

  private async authenticate(path: string, body: unknown, setup = false): Promise<MfaStep> {
    if (this.access || this.signingInEpoch !== null) throw new AdminError("請先結束目前的登入操作。");
    const current = this.epoch;
    this.signingInEpoch = current;
    try {
      await this.acceptTokens(await this.request(path, body), current);
      // Ask the database first: a non-administrator stops here and never enrolls a second factor.
      try { await this.request("/rest/v1/rpc/tcg_admin_session", {}, this.access); }
      catch (error) { if (!(error instanceof AdminError && error.message === MFA_REQUIRED)) throw error; }
      if (current !== this.epoch) throw new AdminError("已取消登入，請重新登入。");
      const step = await this.prepareFactor(current);
      this.pendingSetup = setup;
      return step;
    } catch (error) {
      if (current === this.epoch && this.access) await this.signOut();
      throw error;
    } finally {
      if (this.signingInEpoch === current) this.signingInEpoch = null;
    }
  }

  private async prepareFactor(current: number): Promise<MfaStep> {
    const user = await this.request("/auth/v1/user", undefined, this.access, "GET") as
      { factors?: { id?: unknown; factor_type?: unknown; status?: unknown }[] } | null;
    if (current !== this.epoch) throw new AdminError("已取消登入，請重新登入。");
    const totp = (Array.isArray(user?.factors) ? user.factors : [])
      .filter(f => f?.factor_type === "totp" && typeof f.id === "string" && /^[0-9a-f-]{36}$/.test(f.id));
    const ready = totp.find(f => f.status === "verified");
    if (ready) { this.factorId = ready.id as string; return { kind: "verify" }; }
    // An abandoned enrollment was never proven; replace it so its QR code cannot be finished later.
    for (const stale of totp) await this.request(`/auth/v1/factors/${stale.id}`, undefined, this.access, "DELETE");
    const enrolled = await this.request("/auth/v1/factors", {
      factor_type: "totp", issuer: TOTP_ISSUER, friendly_name: `${TOTP_ISSUER} ${new Date().toISOString().slice(0, 16)}`,
    }, this.access) as { id?: unknown; totp?: { qr_code?: unknown; secret?: unknown } } | null;
    if (current !== this.epoch) throw new AdminError("已取消登入，請重新登入。");
    const svg = typeof enrolled?.totp?.qr_code === "string" ? enrolled.totp.qr_code : "";
    const secret = typeof enrolled?.totp?.secret === "string" ? enrolled.totp.secret : "";
    if (typeof enrolled?.id !== "string" || !/^[0-9a-f-]{36}$/.test(enrolled.id)
        || !/^[A-Z2-7]{16,128}=*$/.test(secret) || svg.length > 200000
        || !(svg.startsWith("<svg") || svg.startsWith("data:image/svg+xml"))) {
      throw new AdminError("驗證 App 設定回覆不完整，請重新登入。");
    }
    this.factorId = enrolled.id;
    // Shown only as an <img> data URI, never injected as markup.
    const qr = svg.startsWith("data:") ? svg : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return { kind: "enroll", qr, secret };
  }

  /** Proves the authenticator code; only then does the console receive an administrator session. */
  async completeMfa(code: string): Promise<AdminSession> {
    const totp = code.replace(/\s/g, "");
    if (!/^[0-9]{6}$/.test(totp)) throw new AdminError("請輸入驗證 App 上的 6 位數字。");
    if (!this.access || !this.factorId || this.verified || this.signingInEpoch !== null) {
      throw new AdminError("請重新登入。", false, 401);
    }
    const current = this.epoch;
    this.signingInEpoch = current;
    let wrongCode = false;
    try {
      const challenge = await this.request(`/auth/v1/factors/${this.factorId}/challenge`, {}, this.access) as { id?: unknown } | null;
      if (current !== this.epoch) throw new AdminError("已取消登入，請重新登入。");
      if (typeof challenge?.id !== "string" || !/^[0-9a-f-]{36}$/.test(challenge.id)) {
        throw new AdminError("雙重驗證暫時無法完成，請重新登入再試。");
      }
      let verified: unknown;
      try {
        verified = await this.request(`/auth/v1/factors/${this.factorId}/verify`,
          { challenge_id: challenge.id, code: totp }, this.access);
      } catch (error) {
        // A wrong code keeps the password step; the administrator just types the next code.
        wrongCode = error instanceof AdminError && [400, 422].includes(error.status);
        throw error;
      }
      await this.acceptTokens(verified, current);
      this.verified = true;
      const session = await this.rpc<AdminSession>("tcg_admin_session", {});
      if (!session?.account_id || !session.email || !["viewer", "operator"].includes(session.access_level)) {
        throw new AdminError("管理權限回覆不完整，請重新登入。");
      }
      if (this.pendingSetup) { this.setupAccount = session.account_id; this.setupVerifiedAt = Date.now(); }
      this.pendingSetup = false;
      return session;
    } catch (error) {
      if (!wrongCode && current === this.epoch && this.access) await this.signOut();
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
      // No administrator RPC leaves the browser before the authenticator code is accepted.
      if (!this.access || !this.verified) throw new AdminError("請先登入。", false, 401);
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
    this.factorId = ""; this.pendingSetup = false; this.verified = false;
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
  matches: { match_id: string; completed_at: string; opponent_id: string | null; outcome: string; reason: string }[];
  last_submitted_deck: { deck_id: string; cards: Record<string, number>; submitted_at: string } | null;
  audit: { request_id: string; actor_id: string; action: string; reason: string; before_value: unknown; after_value: unknown; created_at: string }[];
};
