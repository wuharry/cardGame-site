"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AdminAPI, AdminError, type AdminSession, type Change, type PlayerDetail, type PlayerList } from "./admin-api";
import cards from "./card-names.json";
import styles from "./admin.module.css";
import PlayAnalytics from "./play-analytics";

const date = (value?: string | null) => value ? new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "—";
const name = (id: string) => (cards as Record<string, string>)[id] ?? id;
const actions = { grant_tickets: "補發包券", grant_card: "補發卡牌", suspend: "停權對戰", restore: "恢復對戰" };
const outcome = { win: "勝", loss: "敗", draw: "平手" };

export default function AdminConsole() {
  const [api] = useState(() => new AdminAPI());
  const lock = useRef(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [list, setList] = useState<PlayerList | null>(null);
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [tab, setTab] = useState("collection");
  const [action, setAction] = useState<Change["p_action"]>("grant_tickets");
  const [amount, setAmount] = useState(1);
  const [cardId, setCardId] = useState(Object.keys(cards)[0]);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<Change | null>(null);
  const [attempted, setAttempted] = useState(false);

  const journalKey = (id: string) => `twilight-admin-pending:${id}`;

  const loadList = async (page = 0) => {
    const data = await api.rpc<PlayerList>("tcg_admin_players", { p_search: search.trim(), p_page: page, p_page_size: 25 });
    setList(data);
  };

  const work = async (fn: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try { await fn(); }
    catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失敗，請稍後重試。");
      if (error instanceof AdminError && error.status === 401) {
        await api.signOut(); setSession(null); setDetail(null); setList(null); setPending(null);
      }
    } finally { lock.current = false; setBusy(false); }
  };

  const login = async () => {
    const s = await api.signIn(email.trim(), code.trim());
    setSession(s); setCode(""); await loadList();
    const saved = sessionStorage.getItem(journalKey(s.account_id));
    if (saved) {
      try {
        const change = JSON.parse(saved) as Change;
        if (!change.p_request || !change.p_account || !Object.hasOwn(actions, change.p_action)) throw new Error("invalid journal");
        setDetail(await api.rpc<PlayerDetail>("tcg_admin_player", { p_account: change.p_account }));
        setPending(change); setAttempted(true);
        setMessage("找到一筆尚未確認的操作，請重試同一筆以確認結果。");
      } catch (error) { throw new AdminError(error instanceof Error ? `待確認操作無法恢復：${error.message}` : "待確認操作無法恢復。"); }
    }
  };

  const prepareChange = () => {
    if (!detail || pending || reason.trim().length < 3) return;
    if (["grant_tickets", "grant_card"].includes(action) && (!Number.isInteger(amount) || amount < 1 || amount > (action === "grant_card" ? 3 : 100))) {
      setMessage("請填有效的整數數量。"); return;
    }
    setAttempted(false);
    setPending({ p_request: crypto.randomUUID(), p_account: detail.user.id, p_action: action,
      p_payload: action === "grant_card" ? { amount, card_id: cardId } : action === "grant_tickets" ? { amount } : {},
      p_reason: reason.trim() });
  };

  const commitChange = async () => {
    if (!pending) return;
    // Save only the mutation intent, never JWTs. Reload resumes the same UUID for this administrator.
    sessionStorage.setItem(journalKey(session!.account_id), JSON.stringify(pending));
    setAttempted(true);
    try {
      await api.rpc("tcg_admin_change", pending);
    } catch (error) {
      // Network ambiguity retains the exact request and UUID. Recognized business rejection is final.
      if (error instanceof AdminError && !error.uncertain) {
        sessionStorage.removeItem(journalKey(session!.account_id)); setPending(null);
      }
      throw error;
    }
    const target = pending.p_account;
    sessionStorage.removeItem(journalKey(session!.account_id));
    setPending(null); setReason("");
    setMessage("操作完成並已留下紀錄。");
    setDetail(await api.rpc<PlayerDetail>("tcg_admin_player", { p_account: target }));
    await loadList(list?.page ?? 0);
  };

  return <main className={styles.root}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>TWILIGHT CODEX / OPERATIONS</p><h1>玩家管理</h1>
        <p>正式帳號、收藏與對戰紀錄</p></div>
      <div className={styles.headerRight}><Link href="/">回官網</Link>{session && <>
        <span>{session.email}</span><button disabled={busy || !!pending} onClick={() => void work(async () => {
          await api.signOut(); setSession(null); setList(null); setDetail(null); setSent(false);
        })}>登出</button></>}</div>
    </header>
    {message && <p role="status" className={styles.message}>{message}</p>}
    {!session ? <section className={styles.login}>
      <span className={styles.badge}>管理者登入</span><h2>用遊戲帳號登入</h2>
      <p>輸入已授權的 Email，使用暮色秘典寄出的數字驗證碼登入。一般玩家帳號無法查閱其他人的資料。</p>
      <p id="admin-login-help" className={styles.note}>此頁僅使用 Email 一次性驗證碼。請勿輸入 Google、Steam 或信箱密碼。</p>
      <form onSubmit={(event) => { event.preventDefault(); void work(sent ? login : async () => {
        if (Date.now() < resendAt) { setMessage("請等一分鐘再寄送驗證碼。"); return; }
        await api.sendCode(email.trim()); setSent(true); setResendAt(Date.now() + 60000);
        setMessage("驗證碼已寄出，請查看信箱。");
      }); }}>
        <label>Email<input type="email" name="email" autoComplete="email" required value={email} disabled={busy || sent}
          onChange={(event) => setEmail(event.target.value)} /></label>
        {sent && <label>Email 數字驗證碼<input type="text" name="verification-code" autoComplete="one-time-code" inputMode="numeric"
          pattern="[0-9]{6,10}" minLength={6} maxLength={10} aria-describedby="admin-login-help" required value={code}
          onChange={(event) => setCode(event.target.value)} /></label>}
        <button className={styles.primary} disabled={busy}>{busy ? "處理中…" : sent ? "登入管理後台" : "寄送驗證碼"}</button>
        {sent && <button type="button" disabled={busy} onClick={() => { setSent(false); setCode(""); }}>修改 Email／重新寄送</button>}
      </form>
      <p className={styles.note}>此頁查詢正式雲端資料。未註冊的本機訪客不列入註冊玩家。</p>
    </section> : <>
      <PlayAnalytics api={api} disabled={busy || !!pending} onExpired={() => {
        void api.signOut(); setSession(null); setList(null); setDetail(null); setPending(null);
        setMessage("登入或管理權限已失效，請重新登入。");
      }} />
      <section className={styles.summary}>
        <div><span>Auth 帳號（含管理者）</span><strong>{list?.registered ?? "—"}</strong></div>
        <div><span>本次搜尋結果</span><strong>{list?.total ?? "—"}</strong></div>
        <div><span>管理權限</span><strong>{session.access_level === "operator" ? "查詢與管理" : "唯讀查詢"}</strong></div>
      </section>
      <section className={styles.panel}>
        <div className={styles.toolbar}><h2>註冊玩家</h2><form onSubmit={(e) => { e.preventDefault(); void work(() => loadList()); }}>
          <input aria-label="搜尋 Email 或玩家 ID" placeholder="搜尋 Email 或玩家 ID" value={search} maxLength={100}
            onChange={(e) => setSearch(e.target.value)} disabled={busy || !!pending} />
          <button disabled={busy || !!pending}>搜尋／更新</button></form></div>
        <div className={styles.tableScroll}><table><thead><tr><th>Email／玩家 ID</th><th>註冊／最近登入</th><th>驗證</th><th>收藏</th><th>包券／剩餘新手抽數</th><th>對戰</th><th /></tr></thead>
          <tbody>{list?.players.map((player) => <tr key={player.id} className={detail?.user.id === player.id ? styles.selected : ""}>
            <td>{player.email}<small>{player.id}</small></td><td>{date(player.created_at)}<small>{date(player.last_sign_in_at)}</small></td>
            <td>{player.email_confirmed_at ? "已驗證" : "未驗證"}</td><td>{player.has_wallet ? `${player.card_types} 種 · ${player.card_copies} 張` : "尚未初始化"}</td>
            <td>{player.pack_tickets ?? "—"} ／ {player.starter_draws_remaining ?? "—"}</td><td>{player.suspended ? "停權" : "正常"}</td>
            <td><button disabled={busy || !!pending} onClick={() => void work(async () => {
              setDetail(await api.rpc<PlayerDetail>("tcg_admin_player", { p_account: player.id }));
              setTab("collection"); setReason("");
            })}>查看資料</button></td></tr>)}</tbody></table></div>
        {list?.players.length === 0 && <p className={styles.empty}>沒有符合條件的註冊玩家。</p>}
        <footer className={styles.pagination}><button disabled={busy || !!pending || !list || list.page === 0}
          onClick={() => void work(() => loadList((list?.page ?? 1) - 1))}>上一頁</button>
          <span>第 {(list?.page ?? 0) + 1} 頁</span><button disabled={busy || !!pending || !list || (list.page + 1) * list.page_size >= list.total}
            onClick={() => void work(() => loadList((list?.page ?? 0) + 1))}>下一頁</button></footer>
      </section>
      {detail && <section className={styles.panel}>
        <div className={styles.toolbar}><div><p className={styles.eyebrow}>PLAYER RECORD</p><h2>{detail.user.email}</h2><small>{detail.user.id}</small></div>
          <span className={styles.badge}>{detail.restriction.suspended ? "對戰已停權" : "對戰正常"}</span></div>
        <div className={styles.detailStats}>
          <span>註冊 {date(detail.user.created_at)}</span><span>最近登入 {date(detail.user.last_sign_in_at)}</span>
          <span>包券 {detail.wallet?.pack_tickets ?? "尚未初始化"}</span><span>新手抽數 {detail.wallet?.starter_draws_remaining ?? "尚未初始化"}</span>
          <span>戰績 {detail.record.wins} 勝／{detail.record.losses} 敗／{detail.record.draws} 平</span>
        </div>
        {detail.restriction.reason && <p>停權／恢復原因：{detail.restriction.reason}</p>}
        <nav aria-label="玩家資料分類" className={styles.tabs}>{[
          ["collection", "持有卡牌"], ["receipts", "抽卡紀錄"], ["matches", "對局紀錄"], ["deck", "最近對局牌組"], ["audit", "管理操作紀錄"],
        ].map(([key, label]) => <button aria-pressed={tab === key} onClick={() => setTab(key)} key={key}>{label}</button>)}</nav>
        {tab === "collection" && <><p className={styles.note}>雲端持有量，不是玩家端自行回報。</p><div className={styles.cardGrid}>
          {Object.entries(detail.collection).sort((a, b) => name(a[0]).localeCompare(name(b[0]), "zh-TW")).map(([id, copies]) =>
            <div key={id}><span>{name(id)}<small>{id}</small></span><strong>×{copies}</strong></div>)}</div>
          {!Object.keys(detail.collection).length && <p className={styles.empty}>玩家目前沒有持有卡牌。</p>}</>}
        {tab === "receipts" && <div className={styles.tableScroll}><table><thead><tr><th>時間</th><th>來源／數量</th><th>結果</th></tr></thead><tbody>
          {detail.receipts.map((r) => <tr key={r.source + r.request_id}><td>{date(r.created_at)}</td><td>{r.source === "starter" ? "新手抽卡" : r.pack_id} · {r.draw_count} 張</td>
            <td>{r.card_ids.map(name).join("、")}</td></tr>)}</tbody></table>{!detail.receipts.length && <p className={styles.empty}>尚無抽卡紀錄。</p>}</div>}
        {tab === "matches" && <div className={styles.tableScroll}><table><thead><tr><th>時間</th><th>結果</th><th>對手 ID</th><th>結束原因</th></tr></thead><tbody>
          {detail.matches.map((m) => <tr key={m.match_id}><td>{date(m.completed_at)}</td><td>{outcome[m.outcome as keyof typeof outcome] ?? m.outcome}</td><td>{m.opponent_id}</td><td>{m.reason === "disconnect" ? "離開／斷線" : "擊敗"}</td></tr>)}</tbody></table>
          {!detail.matches.length && <p className={styles.empty}>尚無正式對局紀錄。</p>}</div>}
        {tab === "deck" && <><p className={styles.note}>牌組草稿仍保存在玩家本機。這裡是最近一次通過伺服器入場驗證的牌表，可能與目前草稿不同。</p>
          {detail.last_submitted_deck ? <><p>{detail.last_submitted_deck.deck_id} · {date(detail.last_submitted_deck.submitted_at)}</p><div className={styles.cardGrid}>
            {Object.entries(detail.last_submitted_deck.cards).map(([id, copies]) => <div key={id}><span>{name(id)}</span><strong>×{copies}</strong></div>)}</div></>
            : <p className={styles.empty}>尚無通過驗證的對局牌組。</p>}</>}
        {tab === "audit" && <div className={styles.tableScroll}><table><thead><tr><th>時間／操作</th><th>原因／操作者</th><th>前 → 後</th></tr></thead><tbody>
          {detail.audit.map((a) => <tr key={a.request_id}><td>{date(a.created_at)}<small>{actions[a.action as keyof typeof actions] ?? a.action}</small></td>
            <td>{a.reason}<small>{a.actor_id}</small></td><td><code>{JSON.stringify(a.before_value)} → {JSON.stringify(a.after_value)}</code></td></tr>)}</tbody></table>
          {!detail.audit.length && <p className={styles.empty}>尚無管理操作。</p>}</div>}
        {session.access_level === "operator" && <section className={styles.management}>
          <h3>管理操作</h3><p className={styles.note}>補發需填原因，每笔保留前後數量與操作者。停權阻止新的正式對戰入場，不刪除帳號或收藏，也不強制中斷已開始的對局。</p>
          {pending ? <div className={styles.confirmation}>
            <strong>確認對 {detail.user.email} 執行「{actions[pending.p_action]}」</strong>
            <p>{pending.p_payload.card_id && `${name(pending.p_payload.card_id)} · `}{pending.p_payload.amount && `${pending.p_payload.amount} 份`} · {pending.p_reason}</p>
            <small>操作編號：{pending.p_request}</small>
            <button className={styles.primary} disabled={busy} onClick={() => void work(commitChange)}>{busy ? "處理中…" : "確認／重試同一筆操作"}</button>
            {!attempted && <button disabled={busy} onClick={() => setPending(null)}>取消</button>}
            <p className={styles.note}>如果出現連線未完成，請按同一個按鈕重試。確認結果前保留此筆，避免重複補發。</p>
          </div> : <form onSubmit={(e) => { e.preventDefault(); prepareChange(); }} className={styles.manageForm}>
            <label>操作<select value={action} disabled={busy} onChange={(e) => { setAction(e.target.value as Change["p_action"]); setAmount(1); }}>
              {Object.entries(actions).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
            {action === "grant_card" && <label>卡牌<select value={cardId} disabled={busy} onChange={(e) => setCardId(e.target.value)}>
              {Object.entries(cards).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>}
            {["grant_tickets", "grant_card"].includes(action) && <label>數量<input type="number" min={1} max={action === "grant_card" ? 3 : 100} value={amount}
              onChange={(e) => setAmount(Number(e.target.value))} disabled={busy} required /></label>}
            <label className={styles.reason}>原因<input minLength={3} maxLength={300} required value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} /></label>
            <button disabled={busy || (["grant_tickets", "grant_card"].includes(action) && !detail.wallet)}>檢查操作內容</button>
          </form>}
        </section>}
      </section>}
    </>}
    <footer className={styles.footnote}>資料時間以台北顯示 · 登入後才查詢私人資料 · 最近抽卡／對局／操作各顯示 30 筆</footer>
  </main>;
}
