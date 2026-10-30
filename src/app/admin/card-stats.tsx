"use client";

import { useEffect, useRef, useState } from "react";
import { AdminError, type AdminAPI } from "./admin-api";
import cardNames from "./card-names.json";
import styles from "./admin.module.css";
import { cardHints, cardStatsParams, LOW_KEEP_RATE, MIN_SAMPLE, readCardStats, sortCards, type CardStats, type Filters,
  type SortKey } from "./card-stats-data";
import { matchModes } from "./play-analytics-types";

const names = cardNames as Record<string, string>;
const sources = { official: "正式外網（專服）", local: "本機自行回報", all: "全部來源" } as const;
const controllers = { human: "真人", ai: "內建 AI", npc: "NPC 作者", all: "全部" } as const;
const sorts: Record<SortKey, string> = { decks_with: "帶卡牌組數", deck_rate: "組入率", edit_keep_rate: "改牌保留率",
  play_rate: "抽到後打出率", recycle_rate: "回收率", skill_use_rate: "主動技能使用率", chance_use_rate: "有機會時主動技能發動率",
  avg_alive_turns: "平均存活" };
const date = (value: string) => new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
const rate = (value: number | null) => value === null ? "無樣本" : `${value}%`;
const cardName = (id: string) => names[id] ?? (id.startsWith("tokens/") ? `衍生物 ${id.slice(7)}` : id);
const modeName = (value: string | null) => value ? matchModes[value as keyof typeof matchModes] ?? value : "全部模式";

export const missingCardStatsRPC = (error: unknown) => error instanceof AdminError && error.status === 404 &&
  /尚未安裝|PGRST202|tcg_admin_card_stats/.test(error.message);

