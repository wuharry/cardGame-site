"use client";

import { useEffect, useRef, useState } from "react";
import { AdminError, type AdminAPI } from "./admin-api";
import { durationLabel, hasMeasurement, matchCompletion, matchFilterParams, matchModes, matchReasons,
  matchSourceLabel, readMatchAnalytics, type MatchAnalytics, type MatchFilters, type MatchSource } from "./play-analytics-types";
import styles from "./admin.module.css";
import DurationSpectrum from "./duration-spectrum";

const date = (value: string | null) => value ? new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "未記錄";
const mode = (value: string) => matchModes[value as keyof typeof matchModes] ?? value;
const reason = (value: string) => matchReasons[value as keyof typeof matchReasons] ?? value;
export const missingMatchRPC = (error: unknown) => error instanceof AdminError && error.status === 404 &&
  /尚未安裝|PGRST202|tcg_admin_match_analytics/.test(error.message);

export function MatchDurationView({ data }: { data: MatchAnalytics }) {
  return <>
    <details className={styles.helpDetails}><summary>指標說明</summary>
      <p>依篩選顯示歷史累計，包含管理者對局。自行回報含登入與匿名玩家，不作正式戰績證明。未記錄耗時不補 0。</p>
      <p>中位數與 P90 分別是一半、九成樣本低於的耗時；正式伺服器每局計一次。時長分布只涵蓋近期回傳紀錄，含中途結束，不代表全歷史分布。</p>
      <p>長局超過 15 分鐘；至少 20 場有效樣本且占比超過 5% 才顯示提示，並不代表死鎖或惡意拖延。</p>
      <p>帳號累計排除管理者，合計可能混合伺服器與自行回報。匿名裝置不推算成帳號；同一局會分別計入各參與帳號，不可用帳號合計推算每局平均。</p>
    </details>
    <DurationSpectrum data={data} />
    {(["server", "self_reported"] as MatchSource[]).map(source => {
      const groups = data.groups.filter(group => group.source === source);
      return <section key={source} className={styles.durationSource} aria-label={`${matchSourceLabel(source)}耗時`}>
        <h4>{matchSourceLabel(source)} · 歷史累計</h4>
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={`${matchSourceLabel(source)}耗時表`}><table><thead><tr><th scope="col">模式／版本</th><th scope="col">結束分類／原因</th><th scope="col">耗時樣本（場）</th><th scope="col">平均（秒）</th><th scope="col">中位數（秒）</th><th scope="col">P90（秒）</th><th scope="col">累計（秒）</th></tr></thead>
          <tbody>{groups.map((g, i) => <tr key={`${g.mode}-${g.version}-${g.reason}-${i}`}>
            <td>{mode(g.mode)}<small>{g.version || "版本未記錄"}</small></td>
            <td>{matchCompletion(g.source, g.reason)}<small>{reason(g.reason)}</small></td><td>{g.samples.toLocaleString("zh-TW")}</td>
            {[g.avg_seconds, g.median_seconds, g.p90_seconds, g.total_seconds].map((value, i) => <td key={i}>{g.samples > 0 ? durationLabel(value) : "無樣本"}</td>)}
          </tr>)}</tbody></table></div>
        {!groups.length && <p className={styles.empty}>目前篩選下尚無{matchSourceLabel(source)}耗時樣本。</p>}
      </section>;
    })}
    <h4>近期對局</h4>
    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="近期對局耗時表"><table><thead><tr><th scope="col">結束時間／對局 ID</th><th scope="col">來源</th><th scope="col">模式／版本</th><th scope="col">結束分類／原因</th><th scope="col">耗時（秒）</th></tr></thead><tbody>
      {[...data.matches].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")).map((m, i) => <tr key={`${m.source}-${m.match_id}-${i}`}>
        <td>{date(m.completed_at)}<small>{m.match_id}</small></td><td>{matchSourceLabel(m.source)}</td><td>{mode(m.mode)}<small>{m.version || "版本未記錄"}</small></td>
        <td>{matchCompletion(m.source, m.reason)}<small>{reason(m.reason)}</small></td><td>{durationLabel(m.duration_seconds)}</td>
      </tr>)}
    </tbody></table></div>
    {!data.matches.length && <p className={styles.empty}>目前篩選下尚無近期對局。</p>}
    <h4>帳號累積對戰時間</h4>
    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="帳號累積時間表"><table><thead><tr><th scope="col">帳號 ID</th><th scope="col">總耗時（秒／小時）</th><th scope="col">伺服器（秒）</th><th scope="col">自行回報（秒）</th><th scope="col">對局數</th></tr></thead><tbody>
      {data.accounts.map(a => <tr key={a.account_id}><td>{a.account_id}</td><td>{durationLabel(a.total_seconds)}
        {hasMeasurement(a.total_seconds) && <small>{(a.total_seconds / 3600).toLocaleString("zh-TW", { maximumFractionDigits: 2 })} 小時</small>}</td>
        <td>{hasMeasurement(a.server_seconds) ? durationLabel(a.server_seconds) : "未提供來源拆分"}</td>
        <td>{hasMeasurement(a.self_reported_seconds) ? durationLabel(a.self_reported_seconds) : "未提供來源拆分"}</td><td>{a.matches.toLocaleString("zh-TW")}</td></tr>)}
    </tbody></table></div>
    {!data.accounts.length && <p className={styles.empty}>目前篩選下尚無帳號累積時間。</p>}
  </>;
}

