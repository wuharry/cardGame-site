"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AdminAPI, AdminError } from "./admin-api";
import { countAxis, dailyRows, hasMeasurement, livePresence, measuredSegments, tickIndices, type PlayDashboard, type GuestList, type PlayerRates } from "./play-analytics-types";
import MatchDuration from "./match-duration";
import styles from "./admin.module.css";
import { DashboardOverview, WinLossBar } from "./dashboard-visuals";

const date = (s: string) => new Date(s).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
const modes: Record<string, string> = { pve: "單人 AI", lan: "區網", pvp: "外網", hotseat: "本機雙人" };
const percent = (value: number | null) => value === null ? "尚無勝敗樣本" : `${value}%`;
const colors = ["#dcc58c", "#7cc9bf", "#a9a7df"];

const dailySeries = [
  { key: "registered", label: "新增註冊", unit: "人" },
  { key: "guest_active", label: "活躍遊客裝置（收到回報）", unit: "台" },
  { key: "matches", label: "正式完賽", unit: "場" },
] as const;
const onlineSeries = [
  { key: "online_connections", label: "全部連線", unit: "條" },
  { key: "lobby_connections", label: "大廳連線", unit: "條" },
  { key: "playing_connections", label: "對戰連線", unit: "條" },
] as const;
const measured = (value: unknown) => hasMeasurement(value) ? value.toLocaleString("zh-TW") : "無資料";

