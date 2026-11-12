"use client";

import { useEffect, useRef, useState } from "react";
import { AdminAPI, AdminError } from "./admin-api";
import { DeviceModes } from "./growth-visuals";
import type { ModeCounters } from "./play-analytics-types";
import styles from "./admin.module.css";

export type DemoRequest = { id: string; install_id: string; account_id: string | null; email: string | null;
  state: "pending" | "granted" | "declined"; amount: number; created_at: string; resolved_at: string | null;
  history_linked: boolean; audit: { actor_id: string; payload: { reason: string }; result: { diamonds_before: number; diamonds_after: number }; created_at: string }[] };
export type DemoQueue = { enabled: boolean; pending_count: number; total: number; items: DemoRequest[] };
type Intent = { rpc: "tcg_admin_demo_review" | "tcg_admin_demo_enabled"; args: Record<string, unknown>; label: string };
const date = (value: string) => new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

export function readDemoQueue(value: unknown): DemoQueue {
  const data = value as DemoQueue;
  if (!data || typeof data.enabled !== "boolean" || !Number.isSafeInteger(data.pending_count) || data.pending_count < 0
    || !Number.isSafeInteger(data.total) || data.total < 0 || !Array.isArray(data.items)
    || !data.items.every(r => r && uuid(r.id) && uuid(r.install_id) && (r.account_id === null || uuid(r.account_id))
      && (r.email === null || typeof r.email === "string") && ["pending", "granted", "declined"].includes(r.state)
      && Number.isSafeInteger(r.amount) && r.amount >= 0 && r.amount <= 100000
      && typeof r.history_linked === "boolean" && typeof r.created_at === "string" && Array.isArray(r.audit)))
    throw new Error("鑽石申請資料格式不符。");
  return data;
}

export function reviewIntent(row: DemoRequest, approve: boolean, amount: number, reason: string, operation: string): Intent {
  if (!uuid(operation) || row.state !== "pending" || reason.trim().length < 3 || reason.trim().length > 300
    || (approve && (!row.account_id || !Number.isSafeInteger(amount) || amount < 1 || amount > 100000)))
    throw new Error("請確認帳號錢包、數量與處理原因。");
  return { rpc: "tcg_admin_demo_review", label: `${row.email ?? `遊客 ${row.install_id.slice(0, 8).toUpperCase()}`} · ${approve ? `發放 ${amount} 鑽石` : "結束申請"}`,
    args: { p_request: operation, p_application: row.id, p_account: row.account_id, p_amount: approve ? amount : 0,
      p_reason: reason.trim(), p_approve: approve } };
}

