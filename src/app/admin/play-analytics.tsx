"use client";

import { useEffect, useRef, useState } from "react";
import { AdminAPI, AdminError } from "./admin-api";
import { livePresence, sampleSegments, type PlayDashboard, type GuestList, type PlayerRates } from "./play-analytics-types";
import styles from "./admin.module.css";

const date = (s: string) => new Date(s).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
const modes: Record<string, string> = { pve: "單人 AI", lan: "區網", pvp: "外網", hotseat: "本機雙人" };
const percent = (value: number | null) => value === null ? "尚無勝敗樣本" : `${value}%`;
const colors = ["#dcc58c", "#7cc9bf", "#a9a7df"];

export function DailyChart({ data }: { data: PlayDashboard }) {
  const keys = ["registered", "guest_active", "matches"] as const;
  const max = Math.max(1, ...data.daily.flatMap(d => keys.map(k => d[k])));
  return <><svg viewBox="0 0 720 220" role="img" aria-label="每日新增註冊、活躍遊客裝置與正式對局">
    {[0, .5, 1].map(n => <g key={n}><line x1="36" x2="710" y1={190 - n * 165} y2={190 - n * 165} stroke="#35484a" />
      <text x="2" y={195 - n * 165} fill="#9db0ad" fontSize="12">{Math.round(max * n)}</text></g>)}
    {keys.map((key, i) => <polyline key={key} stroke={colors[i]} strokeWidth="2.5" fill="none"
      points={data.daily.map((d, x) => `${36 + x * 674 / Math.max(1, data.daily.length - 1)},${190 - d[key] / max * 165}`).join(" ")} />)}
    <text x="36" y="216" fill="#9db0ad" fontSize="12">{data.daily[0]?.day}</text>
    <text x="710" y="216" textAnchor="end" fill="#9db0ad" fontSize="12">{data.daily.at(-1)?.day}</text>
  </svg><div className={styles.legend}>{["新增註冊", "活躍遊客裝置（收到回報）", "正式完賽"].map((s, i) => <span key={s} style={{ color: colors[i] }}>● {s}</span>)}</div>
    <details><summary>每日數據表</summary><div className={styles.tableScroll}><table><thead><tr><th>台北日期</th><th>新增註冊</th><th>遊客首次回報</th><th>活躍遊客裝置</th><th>正式完賽</th></tr></thead>
      <tbody>{data.daily.map(d => <tr key={d.day}><td>{d.day}</td><td>{d.registered}</td><td>{d.guest_installs}</td><td>{d.guest_active}</td><td>{d.matches}</td></tr>)}</tbody></table></div></details></>;
}

export function OnlineChart({ data }: { data: PlayDashboard }) {
  if (!data.online_samples.length) return <p className={styles.empty}>尚無伺服器心跳資料。更新主機後才會開始記錄。</p>;
  const start = Date.parse(data.online_samples[0].minute);
  const span = Math.max(60000, Date.parse(data.online_samples.at(-1)!.minute) - start);
  const max = Math.max(1, ...data.online_samples.map(s => s.online_connections));
  return <><svg viewBox="0 0 720 200" role="img" aria-label="最近二十四小時的伺服器連線人次，缺少回報時斷線">
    {[0, .5, 1].map(n => <g key={n}><line x1="36" x2="710" y1={170 - n * 140} y2={170 - n * 140} stroke="#35484a" />
      <text x="2" y={175 - n * 140} fill="#9db0ad" fontSize="12">{Math.round(max * n)}</text></g>)}
    {sampleSegments(data.online_samples).map((segment, i) => <g key={i}>
      <polyline fill="none" stroke={colors[1]} strokeWidth="2.5" points={segment.map(s => `${36 + (Date.parse(s.minute) - start) / span * 674},${170 - s.online_connections / max * 140}`).join(" ")} />
      {segment.length === 1 && <circle cx={36 + (Date.parse(segment[0].minute) - start) / span * 674} cy={170 - segment[0].online_connections / max * 140} r="3" fill={colors[1]} />}
    </g>)}
    <text x="36" y="198" fill="#9db0ad" fontSize="11">{date(data.online_samples[0].minute)}</text>
    <text x="710" y="198" textAnchor="end" fill="#9db0ad" fontSize="11">{date(data.online_samples.at(-1)!.minute)}</text>
  </svg><p className={styles.note}>每分鐘最後一筆回報；圖線中斷代表缺資料。連線數含大廳與已入場玩家，不等於不同自然人。</p></>;
}

