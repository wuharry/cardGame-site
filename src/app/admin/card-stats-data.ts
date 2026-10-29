// Per-card analytics from tcg_admin_card_stats (game repo: deploy/account/20261029_card_stats.sql,
// definitions in docs/card-stats.md). Statistics only rank what to inspect; they never judge a card alone.
export type CardStatRow = {
  card_id: string; decks_with: number; deck_rate: number | null; drawn: number; played: number; recycled: number;
  play_rate: number | null; recycle_rate: number | null; summoned: number; skill_units: number; skill_uses: number;
  skill_use_rate: number | null; skill_chances: number; skill_chance_uses: number; chance_use_rate: number | null;
  avg_alive_turns: number | null; left_death: number; left_recall: number; left_other: number; left_end: number;
  deck_wins: number; deck_losses: number;
};
export type CardStats = { generated_at: string; days: number; source: string; controller: string;
  matches: number; decks: number; cards: CardStatRow[] };
export type Filters = { days: number; source: "official" | "local" | "all"; controller: "human" | "ai" | "npc" | "all"; tokens: boolean };
export type SortKey = "decks_with" | "deck_rate" | "play_rate" | "recycle_rate" | "skill_use_rate" | "chance_use_rate" | "avg_alive_turns";

export const MIN_SAMPLE = 10;

const count = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const nullableRate = (value: unknown) => value === null || count(value);

// Reject malformed RPC payloads instead of rendering misleading zeros.
export function readCardStats(value: unknown): CardStats {
  const data = value as CardStats;
  if (!data || typeof data !== "object" || !Array.isArray(data.cards) || !count(data.matches) || !count(data.decks)
    || typeof data.generated_at !== "string") throw new Error("卡牌統計資料格式不符。");
  for (const row of data.cards) {
    if (typeof row?.card_id !== "string" || ![row.decks_with, row.drawn, row.played, row.summoned, row.skill_chances].every(count)
      || ![row.deck_rate, row.play_rate, row.recycle_rate, row.skill_use_rate, row.chance_use_rate, row.avg_alive_turns].every(nullableRate))
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
  return hints;
}

export function sortCards(rows: CardStatRow[], key: SortKey, ascending: boolean) {
  return [...rows].sort((a, b) => {
    const left = a[key] ?? -1, right = b[key] ?? -1;
    return left === right ? a.card_id.localeCompare(b.card_id) : (ascending ? left - right : right - left);
  });
}
