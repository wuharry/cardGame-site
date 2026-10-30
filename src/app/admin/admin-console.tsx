"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Link from "next/link";
import { AdminAPI, AdminError, type AdminSession, type Change, type PlayerDetail, type PlayerList, type PlayerMailList } from "./admin-api";
import cards from "./card-names.json";
import styles from "./admin.module.css";
import PlayAnalytics from "./play-analytics";
import PlayerCommerce from "./player-commerce";
import { PlayerCards, ManaCurve } from "./player-cards";
import { WinLossBar } from "./dashboard-visuals";
import { recentStreak } from "./dashboard-metrics";
import AdminNavigation, { adminPages, pageFromHash, type AdminPage } from "./admin-navigation";
import CardStatsPanel from "./card-stats";
import MatchDuration from "./match-duration";

const date = (value?: string | null) => value ? new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "—";
const name = (id: string) => (cards as Record<string, string>)[id] ?? id;
const actions = { grant_tickets: "補發包券", grant_card: "補發卡牌", send_mail: "寄送禮物信件", suspend: "停權對戰", restore: "恢復對戰" };
const outcome = { win: "勝", loss: "敗", draw: "平手" };

export default function AdminConsole() {
  const [api] = useState(() => new AdminAPI());
  const lock = useRef(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setup, setSetup] = useState(false);
  const [setupSession, setSetupSession] = useState<AdminSession | null>(null);
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
  const [mailTitle, setMailTitle] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mail, setMail] = useState<PlayerMailList | null>(null);
  const [mailOffset, setMailOffset] = useState(0);
  const [page, setPage] = useState<AdminPage>("analytics");
  const activePage = useRef<AdminPage>("analytics");

  const clearPrivateState = () => {
    setSession(null); setSetupSession(null); setSetup(false); setSent(false);
    setPassword(""); setConfirmPassword(""); setCode("");
    setList(null); setDetail(null); setMail(null); setMailOffset(0); setSearch("");
    setPending(null); setAttempted(false); setReason(""); setMailTitle(""); setMailBody("");
    setTab("collection"); setAction("grant_tickets"); setAmount(1); setCardId(Object.keys(cards)[0]);
  };

  const expired = () => {
    clearPrivateState(); void api.signOut();
    setMessage("登入或管理權限已失效，請重新登入。");
  };

  const loadMail = async (account: string, offset = 0) => {
    setMail(await api.rpc<PlayerMailList>("tcg_admin_player_mail", { p_account: account, p_offset: offset }));
    setMailOffset(offset);
  };

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
      if (error instanceof AdminError && [401, 403].includes(error.status)) {
        clearPrivateState();
        await api.signOut();
      }
    } finally { lock.current = false; setBusy(false); }
  };

  const writePage = (next: AdminPage, replace = false) => {
    activePage.current = next; setPage(next);
    if (replace) window.history.replaceState(null, "", `#${next}`);
    else window.history.pushState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const selectPage = (next: AdminPage) => {
    if (lock.current || pending || next === activePage.current) return;
    writePage(next);
    if (session && next === "players" && !list) void work(() => loadList());
  };

  const synchronizePage = useEffectEvent(() => {
    const next = pageFromHash(window.location.hash);
    if (next === activePage.current) return;
    // History navigation must not hide an operation whose outcome is still uncertain.
    if ((session && lock.current) || pending) {
      window.history.replaceState(null, "", `#${activePage.current}`);
      return;
    }
    activePage.current = next; setPage(next); window.scrollTo({ top: 0, behavior: "instant" });
    if (session && next === "players" && !list) void work(() => loadList());
  });

  const expireSession = useEffectEvent(expired);
  useEffect(() => api.onSessionExpired(() => expireSession()), [api]);

  useEffect(() => {
    const synchronize = () => synchronizePage();
    window.addEventListener("popstate", synchronize);
    window.addEventListener("hashchange", synchronize);
    return () => {
      window.removeEventListener("popstate", synchronize);
      window.removeEventListener("hashchange", synchronize);
    };
  }, []);

  const login = async () => {
    const requestedPage = pageFromHash(window.location.hash);
    const credential = password;
    setPassword(""); setConfirmPassword("");
    const s = await api.signIn(email.trim(), credential);
    setSession(s); setCode("");
    writePage(requestedPage, true);
    const saved = sessionStorage.getItem(journalKey(s.account_id));
    if (saved) {
      try {
        const change = JSON.parse(saved) as Change;
        if (!change.p_request || !change.p_account || !Object.hasOwn(actions, change.p_action)) throw new Error("invalid journal");
        writePage("players", true);
        setDetail(await api.rpc<PlayerDetail>("tcg_admin_player", { p_account: change.p_account }));
        setPending(change); setAttempted(true);
        setMessage("找到一筆尚未確認的操作，請重試同一筆以確認結果。");
      } catch (error) {
        if (error instanceof AdminError && [401, 403].includes(error.status)) throw error;
        throw new AdminError(error instanceof Error ? `待確認操作無法恢復：${error.message}` : "待確認操作無法恢復。");
      }
    }
    if (requestedPage === "players" || saved) await loadList();
  };

  const cancelSetup = async () => {
    setSetup(false); setSetupSession(null); setSent(false);
    setPassword(""); setConfirmPassword(""); setCode("");
    await api.signOut();
  };

  const setupPassword = async () => {
    if (!sent) {
      if (Date.now() < resendAt) { setMessage("請等一分鐘再寄送驗證碼。"); return; }
      await api.sendSetupCode(email.trim()); setSent(true); setResendAt(Date.now() + 60000);
      setMessage("驗證碼已寄出，請查看管理者信箱。");
    } else if (!setupSession) {
      const verified = await api.verifySetupCode(email.trim(), code.trim());
      setSetupSession(verified); setCode("");
      setMessage("管理者身分已驗證，請設定管理後台專用密碼。");
    } else {
      const credential = password;
      const confirmed = confirmPassword;
      setPassword(""); setConfirmPassword("");
      if (credential !== confirmed) throw new AdminError("兩次輸入的密碼不同，請重新輸入。");
      await api.updatePassword(credential);
      setSetup(false); setSetupSession(null); setSent(false); setCode("");
      setMessage("密碼已設定，請使用 Email 與新密碼登入。");
    }
  };

  const prepareChange = () => {
    if (!detail || pending || reason.trim().length < 3) return;
    if (["grant_tickets", "grant_card", "send_mail"].includes(action) && (!Number.isInteger(amount) || amount < 1 || amount > (action === "grant_card" ? 3 : 100))) {
      setMessage("請填有效的整數數量。"); return;
    }
    if (action === "send_mail" && (!mailTitle.trim() || !mailBody.trim() || mailTitle.trim().length > 80 || mailBody.trim().length > 2000)) {
      setMessage("請填信件標題（最多 80 字）及內容（最多 2000 字）。"); return;
    }
    setAttempted(false);
    setPending({ p_request: crypto.randomUUID(), p_account: detail.user.id, p_action: action,
      p_payload: action === "send_mail" ? { amount, title: mailTitle.trim(), body: mailBody.trim() }
        : action === "grant_card" ? { amount, card_id: cardId } : action === "grant_tickets" ? { amount } : {},
      p_reason: reason.trim() });
  };

  const commitChange = async () => {
    if (!pending) return;
    // Save only the mutation intent, never JWTs. Reload resumes the same UUID for this administrator.
    sessionStorage.setItem(journalKey(session!.account_id), JSON.stringify(pending));
    setAttempted(true);
    try {
      await api.change(pending);
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
    if (pending.p_action === "send_mail") {
      await loadMail(target); setTab("mail"); setMailTitle(""); setMailBody("");
      setMessage("禮物信件已寄出。玩家須在遊戲信箱領取後，包券才會入帳。");
    }
    await loadList(list?.page ?? 0);
  };

  const currentPage = adminPages.find(item => item.id === page)!;
  return <main className={`${styles.root} ${session ? styles.workspace : ""}`}>
    {session && <AdminNavigation page={page} disabled={busy || !!pending} pending={!!pending} onSelect={selectPage} />}
    <div className={styles.workspaceContent}>
    <header className={styles.header}>
      <h1>{session ? currentPage.label : "管理後台"}</h1>
      <div className={styles.headerRight}><Link href="/">回官網</Link>{session && <>
        <span>{session.email}</span><button disabled={busy || !!pending} onClick={() => void work(async () => {
          await api.signOut(); clearPrivateState();
        })}>登出</button></>}</div>
    </header>
    {message && <p role="status" className={styles.message}>{message}</p>}
    {!session ? <section className={styles.login}>
      <h2>{setup ? "設定管理者密碼" : "管理者登入"}</h2>
      <p id="admin-login-help" className={styles.note}>{setup
        ? "驗證已授權信箱後設定密碼，至少 12 個字元。"
        : "請用後台專用密碼，不是 Google／Gmail 密碼。"}</p>
      <form onSubmit={(event) => { event.preventDefault(); void work(setup ? setupPassword : login); }}>
        <label>管理者 Email<input type="email" name="email" autoComplete="username" autoCapitalize="none" required value={email}
          disabled={busy || (setup && sent)} maxLength={254}
          onChange={(event) => setEmail(event.target.value)} /></label>
        {setup && sent && !setupSession && <label>Email 數字驗證碼<input type="text" name="verification-code" autoComplete="one-time-code" inputMode="numeric"
          pattern="[0-9]{6,10}" minLength={6} maxLength={10} aria-describedby="admin-login-help" required value={code}
          disabled={busy} onChange={(event) => setCode(event.target.value)} /></label>}
        {(!setup || setupSession) && <label>{setup ? "新密碼" : "管理後台密碼"}
          <input type="password" name="password" autoComplete={setup ? "new-password" : "current-password"}
            aria-describedby="admin-login-help" minLength={setup ? 12 : undefined} maxLength={setup ? 72 : 4096}
            required value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} /></label>}
        {setup && setupSession && <label>確認新密碼<input type="password" name="confirm-password" autoComplete="new-password"
          minLength={12} maxLength={72} required value={confirmPassword} disabled={busy}
          onChange={(event) => setConfirmPassword(event.target.value)} /></label>}
        <button className={styles.primary} disabled={busy}>{busy ? "處理中…" : !setup ? "登入管理後台"
          : !sent ? "寄送設定驗證碼" : !setupSession ? "驗證管理者身分" : "儲存新密碼"}</button>
        {setup ? <>
          {sent && !setupSession && <button type="button" disabled={busy} onClick={() => { setSent(false); setCode(""); setMessage(""); }}>
            修改 Email／重新寄送</button>}
          <button type="button" disabled={busy} onClick={() => void work(cancelSetup)}>返回帳號密碼登入</button>
        </> : <button type="button" disabled={busy} onClick={() => {
          setSetup(true); setPassword(""); setConfirmPassword(""); setCode(""); setMessage("");
        }}>首次設定／忘記密碼</button>}
      </form>
    </section> : <>
      {(page === "analytics" || page === "guests" || page === "player-rates") &&
        <PlayAnalytics key={page} view={page} api={api} disabled={busy || !!pending} onExpired={expired} />}
      {page === "card-stats" && <CardStatsPanel api={api} disabled={busy || !!pending} onExpired={expired} />}
      {page === "match-duration" && <MatchDuration api={api} disabled={busy || !!pending} onExpired={expired} />}
      {page === "players" && <>
      <section className={styles.summary}>
        <div><span>帳號總數（含管理者）</span><strong>{list?.registered ?? "—"}</strong></div>
        <div><span>搜尋結果</span><strong>{list?.total ?? "—"}</strong></div>
        <div><span>管理權限</span><strong>{session.access_level === "operator" ? "查詢與管理" : "唯讀查詢"}</strong></div>
      </section>
      <section id="players" className={styles.panel}>
        <div className={styles.toolbar}><h2>註冊玩家</h2><form onSubmit={(e) => { e.preventDefault(); void work(() => loadList()); }}>
          <input aria-label="搜尋 Email 或玩家 ID" placeholder="搜尋 Email 或玩家 ID" value={search} maxLength={100}
            onChange={(e) => setSearch(e.target.value)} disabled={busy || !!pending} />
          <button disabled={busy || !!pending}>搜尋</button></form></div>
        <div className={styles.tableScroll}><table><thead><tr><th>Email／玩家 ID</th><th>註冊／最近登入</th><th>驗證</th><th>收藏</th><th>包券／剩餘新手抽數</th><th>對戰</th><th /></tr></thead>
          <tbody>{list?.players.map((player) => <tr key={player.id} className={detail?.user.id === player.id ? styles.selected : ""}>
            <td>{player.email}<small>{player.id}</small></td><td>{date(player.created_at)}<small>{date(player.last_sign_in_at)}</small></td>
            <td>{player.email_confirmed_at ? "已驗證" : "未驗證"}</td><td>{player.has_wallet ? `${player.card_types} 種 · ${player.card_copies} 張` : "尚未初始化"}</td>
            <td>{player.pack_tickets ?? "—"} ／ {player.starter_draws_remaining ?? "—"}</td><td>{player.suspended ? "停權" : "正常"}</td>
            <td><button disabled={busy || !!pending} onClick={() => void work(async () => {
              setDetail(await api.rpc<PlayerDetail>("tcg_admin_player", { p_account: player.id }));
              setTab("collection"); setReason(""); setMail(null); setMailOffset(0);
            })}>查看資料</button></td></tr>)}</tbody></table></div>
        {list?.players.length === 0 && <p className={styles.empty}>沒有符合條件的註冊玩家。</p>}
        <footer className={styles.pagination}><button disabled={busy || !!pending || !list || list.page === 0}
          onClick={() => void work(() => loadList((list?.page ?? 1) - 1))}>上一頁</button>
          <span>第 {(list?.page ?? 0) + 1} 頁</span><button disabled={busy || !!pending || !list || (list.page + 1) * list.page_size >= list.total}
            onClick={() => void work(() => loadList((list?.page ?? 0) + 1))}>下一頁</button></footer>
      </section>
      {detail && <section className={styles.panel}>
        <div className={styles.toolbar}><div><h2>{detail.user.email}</h2><small>{detail.user.id}</small></div>
          <span className={styles.badge}>{detail.restriction.suspended ? "對戰已停權" : "對戰正常"}</span></div>
        <div className={styles.detailStats}>
          <span>註冊 {date(detail.user.created_at)}</span><span>最近登入 {date(detail.user.last_sign_in_at)}</span>
          <span>包券 {detail.wallet?.pack_tickets ?? "尚未初始化"}</span><span>新手抽數 {detail.wallet?.starter_draws_remaining ?? "尚未初始化"}</span>
          <span>戰績 {detail.record.wins} 勝／{detail.record.losses} 敗／{detail.record.draws} 平</span>
        </div>
        <div className={styles.playerPerformance}><WinLossBar wins={detail.record.wins} losses={detail.record.losses} draws={detail.record.draws} />
          {recentStreak(detail.matches).wins >= 2 && <span className={styles.streakBadge}>近期紀錄{recentStreak(detail.matches).limited ? "至少 " : " "}{recentStreak(detail.matches).wins} 連勝</span>}
        </div>
        {detail.restriction.reason && <p>停權／恢復原因：{detail.restriction.reason}</p>}
        <nav aria-label="玩家資料分類" className={styles.tabs}>{[
          ["commerce", "商店與資產"], ["collection", "持有卡牌"], ["receipts", "抽卡紀錄"], ["matches", "對局紀錄"], ["deck", "最近對局牌組"], ["audit", "管理操作紀錄"], ["mail", "禮物信件"],
        ].map(([key, label]) => <button disabled={busy} aria-pressed={tab === key} onClick={() => {
          setTab(key); if (key === "mail") void work(() => loadMail(detail.user.id));
        }} key={key}>{label}</button>)}</nav>
        {tab === "mail" && <div>
          <p className={styles.note}>附件於玩家領取後入帳，每封信限領一次。</p>
          <div className={styles.tableScroll}><table><thead><tr><th>時間／標題</th><th>內容／附件</th><th>領取狀態</th><th>原因／發送者</th></tr></thead><tbody>
            {mail?.items.map((m) => <tr key={m.id}><td>{date(m.created_at)}<small>{m.title}</small><small>{m.id}</small></td>
              <td>{m.body}<small>卡包券 × {m.pack_tickets}</small></td>
              <td>{m.claimed_at ? `已領取 ${date(m.claimed_at)}` : "待玩家領取"}<small>{m.claimed_at && `${m.tickets_before} → ${m.tickets_after} 包券`}</small></td>
              <td>{m.reason}<small>{m.sender_id}</small></td></tr>)}</tbody></table></div>
          {mail?.total === 0 && <p className={styles.empty}>尚無禮物信件。</p>}
          <footer className={styles.pagination}>
            <button disabled={busy || mailOffset === 0} onClick={() => void work(() => loadMail(detail.user.id, Math.max(0, mailOffset - 20)))}>上一頁信件</button>
            <span>共 {mail?.total ?? "—"} 封 · 第 {mailOffset / 20 + 1} 頁</span>
            <button disabled={busy || !mail || mailOffset + 20 >= mail.total} onClick={() => void work(() => loadMail(detail.user.id, mailOffset + 20))}>下一頁信件</button>
          </footer>
        </div>}
        {tab === "commerce" && <PlayerCommerce key={detail.user.id} value={detail.commerce} />}
        {tab === "collection" && <><details className={styles.helpDetails}><summary>資料來源</summary><p>持有量取自雲端；費用與稀有度依公開 R18 卡池，未收錄的卡片保留識別碼。</p></details><PlayerCards cards={detail.collection} />
          {!Object.keys(detail.collection).length && <p className={styles.empty}>玩家目前沒有持有卡牌。</p>}</>}
        {tab === "receipts" && <div className={styles.tableScroll}><table><thead><tr><th>時間</th><th>來源／數量</th><th>結果</th></tr></thead><tbody>
          {detail.receipts.map((r) => <tr key={r.source + r.request_id}><td>{date(r.created_at)}</td><td>{r.source === "starter" ? "新手抽卡" : r.pack_id} · {r.draw_count} 張</td>
            <td>{r.card_ids.map(name).join("、")}</td></tr>)}</tbody></table>{!detail.receipts.length && <p className={styles.empty}>尚無抽卡紀錄。</p>}</div>}
        {tab === "matches" && <div className={styles.tableScroll}><table><thead><tr><th>時間</th><th>結果</th><th>對手 ID</th><th>結束原因</th></tr></thead><tbody>
          {detail.matches.map((m) => <tr key={m.match_id}><td>{date(m.completed_at)}</td><td>{outcome[m.outcome as keyof typeof outcome] ?? m.outcome}</td><td>{m.opponent_id}</td><td>{m.reason === "disconnect" ? "離開／斷線" : "擊敗"}</td></tr>)}</tbody></table>
          {!detail.matches.length && <p className={styles.empty}>尚無正式對局紀錄。</p>}</div>}
        {tab === "deck" && <><p className={styles.note}>最近通過入場驗證的牌組，可能與玩家目前草稿不同。</p>
          {detail.last_submitted_deck ? <><p>{detail.last_submitted_deck.deck_id} · {date(detail.last_submitted_deck.submitted_at)}</p>
            <ManaCurve cards={detail.last_submitted_deck.cards} /><PlayerCards cards={detail.last_submitted_deck.cards} /></>
            : <p className={styles.empty}>尚無通過驗證的對局牌組。</p>}</>}
        {tab === "audit" && <div className={styles.tableScroll}><table><thead><tr><th>時間／操作</th><th>原因／操作者</th><th>前 → 後</th></tr></thead><tbody>
          {detail.audit.map((a) => <tr key={a.request_id}><td>{date(a.created_at)}<small>{actions[a.action as keyof typeof actions] ?? a.action}</small></td>
            <td>{a.reason}<small>{a.actor_id}</small></td><td><code>{JSON.stringify(a.before_value)} → {JSON.stringify(a.after_value)}</code></td></tr>)}</tbody></table>
          {!detail.audit.length && <p className={styles.empty}>尚無管理操作。</p>}</div>}
        {session.access_level === "operator" && <section className={styles.management}>
          <h3>管理操作</h3>
          {(pending?.p_action ?? action) === "suspend" && <p className={styles.note}>停權會阻止新的正式對戰；既有對局、帳號與收藏不受影響。</p>}
          {pending ? <div className={styles.confirmation}>
            <strong>確認對 {detail.user.email} 執行「{actions[pending.p_action]}」</strong>
            <p>{pending.p_payload.card_id && `${name(pending.p_payload.card_id)} · `}{pending.p_payload.amount && `${pending.p_payload.amount} 份`} · {pending.p_reason}</p>
            {pending.p_action === "send_mail" && <><strong>{pending.p_payload.title}</strong><p>{pending.p_payload.body}</p><p>附件：卡包券 × {pending.p_payload.amount}，玩家領取後入帳。</p></>}
            <small>操作編號：{pending.p_request}</small>
            <button className={styles.primary} disabled={busy} onClick={() => void work(commitChange)}>{busy ? "處理中…" : "確認／重試同一筆操作"}</button>
            {!attempted && <button disabled={busy} onClick={() => setPending(null)}>取消</button>}
            <p className={styles.note}>連線未完成時，請重試同一筆操作，避免重複補發。</p>
          </div> : <form onSubmit={(e) => { e.preventDefault(); prepareChange(); }} className={styles.manageForm}>
            <label>操作<select value={action} disabled={busy} onChange={(e) => { setAction(e.target.value as Change["p_action"]); setAmount(1); }}>
              {Object.entries(actions).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
            {action === "grant_card" && <label>卡牌<select value={cardId} disabled={busy} onChange={(e) => setCardId(e.target.value)}>
              {Object.entries(cards).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>}
            {action === "send_mail" && <>
              <label>信件標題<input required maxLength={80} value={mailTitle} onChange={(e) => setMailTitle(e.target.value)} disabled={busy} /></label>
              <label className={styles.reason}>信件內容<textarea required maxLength={2000} rows={4} value={mailBody} onChange={(e) => setMailBody(e.target.value)} disabled={busy} /></label>
            </>}
            {["grant_tickets", "grant_card", "send_mail"].includes(action) && <label>數量<input type="number" min={1} max={action === "grant_card" ? 3 : 100} value={amount}
              onChange={(e) => setAmount(Number(e.target.value))} disabled={busy} required /></label>}
            <label className={styles.reason}>原因<input minLength={3} maxLength={300} required value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} /></label>
            <button disabled={busy || (["grant_tickets", "grant_card"].includes(action) && !detail.wallet)}>檢查操作內容</button>
          </form>}
        </section>}
      </section>}
      </>}
    </>}
    {session && <footer className={styles.footnote}>台北時間{page === "players" && " · 抽卡／對局／操作各顯示最近 30 筆"}</footer>}
    </div>
  </main>;
}