export default function DemoRequests({ api, actor, operator, visible, account, disabled, onExpired, onCount, onPending, onOpenAccount, onReviewed }: {
  api: AdminAPI; actor: string; operator: boolean; visible: boolean; account: string | null; disabled: boolean;
  onExpired: () => void; onCount: (count: number | null) => void; onPending: (pending: boolean) => void;
  onOpenAccount: (account: string) => void; onReviewed: (account: string | null) => void;
}) {
  const key = `twilight-demo-review:${actor}`;
  const [journal] = useState(() => {
    if (typeof window === "undefined") return { value: null as Intent | null, error: "" };
    try {
      const saved = sessionStorage.getItem(key);
      if (!saved) return { value: null as Intent | null, error: "" };
      const value = JSON.parse(saved) as Intent;
      if (!["tcg_admin_demo_review", "tcg_admin_demo_enabled"].includes(value.rpc) || !uuid(value.args?.p_request) || typeof value.label !== "string") throw new Error();
      return { value, error: "" };
    } catch { return { value: null as Intent | null, error: "待確認操作紀錄無法辨識，請保留紀錄並請作者檢查，勿重新補發。" }; }
  });
  const [result, setResult] = useState<{ scope: string; value: DemoQueue } | null>(null);
  const [note, setNote] = useState("");
  const [page, setPage] = useState(0);
  const scope = `${account ?? "all"}:${account ? 0 : page}`;
  const data = result?.scope === scope ? result.value : null;
  const [revision, setRevision] = useState(0);
  const [selection, setSelected] = useState<DemoRequest | null>(null);
  const selected = selection && (!account || selection.account_id === account) ? selection : null;
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("");
  const [intent, setIntent] = useState<Intent | null>(journal.value);
  const [attempted, setAttempted] = useState(!!journal.value);
  const [working, setWorking] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const callbacks = useRef({ onExpired, onCount, onPending, onReviewed });
  useEffect(() => { callbacks.current = { onExpired, onCount, onPending, onReviewed }; });
  useEffect(() => { callbacks.current.onPending(!!journal.value || !!journal.error); }, [journal]);
  useEffect(() => {
    const run = ++generation.current;
    let loading = false;
    const load = async () => {
      if (loading || document.hidden || disabled || lock.current) return;
      loading = true;
      try {
        const next = readDemoQueue(await api.rpc("tcg_admin_demo_diamonds", { p_page: account ? 0 : page, p_account: account }));
        if (run !== generation.current) return;
        setResult({ scope, value: next }); setNote(""); callbacks.current.onCount(next.pending_count);
      } catch (e) {
        if (run !== generation.current) return;
        setResult(null); callbacks.current.onCount(null);
        if (e instanceof AdminError && [401, 403].includes(e.status)) callbacks.current.onExpired();
        else setNote(e instanceof AdminError && e.status === 404 ? "鑽石申請尚未啟用（等待資料庫更新）。" : "申請查詢失敗，請重試。");
      } finally { loading = false; }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => { generation.current = run + 1; window.clearInterval(timer); };
  }, [api, account, page, revision, disabled, scope]);

  const prepare = (next: Intent) => {
    if (journal.error) return;
    setAttempted(false); setIntent(next); callbacks.current.onPending(true);
  };
  const confirm = async () => {
    if (!intent || lock.current || journal.error) return;
    lock.current = true; setWorking(true); setNote("");
    const run = generation.current;
    try {
      // Persist before sending, so a lost response/reload always retries the same reviewed operation.
      sessionStorage.setItem(key, JSON.stringify(intent)); setAttempted(true);
      await api.rpc(intent.rpc, intent.args);
      if (run !== generation.current) return;
      sessionStorage.removeItem(key); setIntent(null); setSelected(null); setReason("");
      callbacks.current.onPending(false); setRevision(v => v + 1);
      setNote("處理完成，已留下操作紀錄。");
      callbacks.current.onReviewed(typeof intent.args.p_account === "string" ? intent.args.p_account : null);
    } catch (e) {
      if (run !== generation.current) return;
      if (e instanceof AdminError && [401, 403].includes(e.status)) { callbacks.current.onExpired(); return; }
      if (e instanceof AdminError && !e.uncertain) {
        sessionStorage.removeItem(key); setIntent(null); callbacks.current.onPending(false);
      }
      setNote(e instanceof Error ? e.message : "結果未確認，請重試同一筆操作。");
    } finally { lock.current = false; setWorking(false); }
  };
  return <section hidden={!visible && !intent} className={styles.panel} aria-label="Demo 鑽石申請">
    <div className={styles.toolbar}><div><h2>Demo 鑽石申請</h2><p className={styles.note}>先註冊建立錢包，再由作者決定發放。每位帳號／遊客限一筆 Demo 申請。</p></div>
      <span className={styles.statePill}>{data ? data.enabled ? "Demo 開放中" : "已關閉申請" : "狀態待確認"}</span></div>
    {journal.error && <p role="alert" className={styles.message}>{journal.error}</p>}
    {note && <p role="status" className={styles.message}>{note}</p>}
    {intent ? <div className={styles.confirmation}>
      <h3>確認：{intent.label}</h3><p>{String(intent.args.p_reason)}</p>
      <small>操作編號 {String(intent.args.p_request)}</small>
      <button className={styles.primary} disabled={working || disabled} onClick={() => void confirm()}>{working ? "處理中…" : attempted ? "確認／重試原操作" : "確認執行"}</button>
      {!attempted && <button onClick={() => { setIntent(null); callbacks.current.onPending(false); }}>取消</button>}
      <p className={styles.note}>發放會直接入帳；連線中斷時重試原操作，不會重複發放。</p>
    </div> : <>
      <div className={styles.demoRequests}>{data?.items.map(row => <article key={row.id} className={styles.demoRequest}>
        <div className={styles.demoDiamond} aria-hidden="true">◇</div>
        <div><strong>{row.email ?? `遊客 · ${row.install_id.slice(0, 8).toUpperCase()}`}</strong>
          <small>{date(row.created_at)} · 申請 {row.id.slice(0, 8).toUpperCase()}</small>
          <span className={styles.statePill} data-ready={row.state === "pending" && !!row.account_id}>
            {row.state === "granted" ? `已發放 ${row.amount} 鑽石` : row.state === "declined" ? "已結束" : row.account_id ? "可發放" : "待建立錢包"}</span>
          {row.history_linked && <small>已同意關聯試玩紀錄</small>}
        </div>
        <div className={styles.demoActions}>
          {row.account_id && <button disabled={disabled} onClick={() => onOpenAccount(row.account_id!)}>玩家檔案</button>}
          {operator && row.state === "pending" && <button disabled={disabled} onClick={() => { setSelected(row); setReason(""); setAmount(100); }}>處理申請</button>}
          {!!row.audit.length && <details><summary>處理紀錄</summary>{row.audit.map((a, i) => <p key={i}>{date(a.created_at)} · {a.payload.reason}<small>{a.actor_id}</small><small>鑽石 {a.result.diamonds_before} → {a.result.diamonds_after}</small></p>)}</details>}
        </div>
      </article>)}</div>
      {data?.total === 0 && <p className={styles.empty}>目前沒有申請。</p>}
      {selected && <form className={styles.manageForm} onSubmit={event => { event.preventDefault(); try {
        prepare(reviewIntent(selected, true, amount, reason, crypto.randomUUID()));
      } catch (e) { setNote((e as Error).message); } }}>
        <h3>{selected.email ?? "遊客申請"}</h3>
        {!selected.account_id && <p className={styles.note}>這位遊客尚未建立帳號錢包，現在不能發放。註冊接上申請後即可處理。</p>}
        <label>鑽石數量<input type="number" min={1} max={100000} step={1} required value={amount} disabled={!data?.enabled || !selected.account_id || disabled}
          onChange={e => setAmount(Number(e.target.value))} /></label>
        <label className={styles.reason}>處理原因<input required minLength={3} maxLength={300} value={reason} disabled={disabled} onChange={e => setReason(e.target.value)} /></label>
        <button disabled={!data?.enabled || !selected.account_id || disabled}>檢查發放內容</button>
        <button type="button" disabled={disabled || reason.trim().length < 3} onClick={() => {
          try { prepare(reviewIntent(selected, false, 0, reason, crypto.randomUUID())); } catch (e) { setNote((e as Error).message); }
        }}>不發放，結束申請</button>
        <button type="button" onClick={() => setSelected(null)}>取消</button>
      </form>}
      {!account && <footer className={styles.pagination}>
        <button disabled={disabled || page === 0} onClick={() => setPage(p => p - 1)}>上一頁</button>
        <span>{data?.pending_count ?? "—"} 筆待處理 · 第 {page + 1} 頁</span>
        <button disabled={disabled || !data || (page + 1) * 25 >= data.total} onClick={() => setPage(p => p + 1)}>下一頁</button>
        <button disabled={disabled} onClick={() => setRevision(v => v + 1)}>重新整理</button>
      </footer>}
      {operator && data && !account && <details className={styles.helpDetails}><summary>Demo 功能開關</summary>
        <p>關閉後遊戲隱藏入口，伺服器也拒絕新申請及發放；歷史紀錄、已發鑽石保留。</p>
        <button disabled={disabled} onClick={() => prepare({ rpc: "tcg_admin_demo_enabled", label: data.enabled ? "結束 Demo 鑽石申請" : "重新開放 Demo 鑽石申請",
          args: { p_request: crypto.randomUUID(), p_enabled: !data.enabled, p_reason: data.enabled ? "Demo 結束，停止申請與發放" : "Demo 開放，恢復申請與發放" } })}>{data.enabled ? "關閉 Demo 功能…" : "重新開放…"}</button>
      </details>}
    </>}
  </section>;
}

export function LinkedGuestHistory({ api, account, onExpired }: { api: AdminAPI; account: string; onExpired: () => void }) {
  const [rows, setRows] = useState<{ install_id: string; consented_at: string; stats: { play_seconds: number; modes: Record<string, ModeCounters> } }[]>([]);
  const [note, setNote] = useState("");
  useEffect(() => {
    let active = true;
    void api.rpc<typeof rows>("tcg_admin_linked_guest_history", { p_account: account }).then(value => {
      if (active) setRows(value);
    }).catch(e => { if (active) {
      if (e instanceof AdminError && [401, 403].includes(e.status)) onExpired();
      else setNote("遊客紀錄關聯尚未啟用或暫時無法查詢。");
    } });
    return () => { active = false; };
  }, [api, account, onExpired]);
  return <details className={styles.helpDetails}><summary>已同意關聯的遊客試玩紀錄</summary>
    {note && <p>{note}</p>}{!rows.length && !note && <p>尚無已關聯紀錄；不代表沒有試玩。</p>}
    {rows.map(row => <div key={row.install_id}><strong>Traveler-{row.install_id.slice(0, 8).toUpperCase()}</strong>
      <small>同意時間 {date(row.consented_at)} · 遊玩 {Math.round(row.stats.play_seconds / 60)} 分鐘</small><DeviceModes modes={row.stats.modes} /></div>)}
    <p className={styles.note}>玩家自行回報的裝置紀錄，與專服正式戰績分開；共用裝置可能包含其他人的遊玩。</p>
  </details>;
}
