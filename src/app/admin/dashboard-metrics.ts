import type { PlayerCommerce, PlayerDetail } from "./admin-api";
import { dailyRows, hasMeasurement, type MatchAnalytics, type PlayDashboard } from "./play-analytics-types";

export function recentDays(rows: PlayDashboard["daily"]) {
  const sorted = dailyRows(rows).filter(row => Number.isFinite(Date.parse(row.day)));
  if (!sorted.length) return [];
  const end = Date.parse(sorted.at(-1)!.day);
  return sorted.filter(row => Date.parse(row.day) >= end - 6 * 86_400_000);
}

export function weekTrend(data: PlayDashboard, key: "registered" | "matches") {
  const rows = dailyRows(data.daily).slice(-14);
  if (rows.length !== 14 || rows.some((row, i) => !hasMeasurement(row[key]) ||
    (i > 0 && Date.parse(row.day) - Date.parse(rows[i - 1].day) !== 86_400_000))) return null;
  const previous = rows.slice(0, 7).reduce((sum, row) => sum + row[key]!, 0);
  const current = rows.slice(7).reduce((sum, row) => sum + row[key]!, 0);
  return { current, previous, change: previous > 0 ? (current - previous) / previous * 100 : null };
}

export function durationBuckets(matches: MatchAnalytics["matches"], source: "server" | "self_reported") {
  const rows = matches.filter(row => row.source === source);
  const unique = [...new Map(rows.map(row => [row.match_id, row])).values()];
  const buckets = [0, 0, 0, 0];
  let unknown = 0;
  for (const row of unique) {
    if (!hasMeasurement(row.duration_seconds)) { unknown++; continue; }
    const seconds = row.duration_seconds;
    buckets[seconds < 180 ? 0 : seconds < 480 ? 1 : seconds <= 900 ? 2 : 3]++;
  }
  const total = buckets.reduce((a, b) => a + b, 0);
  return { buckets, total, unknown, longShare: total ? buckets[3] / total : null };
}

export function winSplit(wins: number, losses: number, draws: number) {
  const decided = wins + losses;
  return { wins, losses, draws, decided, rate: decided > 0 ? wins / decided * 100 : null };
}

export function recentStreak(matches: PlayerDetail["matches"]) {
  const rows = [...new Map(matches.map(row => [row.match_id, row])).values()]
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at));
  let wins = 0;
  for (const row of rows) { if (row.outcome !== "win") break; wins++; }
  return { wins, limited: wins > 0 && wins === rows.length };
}

export function currencyFlow(transactions: PlayerCommerce["transactions"], currency: "gold" | "diamonds") {
  let incoming = 0, outgoing = 0, measured = 0, missing = 0, rejected = 0;
  const rows = [...new Map(transactions.map(row => [row.request_id, row])).values()];
  for (const row of rows) {
    if (row.terminal_error) { rejected++; continue; }
    const before = row[`${currency}_before`], after = row[`${currency}_after`];
    if (!hasMeasurement(before) || !hasMeasurement(after)) { missing++; continue; }
    measured++;
    const delta = after - before;
    incoming += Math.max(0, delta); outgoing += Math.max(0, -delta);
  }
  return { incoming, outgoing, net: incoming - outgoing, measured, missing, rejected };
}