export default function PlayAnalytics({ api, disabled, onExpired }: { api: AdminAPI; disabled: boolean; onExpired: () => void }) {
  const [data, setData] = useState<PlayDashboard | null>(null);
  const [guests, setGuests] = useState<GuestList | null>(null);
  const [rates, setRates] = useState<PlayerRates | null>(null);
  const [guestPage, setGuestPage] = useState(0);
  const [ratePage, setRatePage] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(0);
  const request = useRef(0);
  const loading = useRef(false);
  const expired = useRef(onExpired);
  const [revision, setRevision] = useState(0);
  useEffect(() => { expired.current = onExpired; }, [onExpired]);
  useEffect(() => {
    let active = true;
    const generation = ++request.current;
    const load = async () => {
      if (disabled || document.hidden || loading.current) return;
      loading.current = true; setBusy(true);
      try {
        const dashboard = await api.rpc<PlayDashboard>("tcg_admin_play_dashboard", { p_days: 28 });
        const guestList = await api.rpc<GuestList>("tcg_admin_guest_players", { p_page: guestPage });
        const rateList = await api.rpc<PlayerRates>("tcg_admin_player_rates", { p_page: ratePage });
        if (!active || request.current !== generation) return;
        setData(dashboard); setGuests(guestList); setRates(rateList); setError(""); setClock(Date.now());
      } catch (e) {
        if (!active || request.current !== generation) return;
        setError(e instanceof Error ? e.message : "統計查詢失敗。");
        // Revoked permission clears private data immediately, just like an expired session.
        if (e instanceof AdminError && (e.status === 401 || e.status === 403)) {
          setData(null); setGuests(null); setRates(null); expired.current();
        }
      } finally { loading.current = false; if (active) setBusy(false); }
    };
    void load();
    const poll = window.setInterval(() => void load(), 30000);
    const age = window.setInterval(() => { if (active) setClock(Date.now()); }, 5000);
    return () => { active = false; window.clearInterval(poll); window.clearInterval(age); };
  }, [api, disabled, guestPage, ratePage, revision]);

  const live = data ? livePresence(data, clock) : null;
  const guestFresh = data && clock - Date.parse(data.generated_at) < 90000;
  return <section aria-label="遊玩統計">
    <div className={styles.toolbar}><div><h2>遊玩概況</h2><small>台北日期 · 累計指標與近 28 日趨勢 · 排除管理者註冊／收藏</small></div>
      <div><small>{data ? `資料更新：${date(data.generated_at)}` : "登入後載入統計"}</small>
        <button disabled={busy || disabled} onClick={() => setRevision(v => v + 1)}>{busy ? "更新中…" : "更新統計"}</button></div></div>
    {error && <p className={styles.message} role="status">{error} {data && "下方保留上次數據。"}</p>}
    <div className={styles.kpis}>{[
      ["註冊玩家", data?.counts.registered], ["已建立收藏", data?.counts.collection_users],
      ["曾進正式對戰", data?.counts.admitted_users], ["曾正式完賽", data?.counts.completed_users],
      ["遊客回報裝置", data?.counts.guest_installs], ["曾遊玩的遊客裝置", data?.counts.guest_played],
    ].map(([label, n]) => <div key={label}><span>{label}</span><strong>{n ?? "—"}</strong></div>)}</div>
    <div className={styles.kpis}>
      <div><span>遊戲主機在線連線</span><strong>{live?.online ?? "待確認"}</strong><small>{live ? `大廳 ${live.lobby} · 對戰 ${live.playing}` : "尚未回報或心跳已過期"}</small></div>
      <div><span>最近活動遊客裝置</span><strong>{guestFresh ? data.counts.guest_online : "待確認"}</strong><small>最近 90 秒收到回報；包含單人遊玩</small></div>
      <div><span>正式完成對局（累計）</span><strong>{data?.counts.formal_matches ?? "—"}</strong><small>由正式伺服器驗證</small></div>
    </div><p className={styles.note}>遊客裝置 ID 清除存檔／重裝後可能改變，不能視為不同人數；離線活動要等連網才看得到。遊客活動數與主機連線可能重疊，不能相加。</p>
    {data && <><div className={styles.chartGrid}>
      <article className={styles.panel}><h3>每日玩家活動 · 近 28 日</h3><DailyChart data={data} /></article>
      <article className={styles.panel}><h3>主機連線 · 最近 24 小時</h3><OnlineChart data={data} />
        {data.servers.map(s => <small key={s.server_id}>{s.server_id} · 回報 {date(s.received_at)} · {s.fresh && clock - Date.parse(s.received_at) < 45000 ? "有效" : "已過期"}</small>)}</article>
    </div><section className={styles.panel}><h3>遊客遊玩結果 · 累計自行回報</h3>
      <p className={styles.note}>不作排名或收藏證明。本機雙人的勝敗以本機 player 座位計算；外網正式戰績以伺服器紀錄為準。</p>
      {data.guest_modes.length ? data.guest_modes.map(m => { const total = Math.max(1, m.started); return <div className={styles.modeRow} key={m.mode}>
        <span>{modes[m.mode] ?? m.mode} · {m.started} 次開始</span><div className={styles.stacked} role="img" aria-label={`${m.wins} 勝、${m.losses} 敗、${m.draws} 平、${m.abandoned} 中途離開`}>
          {[m.wins, m.losses, m.draws, m.abandoned].map((n, i) => <span key={i} style={{ width: `${n / total * 100}%`, background: ["#7cc9bf", "#de9d98", "#dcc58c", "#6f8090"][i] }} />)}</div>
        <small>{m.wins} 勝 · {m.losses} 敗 · {m.draws} 平 · {m.abandoned} 中途離開 · {m.started - m.wins - m.losses - m.draws - m.abandoned} 尚未結束</small></div>; }) : <p className={styles.empty}>尚無遊客回報。更新遊戲客戶端後才開始收集。</p>}
      <h3>正式完賽原因 · 近 28 日</h3><div className={styles.legend}><span>擊敗 {data.formal_outcomes.defeat}</span><span>離開／斷線 {data.formal_outcomes.disconnect}</span><span>其中平手 {data.formal_outcomes.draws}</span></div></section></>}
    <section className={styles.panel}><h3>每位玩家勝敗率 · 正式伺服器紀錄（累計）</h3><p className={styles.note}>勝率＝勝／（勝＋敗），平手另列。樣本少時只供觀察；未完賽顯示無樣本。</p>
      <div className={styles.tableScroll}><table><thead><tr><th>玩家</th><th>場次／勝敗平</th><th>勝率</th><th>敗率</th><th>目前狀態</th></tr></thead><tbody>{rates?.players.map(p => <tr key={p.id}>
        <td>{p.email}<small>{p.id}</small></td><td>{p.total} 場 · {p.wins}／{p.losses}／{p.draws}</td><td>{percent(p.win_rate)}</td><td>{percent(p.loss_rate)}</td>
        <td>{live && p.verified_match_online ? "正式對戰中" : "未確認對戰在線"}</td></tr>)}</tbody></table></div>
      <footer className={styles.pagination}><button disabled={busy || disabled || ratePage === 0} onClick={() => setRatePage(p => p - 1)}>上一頁戰績</button><span>第 {ratePage + 1} 頁</span>
        <button disabled={busy || disabled || (rates?.players.length ?? 0) < 25} onClick={() => setRatePage(p => p + 1)}>下一頁戰績</button></footer>
    </section>
    <section className={styles.panel}><h3>遊客装置資料 · 匿名自行回報</h3><div className={styles.tableScroll}><table><thead><tr><th>匿名裝置 ID</th><th>最近活動／首次回報</th><th>版本／平台</th><th>啟動／遊玩時間</th><th>模式與結果</th></tr></thead>
      <tbody>{guests?.players.map(g => <tr key={g.install_id}><td>{g.install_id}<small>{guestFresh && g.online ? "近期收到活動" : "未確認活動"}</small></td>
        <td>{date(g.last_seen)}<small>{date(g.first_seen)}</small></td><td>{g.stats.version}<small>{g.stats.platform}</small></td>
        <td>{g.stats.launches} 次 · {Math.floor(g.stats.play_seconds / 60)} 分</td><td>{Object.entries(g.stats.modes).filter(([, c]) => c.started > 0).map(([m, c]) => <small key={m}>{modes[m] ?? m}：{c.started} 開始 · {c.wins} 勝 {c.losses} 敗 {c.draws} 平 {c.abandoned} 離開</small>)}</td></tr>)}</tbody></table></div>
      {guests?.players.length === 0 && <p className={styles.empty}>尚無遊客統計，不會自動取得舊版或完全離線玩家的資料。</p>}
      <footer className={styles.pagination}><button disabled={busy || disabled || guestPage === 0} onClick={() => setGuestPage(p => p - 1)}>上一頁遊客</button><span>第 {guestPage + 1} 頁 · {guests?.total ?? "—"} 個裝置</span>
        <button disabled={busy || disabled || !guests || (guestPage + 1) * 25 >= guests.total} onClick={() => setGuestPage(p => p + 1)}>下一頁遊客</button></footer></section>
  </section>;
}
