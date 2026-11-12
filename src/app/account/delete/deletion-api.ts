// Public client configuration only. The RPC verifies fresh OTP and auth.uid() itself.
const ORIGIN = "https://xmyksnpupebxkskydkes.supabase.co";
const PUBLIC_KEY = "sb_publishable_3yiCd0_cN9CVTYSEZkflLQ_KXTdoy2D";
// Email presentation only; the RPC still checks fresh OTP and explicit DELETE.
const EMAIL_CONTEXT = "https://twilight-codex.vercel.app/account/delete";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Transport = typeof fetch;

export class DeletionError extends Error {
  constructor(message: string, readonly uncertain = false) { super(message); }
}

export class DeletionAPI {
  private token = "";
  private account = "";
  private email = "";
  private expires = 0;
  private epoch = 0;
  private sending = false;
  private resendAt = 0;
  constructor(private transport: Transport = (input, init) => fetch(input, init)) {}

  private async request(path: string, body: unknown, token = "", mutation = false): Promise<unknown> {
    let response: Response;
    try {
      response = await this.transport(ORIGIN + path, {
        method: "POST", cache: "no-store", credentials: "omit", redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json", apikey: PUBLIC_KEY,
          ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
    } catch {
      throw new DeletionError(mutation ? "刪除結果尚未確認。請重試同一個刪除操作，不要當作已取消。" : "連線未完成，請稍後重試。", mutation);
    }
    let data: unknown;
    try { data = await response.json(); }
    catch { throw new DeletionError("服務回覆無法確認，請稍後重試。", mutation); }
    if (!response.ok) {
      const code = data && typeof data === "object" && "code" in data ? data.code : "";
      throw new DeletionError(response.status === 429 ? "操作過於頻繁，請稍候再試。"
        : code === "PGRST202" ? "刪帳服務尚未開放，請透過本頁聯絡信箱申請。"
        : mutation && response.status >= 500 ? "刪除結果尚未確認，請重試同一操作。"
        : mutation ? "刪除未完成或驗證已過期。請重新驗證信箱後再確認。"
        : "驗證未完成，請確認信箱、驗證碼或稍後重試。", mutation && response.status >= 500);
    }
    return data;
  }

  async sendCode(email: string): Promise<void> {
    email = email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DeletionError("請輸入有效的帳號 Email。");
    if (this.sending || Date.now() < this.resendAt) throw new DeletionError("請稍候再寄送驗證碼。");
    const epoch = this.epoch;
    this.sending = true;
    try {
      await this.request("/auth/v1/otp?redirect_to=" + encodeURIComponent(EMAIL_CONTEXT), { email, create_user: false });
      if (epoch !== this.epoch) throw new DeletionError("已取消，請重新開始。");
      this.email = email;
      this.resendAt = Date.now() + 60000;
    } finally { this.sending = false; }
  }

  async verify(code: string): Promise<void> {
    if (!this.email || !/^([0-9]{6}|[0-9]{8})$/.test(code.trim())) throw new DeletionError("請輸入信中的 6 或 8 位數字驗證碼。");
    const epoch = this.epoch;
    const data = await this.request("/auth/v1/verify", { email: this.email, token: code.trim(), type: "email" });
    if (epoch !== this.epoch) throw new DeletionError("已取消，請重新開始。");
    const value = data as { access_token?: unknown; expires_in?: unknown; user?: { id?: unknown; email?: unknown } } | null;
    if (!value || typeof value.access_token !== "string" || !value.access_token || value.access_token.length > 8192
        || typeof value.expires_in !== "number" || !Number.isFinite(value.expires_in) || value.expires_in <= 0
        || typeof value.user?.id !== "string" || !UUID.test(value.user.id)
        || typeof value.user.email !== "string" || value.user.email.toLowerCase() !== this.email) {
      throw new DeletionError("驗證回覆與申請帳號不符，請重新開始。");
    }
    // Never persist tokens, email or codes in browser storage, URLs or logs.
    this.token = value.access_token;
    this.account = value.user.id;
    this.expires = Date.now() + Math.min(value.expires_in, 540) * 1000;
  }

  async deleteAccount(confirmation: string): Promise<void> {
    if (confirmation !== "DELETE") throw new DeletionError("請輸入大寫 DELETE 確認。");
    if (!this.token || Date.now() >= this.expires) throw new DeletionError("驗證已過期，請重新驗證信箱。");
    const epoch = this.epoch;
    const data = await this.request("/rest/v1/rpc/tcg_delete_account", { p_confirmation: "DELETE" }, this.token, true);
    if (epoch !== this.epoch) throw new DeletionError("畫面已關閉，刪除結果未確認。", true);
    const value = data as { schema_version?: unknown; deleted?: unknown; account_id?: unknown } | null;
    if (!value || value.schema_version !== 1 || value.deleted !== true || value.account_id !== this.account) {
      throw new DeletionError("刪除回覆無法確認，請重試同一操作。", true);
    }
    this.clear();
  }

  clear(): void {
    this.epoch++;
    this.token = this.account = this.email = "";
    this.expires = 0;
  }
}