// One keyboard stop per chart; arrows traverse every measurement, including zero/missing values.
function TimePlot({ rows, series, kind, label, unit, gap }: {
  rows: { time: string; values: (number | null)[] }[];
  series: readonly { key: string; label: string; unit: string }[];
  kind: "bar" | "line"; label: string; unit: string; gap: number;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const infoId = useId();
  const index = Math.max(0, selected ? rows.findIndex(row => row.time === selected) : rows.length - 1);
  const active = rows[index];
  const visible = series.map((s, i) => hidden.includes(s.key) ? -1 : i).filter(i => i >= 0);
  const axis = countAxis(rows.flatMap(row => visible.map(i => row.values[i])));
  const start = Date.parse(rows[0].time);
  const span = Date.parse(rows.at(-1)!.time) - start;
  const x = (row: typeof active) => span ? 80 + (Date.parse(row.time) - start) / span * 600 : 380;
  const y = (n: number) => 218 - n / axis.max * 174;
  const barWidth = Math.max(1, Math.min(14, 600 / rows.length / Math.max(1, visible.length)));
  const choose = (i: number) => setSelected(rows[Math.max(0, Math.min(rows.length - 1, i))].time);
  const pointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width * 720;
    const nearest = rows.reduce((best, row, i) => Math.abs(x(row) - position) < Math.abs(x(rows[best]) - position) ? i : best, 0);
    choose(nearest);
  };
  return <div className={styles.interactiveChart}>
    <div className={styles.seriesControls} aria-label={`${label}系列篩選`}>{series.map((s, i) => <button key={s.key} type="button"
      aria-pressed={!hidden.includes(s.key)} onClick={() => setHidden(old => old.includes(s.key) ? old.filter(k => k !== s.key) : [...old, s.key])}>
      <span style={{ color: colors[i] }} aria-hidden="true">● </span>{s.label}（{s.unit}）</button>)}</div>
    <small>滑鼠移動、觸控點選圖表；聚焦圖表後用 ← → 選資料，Home／End 到首尾。可橫向捲動。</small>
    {!visible.length && <p role="status" className={styles.note}>請選擇至少一個系列。</p>}
    <div className={styles.chartScroll}><svg viewBox="0 0 720 270" role="img" tabIndex={0} aria-label={label} aria-describedby={infoId}
      onPointerMove={event => { if (event.pointerType === "mouse") pointer(event); }} onPointerDown={pointer}
      onKeyDown={event => {
        const target = event.key === "ArrowLeft" ? index - 1 : event.key === "ArrowRight" ? index + 1 : event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : null;
        if (target !== null) { event.preventDefault(); choose(target); }
      }}>
      <text x="58" y="18" fill="#b9cac6" fontSize="12">{unit}</text>
      {axis.ticks.map(n => <g key={n}><line x1="58" x2="704" y1={y(n)} y2={y(n)} stroke="#35484a" />
        <text x="50" y={y(n) + 4} textAnchor="end" fill="#b9cac6" fontSize="12">{n.toLocaleString("zh-TW")}</text></g>)}
      {visible.map((i, order) => <g key={series[i].key}>
        {kind === "line" && measuredSegments(rows, row => row.values[i], row => Date.parse(row.time), gap).map((segment, j) =>
          <polyline key={j} fill="none" stroke={colors[i]} strokeWidth="2.5" points={segment.map(row => `${x(row)},${y(row.values[i]!)}`).join(" ")} />)}
        {rows.map(row => {
          const value = row.values[i];
          if (!hasMeasurement(value)) return null;
          const px = x(row) + (kind === "bar" ? (order - (visible.length - 1) / 2) * barWidth : 0);
          const title = `${row.time} · ${series[i].label}：${value} ${series[i].unit}`;
          return kind === "bar" && value > 0 ? <rect key={row.time} x={px - barWidth / 2} y={y(value)} width={Math.max(.5, barWidth - 1)} height={218 - y(value)} fill={colors[i]}><title>{title}</title></rect>
            : <circle key={row.time} cx={px} cy={y(value)} r={rows.length > 120 ? 1.5 : 3} fill={colors[i]}><title>{title}</title></circle>;
        })}
      </g>)}
      <line x1={x(active)} x2={x(active)} y1="32" y2="220" stroke="#e4e8e5" strokeDasharray="4 4" opacity=".7" />
      {tickIndices(rows.length).map((i, order, ticks) => <g key={rows[i].time}>
        <line x1={x(rows[i])} x2={x(rows[i])} y1="218" y2="224" stroke="#9db0ad" />
        <text x={x(rows[i])} y="242" textAnchor={order === 0 ? "start" : order === ticks.length - 1 ? "end" : "middle"} fill="#b9cac6" fontSize="12">
          {rows[i].time.length === 10 ? rows[i].time.slice(5) : new Date(rows[i].time).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit" })}
          {rows[i].time.length > 10 && <tspan x={x(rows[i])} dy="17">{new Date(rows[i].time).toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei", hour12: false, hour: "2-digit", minute: "2-digit" })}</tspan>}
        </text></g>)}
    </svg></div>
    <div id={infoId} className={styles.chartReadout} aria-live="polite" aria-atomic="true">
      <strong>{active.time.length === 10 ? active.time : date(active.time)} · 台北時間</strong>
      <div>{visible.map(i => <span key={series[i].key}><span style={{ color: colors[i] }} aria-hidden="true">● </span>{series[i].label}：{measured(active.values[i])}{hasMeasurement(active.values[i]) ? ` ${series[i].unit}` : ""}</span>)}</div>
    </div>
  </div>;
}

export function DailyPlot({ data, kind }: { data: PlayDashboard; kind: "bar" | "line" }) {
  const rows = dailyRows(data.daily).map(row => ({ time: row.day, values: dailySeries.map(s => row[s.key]) }));
  if (!rows.length) return <p className={styles.empty}>尚無每日統計資料。</p>;
  return <TimePlot rows={rows} series={dailySeries} kind={kind} label={`每日玩家活動${kind === "bar" ? "柱狀圖" : "折線圖"}，日期由舊到新`} unit="計數（人／台／場；各系列單位見圖例）" gap={129600000} />;
}

export function DailyChart({ data }: { data: PlayDashboard }) {
  const [kind, setKind] = useState<"bar" | "line">("bar");
  return <><div className={styles.chartControls}><label>趨勢呈現<select aria-label="每日趨勢圖類型" value={kind} onChange={e => setKind(e.target.value as "bar" | "line")}>
    <option value="bar">柱狀圖</option><option value="line">折線圖</option></select></label><small>圖表由舊到新 · 表格由新到舊 · 無資料不補 0</small></div>
    <DailyPlot key={kind} data={data} kind={kind} />
    <details><summary>每日數據表 · 新到舊</summary><div className={styles.tableScroll}><table><thead><tr><th scope="col" aria-sort="descending">台北日期 ↓</th><th>新增註冊（人）</th><th>遊客首次回報（台）</th><th>活躍遊客裝置（台）</th><th>正式完賽（場）</th></tr></thead>
      <tbody>{dailyRows(data.daily, true).map(d => <tr key={d.day}><td>{d.day}</td><td>{measured(d.registered)}</td><td>{measured(d.guest_installs)}</td><td>{measured(d.guest_active)}</td><td>{measured(d.matches)}</td></tr>)}</tbody></table></div></details></>;
}

export function ModeChart({ data }: { data: PlayDashboard }) {
  const rows = data.guest_modes.filter(m => m.started > 0).sort((a, b) => b.started - a.started || a.mode.localeCompare(b.mode));
  const total = rows.reduce((sum, m) => sum + m.started, 0);
  if (!total) return <p className={styles.empty}>尚無遊客對局開始回報，暫不顯示比例。</p>;
  const palette = [...colors, "#de9d98", "#91a3b2"];
  const circumference = 2 * Math.PI * 64;
  return <div className={styles.distribution}><svg viewBox="0 0 200 200" role="img" aria-label={`遊客遊玩模式圓餅圖，共 ${total} 次開始；不是不重複玩家人數`}>
    {rows.map((m, i) => {
      const length = m.started / total * circumference;
      const start = rows.slice(0, i).reduce((sum, row) => sum + row.started, 0) / total * circumference;
      return <circle key={m.mode} cx="100" cy="100" r="64" fill="none" stroke={palette[i % palette.length]} strokeWidth="32"
        strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-start} transform="rotate(-90 100 100)">
        <title>{`${modes[m.mode] ?? m.mode}：${m.started} 次（${(m.started / total * 100).toFixed(1)}%）`}</title></circle>;
    })}
    <text x="100" y="99" fill="#e4e8e5" fontSize="24" textAnchor="middle">{total}</text>
    <text x="100" y="120" fill="#9db0ad" fontSize="12" textAnchor="middle">次開始</text>
  </svg><div className={styles.tableScroll}><table><thead><tr><th>模式</th><th>開始次數</th><th>占比</th></tr></thead><tbody>
    {rows.map((m, i) => <tr key={m.mode}><td><span style={{ color: palette[i % palette.length] }} aria-hidden="true">● </span>{modes[m.mode] ?? m.mode}</td><td>{m.started}</td><td>{(m.started / total * 100).toFixed(1)}%</td></tr>)}
  </tbody></table></div></div>;
}

export function OnlineChart({ data }: { data: PlayDashboard }) {
  const rows = [...data.online_samples].sort((a, b) => a.minute.localeCompare(b.minute))
    .map(row => ({ time: row.minute, values: onlineSeries.map(s => row[s.key]) }));
  if (!rows.length) return <p className={styles.empty}>尚無伺服器心跳資料。更新主機後才會開始記錄。</p>;
  return <><TimePlot rows={rows} series={onlineSeries} kind="line" label="最近二十四小時的伺服器連線數，缺少回報時斷線" unit="連線數（條）" gap={90000} />
    <p className={styles.note}>每分鐘最後一筆回報；圖線中斷代表缺資料。連線數含大廳與已入場玩家，不等於不同自然人。</p>
    <details><summary>在線精確數據表 · 新到舊</summary><div className={styles.tableScroll}><table><thead><tr><th>台北時間</th>{onlineSeries.map(s => <th key={s.key}>{s.label}（條）</th>)}</tr></thead><tbody>
      {[...rows].reverse().map(row => <tr key={row.time}><td>{date(row.time)}</td>{row.values.map((v, i) => <td key={i}>{measured(v)}</td>)}</tr>)}
    </tbody></table></div></details></>;
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
  const [revoked, setRevoked] = useState(false);
  const expired = useRef(onExpired);
  const [revision, setRevision] = useState(0);
  useEffect(() => { expired.current = onExpired; }, [onExpired]);
  const clearPrivateData = useCallback(() => {
    request.current++; setRevoked(true);
    setData(null); setGuests(null); setRates(null); expired.current();
  }, []);
  useEffect(() => {
    let active = true;
    let loading = false;
    const generation = ++request.current;
    const load = async () => {
      if (disabled || revoked || document.hidden || loading) return;
      loading = true; setBusy(true);
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
          clearPrivateData();
        }
      } finally { loading = false; if (active) setBusy(false); }
    };
    void load();
    const poll = window.setInterval(() => void load(), 30000);
    const age = window.setInterval(() => { if (active) setClock(Date.now()); }, 5000);
    return () => { active = false; window.clearInterval(poll); window.clearInterval(age); };
  }, [api, disabled, guestPage, ratePage, revision, revoked, clearPrivateData]);

  if (revoked) return <p role="status">登入或管理權限已失效，私人統計已清除。</p>;

  const live = data ? livePresence(data, clock) : null;
  const guestFresh = data && clock - Date.parse(data.generated_at) < 90000;
  return <section id="analytics" aria-label="遊玩統計">
    <div className={styles.toolbar}><div><h2>遊玩概況</h2><small>台北日期 · 累計指標與近 28 日趨勢 · 排除管理者註冊／收藏</small></div>
      <div><small>{data ? `資料更新：${date(data.generated_at)}` : "登入後載入統計"}</small>
        <button disabled={busy || disabled} onClick={() => setRevision(v => v + 1)}>{busy ? "更新中…" : "更新統計"}</button></div></div>
    {error && <p className={styles.message} role="status">{error} {data && "下方保留上次數據。"}</p>}
    <DashboardOverview data={data} now={clock} live={live} guestFresh={!!guestFresh} />
    <p className={styles.note}>遊客裝置 ID 清除存檔／重裝後可能改變，不能視為不同人數；離線活動要等連網才看得到。遊客活動數與主機連線可能重疊，不能相加。</p>
    {data && <><div className={styles.chartGrid}>
      <article className={styles.panel}><h3>每日玩家活動 · 近 28 日</h3><DailyChart data={data} /></article>
      <article className={styles.panel}><h3>主機連線 · 最近 24 小時</h3><OnlineChart data={data} />
        {data.servers.map(s => <small key={s.server_id}>{s.server_id} · 回報 {date(s.received_at)} · {s.fresh && clock - Date.parse(s.received_at) < 45000 ? "有效" : "已過期"}</small>)}</article>
    </div><section className={styles.panel}><h3>遊客遊玩模式占比 · 累計自行回報</h3>
      <p className={styles.note}>以各模式的對局開始次數計算；同一裝置可遊玩多種模式，不代表玩家人數占比。</p><ModeChart data={data} />
    </section><section className={styles.panel}><h3>遊客遊玩結果 · 累計自行回報</h3>
      <p className={styles.note}>不作排名或收藏證明。本機雙人的勝敗以本機 player 座位計算；外網正式戰績以伺服器紀錄為準。</p>
      {data.guest_modes.length ? data.guest_modes.map(m => { const total = Math.max(1, m.started); return <div className={styles.modeRow} key={m.mode}>
        <span>{modes[m.mode] ?? m.mode} · {m.started} 次開始</span><div className={styles.stacked} role="img" aria-label={`${m.wins} 勝、${m.losses} 敗、${m.draws} 平、${m.abandoned} 中途離開`}>
          {[m.wins, m.losses, m.draws, m.abandoned].map((n, i) => <span key={i} style={{ width: `${n / total * 100}%`, background: ["#7cc9bf", "#de9d98", "#dcc58c", "#6f8090"][i] }} />)}</div>
        <small>{m.wins} 勝 · {m.losses} 敗 · {m.draws} 平 · {m.abandoned} 中途離開 · {m.started - m.wins - m.losses - m.draws - m.abandoned} 尚未結束</small></div>; }) : <p className={styles.empty}>尚無遊客回報。更新遊戲客戶端後才開始收集。</p>}
      <h3>正式完賽原因 · 近 28 日</h3><div className={styles.legend}><span>擊敗 {data.formal_outcomes.defeat}</span><span>離開／斷線 {data.formal_outcomes.disconnect}</span><span>其中平手 {data.formal_outcomes.draws}</span></div></section></>}
    <MatchDuration api={api} disabled={disabled} onExpired={clearPrivateData} />
    <section className={styles.panel}><h3>每位玩家勝敗率 · 正式伺服器紀錄（累計）</h3><p className={styles.note}>勝率＝勝／（勝＋敗），平手另列。樣本少時只供觀察；未完賽顯示無樣本。</p>
      <div className={styles.tableScroll}><table><thead><tr><th>玩家</th><th>場次／勝敗平</th><th>勝率</th><th>敗率</th><th>目前狀態</th></tr></thead><tbody>{rates?.players.map(p => <tr key={p.id}>
        <td>{p.email}<small>{p.id}</small></td><td>{p.total} 場 · {p.wins}／{p.losses}／{p.draws}</td><td><WinLossBar wins={p.wins} losses={p.losses} draws={p.draws} /></td><td>{percent(p.loss_rate)}</td>
        <td>{live && p.verified_match_online ? "正式對戰中" : "未確認對戰在線"}</td></tr>)}</tbody></table></div>
      <footer className={styles.pagination}><button disabled={busy || disabled || ratePage === 0} onClick={() => setRatePage(p => p - 1)}>上一頁戰績</button><span>第 {ratePage + 1} 頁</span>
        <button disabled={busy || disabled || (rates?.players.length ?? 0) < 25} onClick={() => setRatePage(p => p + 1)}>下一頁戰績</button></footer>
    </section>
    <section className={styles.panel}><h3>遊客裝置資料 · 匿名自行回報</h3><div className={styles.tableScroll}><table><thead><tr><th>匿名裝置 ID</th><th>最近活動／首次回報</th><th>版本／平台</th><th>啟動／對戰時間</th><th>模式與結果</th></tr></thead>
      <tbody>{guests?.players.map(g => <tr key={g.install_id}><td>{g.install_id}<small>{guestFresh && g.online ? "近期收到活動" : "未確認活動"}</small></td>
        <td>{date(g.last_seen)}<small>{date(g.first_seen)}</small></td><td>{g.stats.version}<small>{g.stats.platform}</small></td>
        <td>{g.stats.launches} 次 · {Math.floor(g.stats.play_seconds / 60)} 分</td><td>{Object.entries(g.stats.modes).filter(([, c]) => c.started > 0).map(([m, c]) => <small key={m}>{modes[m] ?? m}：{c.started} 開始 · {c.wins} 勝 {c.losses} 敗 {c.draws} 平 {c.abandoned} 離開</small>)}</td></tr>)}</tbody></table></div>
      {guests?.players.length === 0 && <p className={styles.empty}>尚無遊客統計，不會自動取得舊版或完全離線玩家的資料。</p>}
      <footer className={styles.pagination}><button disabled={busy || disabled || guestPage === 0} onClick={() => setGuestPage(p => p - 1)}>上一頁遊客</button><span>第 {guestPage + 1} 頁 · {guests?.total ?? "—"} 個裝置</span>
        <button disabled={busy || disabled || !guests || (guestPage + 1) * 25 >= guests.total} onClick={() => setGuestPage(p => p + 1)}>下一頁遊客</button></footer></section>
  </section>;
}
