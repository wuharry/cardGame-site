// Per-card analytics from tcg_admin_card_stats (game repo: deploy/account/20261029_card_stats.sql and
// 20261029_card_stats_admin_v2.sql, definitions in docs/card-stats.md). Statistics only rank what to inspect;
// they never judge a card alone.
export type CardStatRow = {
  card_id: string; decks_with: number; deck_rate: number | null; drawn: number; played: number; recycled: number;
  play_rate: number | null; recycle_rate: number | null; summoned: number; skill_units: number; skill_uses: number;
  skill_use_rate: number | null; skill_chances: number; skill_chance_uses: number; chance_use_rate: number | null;
  avg_alive_turns: number | null; left_death: number; left_recall: number; left_other: number; left_end: number;
  deck_wins: number; deck_losses: number; edit_seen: number; edit_kept: number; edit_keep_rate: number | null;
  edit_added: number;
};
export type CardStatsFacet = { matches: number };
export type CardStats = { generated_at: string; days: number; source: string; controller: string;
  mode: string | null; version: string | null; matches: number; decks: number; deck_edits: number;
  modes: (CardStatsFacet & { mode: string })[]; versions: (CardStatsFacet & { version: string })[]; cards: CardStatRow[] };
// mode/version "" means every mode/version.
export type Filters = { days: number; source: "official" | "local" | "all"; controller: "human" | "ai" | "npc" | "all";
  tokens: boolean; mode: string; version: string };
export type SortKey = "decks_with" | "deck_rate" | "play_rate" | "recycle_rate" | "skill_use_rate" | "chance_use_rate"
  | "avg_alive_turns" | "edit_keep_rate";

export const MIN_SAMPLE = 10;
// Players usually swap a few cards per edit, so most cards survive one; a card cut this often stands out.
export const LOW_KEEP_RATE = 60;

const count = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const nullableRate = (value: unknown) => value === null || count(value);
const facets = (value: unknown, key: "mode" | "version") => Array.isArray(value)
  && value.every(item => typeof item?.[key] === "string" && count(item.matches));

export const cardStatsParams = (filters: Filters) => ({ p_days: filters.days, p_source: filters.source,
  p_controller: filters.controller, p_include_tokens: filters.tokens, p_mode: filters.mode || null,
  p_version: filters.version || null });

// Reject malformed RPC payloads instead of rendering misleading zeros.
export function readCardStats(value: unknown): CardStats {
  const data = value as CardStats;
  if (!data || typeof data !== "object" || !Array.isArray(data.cards) || !count(data.matches) || !count(data.decks)
    || !count(data.deck_edits) || !facets(data.modes, "mode") || !facets(data.versions, "version")
    || typeof data.generated_at !== "string") throw new Error("卡牌統計資料格式不符。");
  for (const row of data.cards) {
    if (typeof row?.card_id !== "string"
      || ![row.decks_with, row.drawn, row.played, row.summoned, row.skill_chances, row.edit_seen, row.edit_kept, row.edit_added].every(count)
      || ![row.deck_rate, row.play_rate, row.recycle_rate, row.skill_use_rate, row.chance_use_rate, row.avg_alive_turns,
        row.edit_keep_rate].every(nullableRate))
      throw new Error("卡牌統計資料格式不符。");
  }
  return data;
}

// Hints point at what to inspect first; thresholds are deliberately coarse and need a minimum sample.
export function cardHints(row: CardStatRow): string[] {
  const hints: string[] = [];
  if (row.summoned >= MIN_SAMPLE && (row.avg_alive_turns ?? 0) < 1) hints.push("常上場就死：先查存活與啟動時機");
  if (row.skill_chances >= MIN_SAMPLE && (row.chance_use_rate ?? 100) < 30) hints.push("有機會也少按：技能可能不划算");
  if (row.drawn >= MIN_SAMPLE && (row.recycle_rate ?? 0) >= 40) hints.push("常被回收：本身不想打出");
  if (row.drawn >= MIN_SAMPLE && (row.play_rate ?? 100) < 40) hints.push("常卡手");
  if (row.edit_seen >= MIN_SAMPLE && (row.edit_keep_rate ?? 100) < LOW_KEEP_RATE) hints.push("改牌時常被拿掉：試過後不想留");
  return hints;
}

// Rows without a sample stay last in both directions, so "lowest first" starts at the lowest measured value.
export function sortCards(rows: CardStatRow[], key: SortKey, ascending: boolean) {
  return [...rows].sort((a, b) => {
    const left = a[key], right = b[key];
    if (left === right) return a.card_id.localeCompare(b.card_id);
    if (left === null) return 1;
    if (right === null) return -1;
    return ascending ? left - right : right - left;
  });
}
