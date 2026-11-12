import { economyLabels, funnelRates, platformLabels, retentionRate, retentionTotals, stepLabels, stepsByVersion,
  type FunnelStep, type Growth, type Onboarding, type RetentionRow } from "./growth-data";
import type { ModeCounters } from "./play-analytics-types";
import styles from "./admin.module.css";

const percent = (value: number | null, digits = 0) => value === null ? "—" : `${(value * 100).toFixed(digits)}%`;
const number = (value: number) => value.toLocaleString("zh-TW");
const modes: Record<string, string> = { pve: "單人 AI", lan: "區網", pvp: "外網", hotseat: "本機雙人",
  casual: "休閒", ranked: "天梯", ante: "賭牌", unknown: "未記錄" };

// Each bar is drawn against the first step, so the shape shows where players leave.
export function FunnelChart({ steps, label }: { steps: FunnelStep[]; label: string }) {
  const rows = funnelRates(steps);
  if (!rows.length || rows[0].value <= 0) return <p className={styles.empty}>尚無資料。</p>;
  return <ol className={styles.funnel} aria-label={`${label}：${rows.map(r => `${r.label} ${r.value}`).join("，")}`}>
    {rows.map((row, i) => <li key={row.label}>
      <span className={styles.funnelLabel}>{row.label}</span>
      <div className={styles.funnelTrack}><span style={{ width: `${Math.max(row.value > 0 ? 1.5 : 0, (row.ofFirst ?? 0) * 100)}%` }} /></div>
      <strong>{number(row.value)}</strong>
      <small>{i === 0 ? "起點" : `佔 ${percent(row.ofFirst)}`}</small>
    </li>)}
  </ol>;
}

export function RetentionPanel({ rows }: { rows: RetentionRow[] }) {
  if (!rows.length) return <p className={styles.empty}>這段期間沒有新遊客。</p>;
  const totals = retentionTotals(rows);
  const names = { d1: "隔天回來", within7: "7 天內回來", d7: "第 7 天回來" } as const;
  const max = Math.max(1, ...rows.map(row => row.installs));
  return <>
    <div className={styles.rateTiles}>{(["d1", "within7", "d7"] as const).map(key => {
      const total = totals.find(item => item.key === key)!;
      return <div key={key}><span>{names[key]}</span><strong>{percent(total.rate)}</strong>
        <small>{total.installs ? `${total.returned}／${total.installs} 台` : "窗口未滿"}</small></div>;
    })}</div>
    <div className={styles.cohortBars} role="img" aria-label={rows.map(row => `${row.day} 新增 ${row.installs} 台，7 天內回來 ${row.within7 ?? "未滿 7 天"}`).join("；")}>
      {rows.map(row => {
        const rate = retentionRate(row.within7, row.installs);
        return <div key={row.day} title={`${row.day}：新增 ${row.installs} 台；隔天 ${row.d1 ?? "未滿"}、7 天內 ${row.within7 ?? "未滿"}`}>
          <div className={styles.cohortColumn} data-open={row.within7 === null}>
            <span style={{ height: `${row.installs / max * 100}%` }}><i style={{ height: `${(rate ?? 0) * 100}%` }} /></span>
          </div>
          <small>{row.day.slice(5)}</small>
        </div>;
      })}
    </div>
    <div className={styles.legend}><span><i className={styles.swatch} data-tone="new" />當天新遊客</span>
      <span><i className={styles.swatch} data-tone="back" />7 天內回來</span><span><i className={styles.swatch} data-tone="open" />未滿 7 天</span></div>
  </>;
}

export function BarList({ rows, unit, tone = "teal" }: { rows: { label: string; value: number; note?: string }[]; unit: string; tone?: string }) {
  if (!rows.length) return <p className={styles.empty}>尚無資料。</p>;
  const max = Math.max(1, ...rows.map(row => row.value));
  return <ul className={styles.barList} data-tone={tone}>
    {rows.map(row => <li key={row.label}><span>{row.label}</span>
      <div><i style={{ width: `${row.value / max * 100}%` }} /></div>
      <strong>{number(row.value)}<small>{unit}</small></strong>{row.note && <small>{row.note}</small>}</li>)}
  </ul>;
}

