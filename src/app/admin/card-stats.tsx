"use client";

import { useEffect, useRef, useState } from "react";
import { AdminError, type AdminAPI } from "./admin-api";
import cardNames from "./card-names.json";
import styles from "./admin.module.css";
import { cardHints, cardStatsParams, LOW_KEEP_RATE, MIN_SAMPLE, readCardStats, sortCards, type CardStats, type Filters,
  type SortKey } from "./card-stats-data";
import { matchModes } from "./play-analytics-types";

const names = cardNames as Record<string, string>;
const sources = { official: "正式對戰", local: "本機回報", all: "全部來源" } as const;
const controllers = { human: "真人", ai: "內建 AI", npc: "NPC 作者", all: "全部" } as const;
const sorts: Record<SortKey, string> = { decks_with: "帶卡牌組數", deck_rate: "組入率", edit_keep_rate: "改牌保留率",
  play_rate: "打出率", recycle_rate: "回收率", skill_use_rate: "主動技能使用率", chance_use_rate: "可用時發動率",
  avg_alive_turns: "平均存活" };
const date = (value: string) => new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
const rate = (value: number | null) => value === null ? "無樣本" : `${value}%`;
const cardName = (id: string) => names[id] ?? (id.startsWith("tokens/") ? `衍生物 ${id.slice(7)}` : id);
const modeName = (value: string | null) => value ? matchModes[value as keyof typeof matchModes] ?? value : "全部模式";

export const missingCardStatsRPC = (error: unknown) => error instanceof AdminError && error.status === 404 &&
  /尚未安裝|PGRST202|tcg_admin_card_stats/.test(error.message);