export function CardStatsView({ data, sort, ascending }: { data: CardStats; sort: SortKey; ascending: boolean }) {
  const [search, setSearch] = useState("");
  const [onlyHints, setOnlyHints] = useState(false);
  const term = search.trim().toLowerCase();
  const cards = data.cards.filter(row => (!term || cardName(row.card_id).toLowerCase().includes(term)
    || row.card_id.toLowerCase().includes(term)) && (!onlyHints || cardHints(row).length > 0));
  return <>
    <p className={styles.note}>樣本：{data.matches.toLocaleString("zh-TW")} 局、{data.decks.toLocaleString("zh-TW")} 副牌組（以每局每一方計，非不重複玩家數）、{data.deck_edits.toLocaleString("zh-TW")} 次改牌。近 {data.days} 日 · {sources[data.source as keyof typeof sources] ?? data.source} · {controllers[data.controller as keyof typeof controllers] ?? data.controller} · {modeName(data.mode)} · {data.version ?? "全部版本"}。</p>
    <p className={styles.note}>主動技能使用率＝登場從者中，曾發動自身主動技能的比例；次數也只計自身主動技能。戰吼／進場效果、被動效果與裝備技能不計入，因此這些效果有觸發，主動技能次數仍可能是 0。</p>
    <p className={styles.note}>有機會時主動技能發動率＝自己回合開始時，自身主動技能可用且有合法目標的回合中，真的發動的比例。使用率低時先看存活時間與可用機會，再檢查技能效果與成本；使用率高也可能只是免費必按。</p>
    <p className={styles.note}>改牌保留率＝同一副自組牌組前後兩場之間有改動時，原本帶著這張卡、改完仍保留的比例；沒改動的連續對局不計，只看真人。完全拿掉才算移出，減少張數但仍有這張卡算保留。低於 {LOW_KEEP_RATE}% 代表玩家試過後常把它拿掉。調整過卡牌後，用「遊戲版本」只看新版本，避免新舊數值混在一起。提示需要至少 {MIN_SAMPLE} 筆樣本。</p>
    <div className={styles.durationFilters}>
      <label>搜尋卡牌<input type="search" value={search} maxLength={100} placeholder="輸入卡名或卡牌 ID"
        onChange={event => setSearch(event.target.value)} /></label>
      <label className={styles.checkFilter}><input type="checkbox" checked={onlyHints}
        onChange={event => setOnlyHints(event.target.checked)} /> 只看有提醒的卡</label>
      <button type="button" disabled={!search && !onlyHints} onClick={() => { setSearch(""); setOnlyHints(false); }}>清除卡牌搜尋與提醒篩選</button>
    </div>
    <p className={styles.note} role="status">顯示 {cards.length.toLocaleString("zh-TW")}／{data.cards.length.toLocaleString("zh-TW")} 張有樣本的卡。搜尋與提醒篩選不改變上方樣本數或各項比率。</p>
    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="逐卡統計表"><table><thead><tr>
      <th scope="col">卡牌</th><th scope="col">組入率（帶卡牌組）</th><th scope="col">改牌保留率</th><th scope="col">抽到／打出率</th>
      <th scope="col">回收率</th><th scope="col">登場／主動技能使用率</th><th scope="col">有機會時主動技能發動率</th><th scope="col">平均存活（己方回合）</th>
      <th scope="col">離場：死亡／召還／其他／到結束</th><th scope="col">帶卡勝／敗</th><th scope="col">優先檢查</th>
    </tr></thead><tbody>{sortCards(cards, sort, ascending).map(row => <tr key={row.card_id}>
      <td>{cardName(row.card_id)}<small>{row.card_id}</small></td>
      <td>{rate(row.deck_rate)}<small>{row.decks_with} 副</small></td>
      <td>{rate(row.edit_keep_rate)}<small>保留 {row.edit_kept}／{row.edit_seen} 次 · 移出 {row.edit_seen - row.edit_kept} 次 · 新加入 {row.edit_added} 次</small></td>
      <td>{row.drawn} 抽<small>{rate(row.play_rate)} 打出</small></td>
      <td>{rate(row.recycle_rate)}<small>{row.recycled} 次</small></td>
      <td>{row.summoned} 隻<small>{rate(row.skill_use_rate)} 用過主動技能 · {row.skill_uses} 次</small></td>
      <td>{rate(row.chance_use_rate)}<small>{row.skill_chance_uses}／{row.skill_chances} 回合</small></td>
      <td>{row.avg_alive_turns === null ? "無樣本" : row.avg_alive_turns}</td>
      <td>{row.left_death}／{row.left_recall}／{row.left_other}／{row.left_end}</td>
      <td>{row.deck_wins}／{row.deck_losses}</td>
      <td>{cardHints(row).map(hint => <small key={hint}>{hint}</small>)}</td>
    </tr>)}</tbody></table></div>
    {!data.cards.length ? <div className={styles.empty}>
      <p>目前篩選下尚無逐卡樣本。可調整期間、來源、對局模式或版本後再查詢。</p>
      <p>支援統計的遊戲版本完成對局並成功回報後，這裡才會累積資料。本機單人／熱座目前只收同意匿名統計的遊客；舊戰績無法補算這些指標。</p>
    </div> : !cards.length && <p className={styles.empty}>已有逐卡樣本，但沒有符合目前卡名／ID 或提醒篩選的卡。請清除篩選再查看；沒有提醒也可能是樣本不足。</p>}
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
    <div className={styles.toolbar}><div><h3>卡牌統計</h3><small>{data ? `資料更新：${date(data.generated_at)}` : "逐卡熱門度與主動技能使用"}</small></div></div>
    <form className={styles.durationFilters} onSubmit={event => { event.preventDefault(); setQuery(draft); setRevision(v => v + 1); }}>
      <label>期間<select aria-label="統計期間" value={draft.days} disabled={disabled} onChange={e => setDraft({ ...draft, days: Number(e.target.value) })}>
        {[7, 28, 90, 365].map(days => <option key={days} value={days}>近 {days} 日</option>)}</select></label>
      <label>來源<select aria-label="統計來源" value={draft.source} disabled={disabled} onChange={e => setDraft({ ...draft, source: e.target.value as Filters["source"] })}>
        {Object.entries(sources).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>操作者<select aria-label="統計操作者" value={draft.controller} disabled={disabled} onChange={e => setDraft({ ...draft, controller: e.target.value as Filters["controller"] })}>
        {Object.entries(controllers).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>對局模式<select aria-label="統計模式" value={draft.mode} disabled={disabled} onChange={e => setDraft({ ...draft, mode: e.target.value })}>
        <option value="">全部模式</option>{Object.entries(matchModes).map(([key, label]) => <option key={key} value={key}>
          {label}{modeMatches.has(key) ? `（${modeMatches.get(key)} 局）` : ""}</option>)}</select></label>
      <label>遊戲版本<select aria-label="統計版本" value={draft.version} disabled={disabled} onChange={e => setDraft({ ...draft, version: e.target.value })}>
        <option value="">全部版本</option>{versions.map(v => <option key={v.version} value={v.version}>
          {v.version}{v.matches ? `（${v.matches} 局）` : ""}</option>)}</select></label>
      <label className={styles.checkFilter}><input type="checkbox" checked={draft.tokens} disabled={disabled} onChange={e => setDraft({ ...draft, tokens: e.target.checked })} /> 包含衍生物</label>
      <button type="submit" disabled={disabled}>套用／更新卡牌統計</button>
    </form>
    <div className={styles.durationFilters}>
      <label>排序<select aria-label="卡牌統計排序" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
        {Object.entries(sorts).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className={styles.checkFilter}><input type="checkbox" checked={ascending} onChange={e => setAscending(e.target.checked)} /> 由低到高</label>
    </div>
    {status === "loading" && <p role="status" className={styles.note}>卡牌統計載入中…</p>}
    {status === "unavailable" && <p role="status" className={styles.message}>卡牌統計尚未啟用。請在資料庫依序套用 20261029_card_stats.sql 與 20261029_card_stats_admin_v2.sql；其他後台功能不受影響。</p>}
    {status === "error" && <p role="status" className={styles.message}>{error}</p>}
    {status === "expired" && <p role="status">登入或管理權限已失效，卡牌統計已清除。</p>}
    {data && <CardStatsView data={data} sort={sort} ascending={ascending} />}
  </section>;
}