// Where each tester stopped: the furthest step reached, per client version.
export function TutorialSteps({ growth }: { growth: Growth }) {
  const groups = stepsByVersion(growth.tutorial_steps);
  if (!groups.length) return <p className={styles.empty}>還沒有裝置回報教學進度（需新版遊戲）。</p>;
  return <>{groups.map(group => <section key={group.version} className={styles.stepGroup}>
    <h4>{group.version}<small>{group.installs} 台</small></h4>
    <BarList unit="台" tone="amber" rows={group.steps.map(step => ({
      label: `${step.step + 1}／${step.steps} ${stepLabels[step.name] ?? step.name}`, value: step.installs,
      note: step.completed ? `${step.completed} 台完成` : undefined }))} />
  </section>)}</>;
}

export function TurnsPanel({ growth }: { growth: Growth }) {
  if (!growth.turns.length) return <p className={styles.empty}>這段期間沒有記錄回合數的正式對戰。</p>;
  const max = Math.max(1, ...growth.turns.map(row => row.p90 ?? row.median ?? 0));
  return <ul className={styles.rangeList}>{growth.turns.map(row => <li key={row.mode}>
    <span>{modes[row.mode] ?? row.mode}<small>{row.samples} 場</small></span>
    <div title={`中位數 ${row.median ?? "—"}、九成以下 ${row.p90 ?? "—"}、最長 ${row.max ?? "—"}`}>
      <i style={{ width: `${(row.p90 ?? 0) / max * 100}%` }} /><b style={{ left: `${(row.median ?? 0) / max * 100}%` }} /></div>
    <strong>{row.median ?? "—"}<small>回合（中位）</small></strong>
  </li>)}<li className={styles.rangeNote}><small>白線＝中位數；長條＝九成場次在這之內</small></li></ul>;
}

export function EconomyPanel({ growth }: { growth: Growth }) {
  if (!growth.economy.length) return <p className={styles.empty}>這段期間沒有金幣交易。</p>;
  const max = Math.max(1, ...growth.economy.map(row => Math.max(row.gold_in, row.gold_out)));
  return <ul className={styles.flowList}>{growth.economy.map(row => <li key={row.action}>
    <span>{economyLabels[row.action] ?? row.action}<small>{row.receipts} 筆</small></span>
    <div aria-label={`收入 ${row.gold_in}、支出 ${row.gold_out}`}>
      <i data-flow="in" style={{ width: `${row.gold_in / max * 100}%` }} /><i data-flow="out" style={{ width: `${row.gold_out / max * 100}%` }} /></div>
    <strong>{row.gold_in ? `+${number(row.gold_in)}` : ""}{row.gold_in && row.gold_out ? " / " : ""}{row.gold_out ? `−${number(row.gold_out)}` : ""}</strong>
  </li>)}</ul>;
}

export function PlatformBadge({ platform }: { platform: string }) {
  return <span className={styles.platformBadge} data-platform={platform}>{platformLabels[platform] ?? platform}</span>;
}

const results = [["wins", "勝", "#7cc9bf"], ["losses", "敗", "#de9d98"], ["draws", "平", "#dcc58c"], ["abandoned", "離開", "#6f8090"]] as const;

// One thin bar per device instead of a sentence of counters.
export function DeviceModes({ modes: counters }: { modes: Record<string, ModeCounters> }) {
  const rows = Object.entries(counters).filter(([, c]) => c.started > 0);
  if (!rows.length) return <small>尚未開局</small>;
  return <div className={styles.deviceModes}>{rows.map(([mode, c]) => <div key={mode}
    title={`${modes[mode] ?? mode}：${c.started} 場開始，${results.map(([k, name]) => `${c[k]} ${name}`).join("、")}`}>
    <span>{modes[mode] ?? mode}<b>{c.started}</b></span>
    <div className={styles.stacked}>{results.map(([key, , color]) =>
      <i key={key} style={{ width: `${c[key] / Math.max(1, c.started) * 100}%`, background: color }} />)}</div>
  </div>)}</div>;
}

export function TutorialBadge({ onboarding }: { onboarding: Onboarding | null }) {
  if (!onboarding) return <small>無教學紀錄</small>;
  const done = onboarding.tutorial_completed > 0;
  return <div className={styles.tutorialBadge} data-done={done}
    title={`最遠到第 ${onboarding.tutorial_step + 1}／${onboarding.tutorial_steps} 步（${onboarding.tutorial_step_name}）；開始 ${onboarding.tutorial_started} 次、完成 ${onboarding.tutorial_completed} 次`}>
    <div><i style={{ width: `${(onboarding.tutorial_step + 1) / onboarding.tutorial_steps * 100}%` }} /></div>
    <small>{done ? "教學完成" : `停在 ${stepLabels[onboarding.tutorial_step_name] ?? onboarding.tutorial_step_name}`}</small>
  </div>;
}
