"use client";

import { useEffect, useRef, useState } from "react";
import { DeletionAPI } from "./deletion-api";

export function DeletionForm() {
  const api = useRef<DeletionAPI | null>(null);
  const pending = useRef(false);
  const [step, setStep] = useState<"email" | "code" | "confirm" | "deleted">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "mt-2 block min-h-12 w-full rounded border border-rule-soft bg-ink px-4 text-parchment focus:outline-2 focus:outline-brass-hi";
  const action = "min-h-12 rounded border border-brass-hi px-5 py-3 text-parchment disabled:cursor-not-allowed disabled:opacity-45";
  useEffect(() => {
    api.current = new DeletionAPI();
    return () => { api.current?.clear(); api.current = null; };
  }, []);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !api.current) return;
    pending.current = true;
    setBusy(true); setMessage("");
    try {
      if (step === "email") {
        await api.current.sendCode(email);
        setStep("code"); setMessage("若帳號存在，驗證碼已寄出。請查看信箱；這一步不會建立新帳號。");
      } else if (step === "code") {
        await api.current.verify(code);
        setCode(""); setStep("confirm"); setMessage("信箱已驗證。確認下方帳號與刪除範圍後，才能永久刪除。");
      } else if (step === "confirm") {
        await api.current.deleteAccount(confirmation);
        setCode(""); setConfirmation(""); setEmail(""); setStep("deleted");
        setMessage("帳號及相關雲端資料已刪除。請移除其他裝置上的離線資料與自行保存的備份。");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "操作未完成，請稍後重試。"); }
    finally { pending.current = false; setBusy(false); }
  }

  return <form onSubmit={submit} className="mt-8 rounded border border-rule-soft bg-board p-5 sm:p-8" aria-busy={busy}>
    <p className="text-sm text-brass-hi">{step === "email" ? "1 / 3 · 帳號信箱" : step === "code" ? "2 / 3 · 驗證信箱" : step === "confirm" ? "3 / 3 · 最後確認" : "刪除完成"}</p>
    {step === "email" && <label className="mt-5 block text-parchment">帳號 Email
      <input className={input} type="email" autoComplete="email" maxLength={254} required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} />
    </label>}
    {step !== "email" && step !== "deleted" && <p className="mt-5 break-all text-parchment">申請帳號：{email.trim().toLowerCase()}</p>}
    {step === "code" && <label className="mt-5 block text-parchment">Email 驗證碼
      <input className={input} inputMode="numeric" autoComplete="one-time-code" pattern="([0-9]{6}|[0-9]{8})" maxLength={8} required disabled={busy} value={code} onChange={e => setCode(e.target.value)} />
    </label>}
    {step === "confirm" && <>
      <p className="mt-5 border-l-2 border-red-300 pl-4 leading-7 text-red-100">帳號、收藏、金幣、鑽石、外觀、獎勵與個人進度會永久刪除，不能復原。這不是登出或暫停帳號。</p>
      <label className="mt-5 block text-parchment">輸入大寫 DELETE 確認
        <input className={input} autoComplete="off" spellCheck={false} maxLength={6} required disabled={busy} value={confirmation} onChange={e => setConfirmation(e.target.value)} />
      </label>
    </>}
    <p role="status" aria-live="polite" className="mt-5 break-words leading-7 text-quill">{busy ? "正在處理，請稍候…" : message}</p>
    {step !== "deleted" && <div className="mt-6 flex flex-wrap gap-4">
      <button className={`${action} ${step === "confirm" ? "border-red-300 bg-red-950/50" : "bg-brass/20"}`} disabled={busy || (step === "confirm" && confirmation !== "DELETE")}>
        {step === "email" ? "寄送驗證碼" : step === "code" ? "驗證信箱" : "永久刪除我的帳號"}
      </button>
      {step !== "email" && <button type="button" className={action} disabled={busy} onClick={() => {
        api.current?.clear(); setCode(""); setConfirmation(""); setStep("email"); setMessage("");
      }}>返回／重新驗證</button>}
    </div>}
  </form>;
}
