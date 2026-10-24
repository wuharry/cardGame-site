import type { MatchAnalytics } from "./play-analytics-types";
import { durationBuckets } from "./dashboard-metrics";
import styles from "./admin.module.css";

const bands = [
  { label: "短局", range: "少於 3 分", color: "#7cc9bf" }, { label: "一般", range: "3 至未滿 8 分", color: "#4ade80" },
  { label: "較長", range: "8 至 15 分", color: "#facc15" }, { label: "長局", range: "超過 15 分", color: "#f87171" },
];

export default function DurationSpectrum({ data }: { data: MatchAnalytics }) {
  return <div className={styles.spectrumGrid}>
    {(["server", "self_reported"] as const).map(source => {
      const stats = durationBuckets(data.matches, source);
      const warning = stats.total >= 20 && stats.longShare !== null && stats.longShare > .05;
      return <section key={source} className={styles.spectrumCard} data-warning={warning} aria-label={source === "server" ? "正式伺服器近期時長分布" : "自行回報近期時長分布"}>
        <div className={styles.toolbar}><h4>{source === "server" ? "正式伺服器" : "自行回報 · 非正式戰績"}</h4><span className={styles.statePill}>{stats.total} 場有效樣本</span></div>
        <p className={styles.note}>僅近期回傳紀錄，非全歷史分布；含中途結束。未記錄 {stats.unknown} 場，不補成短局。</p>
        {stats.total ? <>
          <div className={styles.spectrumBar} role="img" aria-label={bands.map((b, i) => `${b.label} ${stats.buckets[i]}場`).join("，")}>
            {bands.map((b, i) => <span key={b.label} style={{ flexGrow: stats.buckets[i], background: b.color }}><span className={styles.srOnly}>{b.label} {stats.buckets[i]} 場</span></span>)}
          </div>
          <div className={styles.spectrumLegend}>{bands.map((b, i) => <div key={b.label}><span style={{ color: b.color }}>{b.label}</span>
            <strong>{(stats.buckets[i] / stats.total * 100).toFixed(1)}%</strong><small>{b.range} · {stats.buckets[i]} 場</small></div>)}</div>
          {warning && <p className={styles.observation}>長局超過 5% · 觀察提示，不代表死鎖或惡意拖延。</p>}
          {stats.total < 20 && <small>少於 20 場，暫不觸發長局占比提示。</small>}
        </> : <p className={styles.empty}>目前沒有已記錄耗時的近期對局。</p>}
      </section>;
    })}
  </div>;
}
