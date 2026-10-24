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
    <DurationSpectrum data={data} />
    <p className={styles.note}>依目前篩選顯示歷史累計，不限近 28 日；含管理者參與的對局。自行回報包含登入者及匿名者。</p>
    <p className={styles.note}>耗時樣本只計有記錄的有效耗時；歷史缺值顯示「未記錄」，不補 0。中位數是一半樣本低於的時間；P90 是九成樣本低於的時間。正式伺服器每局只計一次，各組統計直接採用後端對局樣本，不用帳號累計重算平均。</p>
    <p className={styles.note}>表格可左右捲動；鍵盤可聚焦表格後用方向鍵捲動。</p>
    {(["server", "self_reported"] as MatchSource[]).map(source => {
      const groups = data.groups.filter(group => group.source === source);
      return <section key={source} className={styles.durationSource} aria-label={`${matchSourceLabel(source)}耗時`}>
        <h4>{matchSourceLabel(source)}{source === "self_reported" && " · 不作正式戰績證明"}</h4>
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={`${matchSourceLabel(source)}耗時表`}><table><thead><tr><th scope="col">模式／版本</th><th scope="col">結束分類／原因</th><th scope="col">耗時樣本（場）</th><th scope="col">平均（秒）</th><th scope="col">中位數（秒）</th><th scope="col">P90（秒）</th><th scope="col">累計（秒）</th></tr></thead>
          <tbody>{groups.map((g, i) => <tr key={`${g.mode}-${g.version}-${g.reason}-${i}`}>
            <td>{mode(g.mode)}<small>{g.version || "版本未記錄"}</small></td>
            <td>{matchCompletion(g.source, g.reason)}<small>{reason(g.reason)}</small></td><td>{g.samples.toLocaleString("zh-TW")}</td>
            {[g.avg_seconds, g.median_seconds, g.p90_seconds, g.total_seconds].map((value, i) => <td key={i}>{g.samples > 0 ? durationLabel(value) : "無樣本"}</td>)}
          </tr>)}</tbody></table></div>
        {!groups.length && <p className={styles.empty}>目前篩選下尚無{matchSourceLabel(source)}耗時樣本。</p>}
      </section>;
    })}
    <h4>近期對局 · 目前篩選的歷史紀錄 · 台北時間由新到舊</h4>
    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="近期對局耗時表"><table><thead><tr><th scope="col">結束時間／對局 ID</th><th scope="col">來源</th><th scope="col">模式／版本</th><th scope="col">結束分類／原因</th><th scope="col">耗時（秒）</th></tr></thead><tbody>
      {[...data.matches].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")).map((m, i) => <tr key={`${m.source}-${m.match_id}-${i}`}>
        <td>{date(m.completed_at)}<small>{m.match_id}</small></td><td>{matchSourceLabel(m.source)}</td><td>{mode(m.mode)}<small>{m.version || "版本未記錄"}</small></td>
        <td>{matchCompletion(m.source, m.reason)}<small>{reason(m.reason)}</small></td><td>{durationLabel(m.duration_seconds)}</td>
      </tr>)}
    </tbody></table></div>
    {!data.matches.length && <p className={styles.empty}>目前篩選下尚無近期對局。</p>}
    <h4>帳號累積對戰時間</h4>
    <p className={styles.note}>帳號累計依相同篩選涵蓋歷史紀錄，僅帳號名單排除管理者。累計合計可能混合伺服器紀錄與自行回報，來源拆分未提供時不推算為專服時間。匿名裝置不推算為帳號，未記錄耗時不計入累計。</p>
    <p className={styles.note}>同一局耗時會分別計入各參與帳號，不能合計帳號總時再算每局平均。</p>
    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="帳號累積時間表"><table><thead><tr><th scope="col">帳號 ID</th><th scope="col">累計合計（秒／小時，來源可能混合）</th><th scope="col">伺服器紀錄（秒）</th><th scope="col">自行回報（秒）</th><th scope="col">對局數（場）</th></tr></thead><tbody>
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
    <div className={styles.toolbar}><div><h3>對局耗時分析</h3><small>{data ? `資料更新：${date(data.generated_at)}` : "獨立耗時查詢"}</small></div></div>
    <form className={styles.durationFilters} onSubmit={event => {
      event.preventDefault(); setQuery({ ...draft, version: draft.version.trim() }); setRevision(v => v + 1);
    }}>
      <label>對局模式<select aria-label="耗時模式" value={draft.mode} disabled={disabled} onChange={e => setDraft({ ...draft, mode: e.target.value })}>
        <option value="">全部模式</option>{Object.entries(matchModes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>遊戲版本（完全相符）<input aria-label="耗時版本" value={draft.version} maxLength={100} placeholder="全部版本" disabled={disabled} onChange={e => setDraft({ ...draft, version: e.target.value })} /></label>
      <label>結束原因<select aria-label="耗時原因" value={draft.reason} disabled={disabled} onChange={e => setDraft({ ...draft, reason: e.target.value })}>
        <option value="">全部原因</option>{Object.entries(matchReasons).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <button type="submit" disabled={disabled}>套用／更新耗時</button>
    </form>
    <p className={styles.note}>目前已套用：{query.mode ? mode(query.mode) : "全部模式"} ／ {query.version || "全部版本"} ／ {query.reason ? reason(query.reason) : "全部原因"}。篩選送至後端重新彙總。</p>
    {status === "loading" && <p role="status" className={styles.note}>耗時資料載入中…</p>}
    {status === "unavailable" && <p role="status" className={styles.message}>對局耗時分析尚未啟用。請安裝 tcg_admin_match_analytics；既有遊玩概況仍可使用。</p>}
    {status === "error" && <p role="status" className={styles.message}>{error}</p>}
    {status === "expired" && <p role="status">登入或管理權限已失效，耗時資料已清除。</p>}
    {data && <MatchDurationView data={data} />}
  </section>;
}
