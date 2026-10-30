import { hasMeasurement, measuredSegments, type PlayDashboard } from "./play-analytics-types";
import { recentDays, weekTrend, winSplit } from "./dashboard-metrics";
import styles from "./admin.module.css";

export function Sparkline({ values, label, dates }: { values: (number | null)[]; label: string; dates?: string[] }) {
  if (!values.some(hasMeasurement)) return <small>尚無趨勢資料</small>;
  const max = Math.max(1, ...values.filter(hasMeasurement));
  const rows = values.map((value, i) => ({ value, i }));
  const start = dates ? Date.parse(dates[0]) : 0;
  const span = dates ? Date.parse(dates.at(-1)!) - start : values.length - 1;
  const x = (i: number) => span ? 4 + ((dates ? Date.parse(dates[i]) - start : i) / span) * 152 : 80;
  const y = (value: number) => 42 - value / max * 34;
  return <svg className={styles.sparkline} viewBox="0 0 160 48" role="img" aria-label={label}>
    <title>{`${label}：${values.map(v => hasMeasurement(v) ? v : "無資料").join("、")}`}</title>
    {measuredSegments(rows, row => row.value, row => dates ? Date.parse(dates[row.i]) : row.i, dates ? 86_400_000 : 1).map((part, i) => <polyline key={i}
      points={part.map(row => `${x(row.i)},${y(row.value!)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="2" />)}
    {rows.filter(row => hasMeasurement(row.value)).map(row => <circle key={row.i} cx={x(row.i)} cy={y(row.value!)} r="2.3" fill="currentColor" />)}
  </svg>;
}

export function TrendBadge({ data, metric }: { data: PlayDashboard; metric: "registered" | "matches" }) {
  const trend = weekTrend(data, metric);
  if (!trend) return <small>資料不足兩週</small>;
  return <div className={styles.trendLine}>
    <span className={styles.trendBadge}>{trend.change === null ? "前期為零" :
      `${trend.change > 0 ? "↑ +" : trend.change < 0 ? "↓ " : "→ "}${trend.change.toFixed(1)}%`}</span>
    <small>近七日 {trend.current} ／前七日 {trend.previous}</small>
  </div>;
}

export function DashboardOverview({ data, now, live, guestFresh }: {
  data: PlayDashboard | null; now: number;
  live: { online: number; lobby: number; playing: number } | null; guestFresh: boolean;
}) {
  const days = data ? recentDays(data.daily) : [];
  const stale = !!data?.servers.length && !live;
  const heartbeat = !data?.servers.length ? "尚無心跳" : stale ? "心跳逾時" : "心跳正常";
  const age = data?.servers.length ? Math.max(...data.servers.map(s => (now - Date.parse(s.received_at)) / 1000)) : null;
  return <>
    <div className={styles.overviewGrid}>
      <article className={styles.metricCard} data-tone="blue"><span className={styles.metricLabel}>註冊玩家</span>
        <strong className={styles.metricValue}>{data?.counts.registered.toLocaleString("zh-TW") ?? "—"}<small>人</small></strong>
        <Sparkline values={days.map(d => d.registered)} dates={days.map(d => d.day)} label="近七日每日新增註冊" />
        <small>近七日新增</small>{data && <TrendBadge data={data} metric="registered" />}</article>
      <article className={styles.metricCard} data-tone={live ? "green" : stale ? "red" : "amber"}>
        <span className={styles.metricLabel}>主機連線 <span className={styles.liveDot} aria-hidden="true" /></span>
        <strong className={styles.metricValue}>{live?.online ?? "待確認"}<small>{live ? "條" : ""}</small></strong>
        <span className={styles.statePill}>{heartbeat}</span>
        {live && <small>大廳 {live.lobby} · 對戰 {live.playing}</small>}
        {age !== null && Number.isFinite(age) && <small>最舊心跳 {Math.max(0, Math.floor(age))} 秒前</small>}
      </article>
      <article className={styles.metricCard} data-tone="teal"><span className={styles.metricLabel}>活動遊客裝置 · 90 秒內</span>
        <strong className={styles.metricValue}>{guestFresh && data ? data.counts.guest_online : "待確認"}<small>{guestFresh ? "台" : ""}</small></strong>
        <Sparkline values={days.map(d => d.guest_active)} dates={days.map(d => d.day)} label="近七日每日活躍遊客裝置" />
        <small>曲線為近七日每日活動</small></article>
      <article className={styles.metricCard} data-tone="amber"><span className={styles.metricLabel}>正式完賽 · 累計</span>
        <strong className={styles.metricValue}>{data?.counts.formal_matches.toLocaleString("zh-TW") ?? "—"}<small>場</small></strong>
        <Sparkline values={days.map(d => d.matches)} dates={days.map(d => d.day)} label="近七日每日正式完賽" />
        <small>近七日完賽</small>{data && <TrendBadge data={data} metric="matches" />}</article>
    </div>
    <div className={styles.milestones}>{[
      ["已建立收藏", data?.counts.collection_users], ["曾進正式對戰", data?.counts.admitted_users],
      ["曾正式完賽", data?.counts.completed_users], ["遊客回報裝置", data?.counts.guest_installs], ["曾遊玩的遊客裝置", data?.counts.guest_played],
    ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value ?? "—"}</strong></div>)}</div>
  </>;
}

export function WinLossBar({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const split = winSplit(wins, losses, draws);
  return <div className={styles.winLoss}>
    <div className={styles.winLossHeading}><strong>{split.rate === null ? "尚無勝敗樣本" : `${split.rate.toFixed(1)}% 勝率`}</strong>
      {split.decided < 20 && <small>少量樣本</small>}</div>
    {split.rate !== null && <div className={styles.winTrack} role="img" aria-label={`勝 ${wins}、敗 ${losses}；勝率 ${split.rate.toFixed(1)}%，平手不計入分母；中線為 50%`}>
      <span style={{ width: `${split.rate}%` }} /><i aria-hidden="true" /></div>}
    <div className={styles.winLossLegend}><span>勝 {wins}</span><span>敗 {losses}</span><span>平 {draws}</span></div>
  </div>;
}