export default function MatchDuration({ api, disabled, onExpired }: {
  api: Pick<AdminAPI, "rpc">; disabled: boolean; onExpired: () => void;
}) {
  const [draft, setDraft] = useState<MatchFilters>({ mode: "", version: "", reason: "" });
  const [query, setQuery] = useState(draft);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ query: MatchFilters; data: MatchAnalytics } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "error" | "expired">("loading");
  const [error, setError] = useState("");
  const expired = useRef(onExpired);
  useEffect(() => { expired.current = onExpired; }, [onExpired]);
  useEffect(() => {
    let active = true;
    let loading = false;
    const load = async () => {
      if (disabled || document.hidden || loading) return;
      loading = true; setStatus("loading");
      try {
        const data = readMatchAnalytics(await api.rpc<unknown>("tcg_admin_match_analytics", matchFilterParams(query)));
        if (!active) return;
        setResult({ query, data }); setStatus("ready"); setError("");
      } catch (e) {
        if (!active) return;
        setResult(null);
        if (e instanceof AdminError && [401, 403].includes(e.status)) {
          setStatus("expired"); expired.current();
        } else if (missingMatchRPC(e)) setStatus("unavailable");
        else { setStatus("error"); setError(e instanceof Error ? e.message : "對局耗時查詢失敗。"); }
      } finally { loading = false; }
    };
    void load();
    const poll = window.setInterval(() => void load(), 30000);
    return () => { active = false; window.clearInterval(poll); };
  }, [api, disabled, query, revision]);
  const data = result?.query === query && status !== "expired" ? result.data : null;
  return <section className={styles.panel} aria-label="對局耗時分析">
    {data && <div className={styles.toolbar}><small>更新於 {date(data.generated_at)}</small></div>}
    <form className={styles.durationFilters} onSubmit={event => {
      event.preventDefault(); setQuery({ ...draft, version: draft.version.trim() }); setRevision(v => v + 1);
    }}>
      <label>對局模式<select aria-label="耗時模式" value={draft.mode} disabled={disabled} onChange={e => setDraft({ ...draft, mode: e.target.value })}>
        <option value="">全部模式</option>{Object.entries(matchModes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>遊戲版本<input aria-label="耗時版本" value={draft.version} maxLength={100} placeholder="完整版本號，留空查全部" disabled={disabled} onChange={e => setDraft({ ...draft, version: e.target.value })} /></label>
      <label>結束原因<select aria-label="耗時原因" value={draft.reason} disabled={disabled} onChange={e => setDraft({ ...draft, reason: e.target.value })}>
        <option value="">全部原因</option>{Object.entries(matchReasons).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <button type="submit" disabled={disabled}>查詢</button>
    </form>
    <p className={styles.note}>已套用：{query.mode ? mode(query.mode) : "全部模式"} · {query.version || "全部版本"} · {query.reason ? reason(query.reason) : "全部原因"}</p>
    {status === "loading" && <p role="status" className={styles.note}>耗時資料載入中…</p>}
    {status === "unavailable" && <p role="status" className={styles.message}>對局耗時分析尚未啟用，請聯絡維護人員。</p>}
    {status === "error" && <p role="status" className={styles.message}>{error}</p>}
    {status === "expired" && <p role="status">登入或管理權限已失效，耗時資料已清除。</p>}
    {data && <MatchDurationView data={data} />}
  </section>;
}