export function CardStatsView({ data, sort, ascending, tokens = false }: { data: CardStats; sort: SortKey; ascending: boolean; tokens?: boolean }) {
  const [search, setSearch] = useState("");
  const [onlyHints, setOnlyHints] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const term = search.trim().toLowerCase();
  const cards = data.cards.filter(row => (!term || cardName(row.card_id).toLowerCase().includes(term)
    || row.card_id.toLowerCase().includes(term)) && (!onlyHints || cardHints(row).length > 0));
  return <>
    <div className={styles.sampleSummary} aria-label="統計樣本">
      <span><strong>{data.matches.toLocaleString("zh-TW")}</strong> 局</span>
      <span><strong>{data.decks.toLocaleString("zh-TW")}</strong> 副牌組</span>
      <span><strong>{data.deck_edits.toLocaleString("zh-TW")}</strong> 次改牌</span>
    </div>
    <p className={styles.note}>已套用：近 {data.days} 日 · {sources[data.source as keyof typeof sources] ?? data.source} · {controllers[data.controller as keyof typeof controllers] ?? data.controller}{data.mode ? ` · ${modeName(data.mode)}` : ""}{data.version ? ` · ${data.version}` : ""}{tokens ? " · 含衍生物" : ""}</p>
    <div className={`${styles.durationFilters} ${styles.cardSearch}`}>
      <label><span className={styles.srOnly}>搜尋卡牌</span><input type="search" value={search} maxLength={100} placeholder="搜尋卡名或 ID"
        onChange={event => setSearch(event.target.value)} /></label>
      <label className={styles.checkFilter}><input type="checkbox" checked={onlyHints}
        onChange={event => setOnlyHints(event.target.checked)} /> 只看有提醒的卡</label>
      {(search || onlyHints) && <button type="button" onClick={() => { setSearch(""); setOnlyHints(false); }}>清除篩選</button>}
    </div>
    <div className={styles.tableTools}>
      <p className={styles.note} role="status">{cards.length.toLocaleString("zh-TW")}／{data.cards.length.toLocaleString("zh-TW")} 張卡</p>
      <label className={styles.checkFilter}><input type="checkbox" checked={detailed} onChange={event => setDetailed(event.target.checked)} /> 詳細數據</label>
    </div>
    <div className={`${styles.tableScroll} ${styles.cardStatsTable}`} tabIndex={0} role="region" aria-label="逐卡統計表"><table><thead><tr>
      <th scope="col">卡牌</th><th scope="col">組入率</th><th scope="col">改牌保留率</th><th scope="col">打出率</th>
      {detailed && <th scope="col">回收率</th>}<th scope="col">主動技能使用率</th>{detailed && <th scope="col">可用時發動率</th>}<th scope="col">平均存活<span className={styles.columnUnit}>己方回合</span></th>
      {detailed && <><th scope="col">死亡／召還／其他／到結束</th><th scope="col">帶卡勝／敗</th></>}<th scope="col">提醒</th>
    </tr></thead><tbody>{sortCards(cards, sort, ascending).map(row => <tr key={row.card_id}>
      <td>{cardName(row.card_id)}{detailed && <small>{row.card_id}</small>}</td>
      <td>{rate(row.deck_rate)}{detailed && <small>{row.decks_with} 副</small>}</td>
      <td>{rate(row.edit_keep_rate)}{detailed && <small>保留 {row.edit_kept}／{row.edit_seen} · 移出 {row.edit_seen - row.edit_kept} · 新增 {row.edit_added}</small>}</td>
      <td>{rate(row.play_rate)}{detailed && <small>{row.drawn} 抽</small>}</td>
      {detailed && <td>{rate(row.recycle_rate)}<small>{row.recycled} 次</small></td>}
      <td>{rate(row.skill_use_rate)}{detailed && <small>{row.summoned} 登場 · {row.skill_uses} 次技能</small>}</td>
      {detailed && <td>{rate(row.chance_use_rate)}<small>{row.skill_chance_uses}／{row.skill_chances} 回合</small></td>}
      <td>{row.avg_alive_turns === null ? "無樣本" : row.avg_alive_turns}</td>
      {detailed && <><td>{row.left_death}／{row.left_recall}／{row.left_other}／{row.left_end}</td>
        <td>{row.deck_wins}／{row.deck_losses}</td></>}
      <td>{cardHints(row).map(hint => <small key={hint}>{hint}</small>)}</td>
    </tr>)}</tbody></table></div>
    {!data.cards.length ? <div className={styles.empty}>
      <p>尚無對局資料，請調整期間或來源。</p>
    </div> : !cards.length && <p className={styles.empty}>沒有符合條件的卡牌，請清除篩選。</p>}
    <details className={styles.helpDetails}><summary>指標說明</summary>
      <dl>
        <dt>樣本與篩選</dt><dd>牌組以每局每一方計，並非不同玩家人數。卡名搜尋與提醒篩選只改變顯示的卡，不影響樣本數或比率。</dd>
        <dt>主動技能</dt><dd>使用率＝登場從者中，曾發動自身主動技能的比例。戰吼／進場效果、被動與裝備技能不計入。可用時發動率只計自己回合開始時可用且有合法目標的回合。</dd>
        <dt>改牌保留率</dt><dd>只看真人同一副牌組前後兩場有修改的情況。原有卡牌仍留在牌組即算保留，完全拿掉才算移出；未改牌不計。低於 {LOW_KEEP_RATE}% 且滿 {MIN_SAMPLE} 筆樣本才提示，沒有提醒不一定代表表現良好。</dd>
        <dt>版本與回報</dt><dd>正式對戰來自專服，本機回報來自遊戲端。調整卡牌後可用版本篩選比較。資料需由支援版本完賽回報；本機單人／熱座只收同意匿名統計的遊客，舊戰績無法補算。</dd>
      </dl>
    </details>
  </>;
}

export default function CardStatsPanel({ api, disabled, onExpired }: {
  api: Pick<AdminAPI, "rpc">; disabled: boolean; onExpired: () => void;
}) {
  const [draft, setDraft] = useState<Filters>({ days: 28, source: "official", controller: "human", tokens: false, mode: "", version: "" });
  const [query, setQuery] = useState(draft);
  const [revision, setRevision] = useState(0);
  const [sort, setSort] = useState<SortKey>("decks_with");
  const [ascending, setAscending] = useState(false);
  const [result, setResult] = useState<{ query: Filters; data: CardStats } | null>(null);
  // Facets of the last successful load keep the mode/version menus usable while the next query runs.
  const [facets, setFacets] = useState<Pick<CardStats, "modes" | "versions">>({ modes: [], versions: [] });
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "error" | "expired">("loading");
  const [error, setError] = useState("");
  const expired = useRef(onExpired);
  useEffect(() => { expired.current = onExpired; }, [onExpired]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (disabled || document.hidden) return;
      setStatus("loading");
      try {
        const data = readCardStats(await api.rpc<unknown>("tcg_admin_card_stats", cardStatsParams(query)));
        if (!active) return;
        setResult({ query, data }); setFacets({ modes: data.modes, versions: data.versions }); setStatus("ready"); setError("");
      } catch (e) {
        if (!active) return;
        setResult(null);
        if (e instanceof AdminError && [401, 403].includes(e.status)) { setStatus("expired"); expired.current(); }
        else if (missingCardStatsRPC(e)) setStatus("unavailable");
        else { setStatus("error"); setError(e instanceof Error ? e.message : "卡牌統計查詢失敗。"); }
      }
    };
    void load();
    return () => { active = false; };
  }, [api, disabled, query, revision]);
  const data = result?.query === query && status !== "expired" ? result.data : null;
  const modeMatches = new Map(facets.modes.map(m => [m.mode, m.matches]));
  const versions = facets.versions.some(v => v.version === draft.version) || !draft.version
    ? facets.versions : [{ version: draft.version, matches: 0 }, ...facets.versions];
  return <section id="card-stats" className={styles.panel} aria-label="卡牌統計">
    {data && <p className={styles.updatedAt}>更新於 {date(data.generated_at)}</p>}
    <form className={styles.cardFilters} onSubmit={event => { event.preventDefault(); setQuery(draft); setRevision(v => v + 1); }}>
      <div className={styles.filterBasics}>
      <label>期間<select aria-label="統計期間" value={draft.days} disabled={disabled} onChange={e => setDraft({ ...draft, days: Number(e.target.value) })}>
        {[7, 28, 90, 365].map(days => <option key={days} value={days}>近 {days} 日</option>)}</select></label>
      <label>來源<select aria-label="統計來源" value={draft.source} disabled={disabled} onChange={e => setDraft({ ...draft, source: e.target.value as Filters["source"] })}>
        {Object.entries(sources).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <button type="submit" className={styles.primary} aria-label="套用／更新卡牌統計" disabled={disabled}>更新</button>
      </div>
      <details className={styles.advancedFilters}><summary>進階篩選{draft.controller !== "human" || draft.mode || draft.version || draft.tokens ? " · 已設定" : ""}</summary>
        <div className={styles.durationFilters}>
      <label>操作者<select aria-label="統計操作者" value={draft.controller} disabled={disabled} onChange={e => setDraft({ ...draft, controller: e.target.value as Filters["controller"] })}>
        {Object.entries(controllers).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>對局模式<select aria-label="統計模式" value={draft.mode} disabled={disabled} onChange={e => setDraft({ ...draft, mode: e.target.value })}>
        <option value="">全部模式</option>{Object.entries(matchModes).map(([key, label]) => <option key={key} value={key}>
          {label}{modeMatches.has(key) ? `（${modeMatches.get(key)} 局）` : ""}</option>)}</select></label>
      <label>遊戲版本<select aria-label="統計版本" value={draft.version} disabled={disabled} onChange={e => setDraft({ ...draft, version: e.target.value })}>
        <option value="">全部版本</option>{versions.map(v => <option key={v.version} value={v.version}>
          {v.version}{v.matches ? `（${v.matches} 局）` : ""}</option>)}</select></label>
      <label className={styles.checkFilter}><input type="checkbox" checked={draft.tokens} disabled={disabled} onChange={e => setDraft({ ...draft, tokens: e.target.checked })} /> 包含衍生物</label>
        </div>
      </details>
    </form>
    <div className={`${styles.durationFilters} ${styles.cardSort}`}>
      <label>排序<select aria-label="卡牌統計排序" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
        {Object.entries(sorts).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className={styles.checkFilter}><input type="checkbox" checked={ascending} onChange={e => setAscending(e.target.checked)} /> 由低到高</label>
    </div>
    {status === "loading" && <p role="status" className={styles.note}>卡牌統計載入中…</p>}
    {status === "unavailable" && <p role="status" className={styles.message}>卡牌統計尚未啟用，請聯絡維護人員。</p>}
    {status === "error" && <p role="status" className={styles.message}>{error}</p>}
    {status === "expired" && <p role="status">登入或管理權限已失效，卡牌統計已清除。</p>}
    {data && <CardStatsView data={data} sort={sort} ascending={ascending} tokens={query.tokens} />}
  </section>;
}
