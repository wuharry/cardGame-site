export type ModeCounters = { started: number; wins: number; losses: number; draws: number; abandoned: number };
export type GuestStats = { version: string; platform: string; state: string; launches: number; play_seconds: number;
  modes: Record<string, ModeCounters> };
export type GuestList = { page: number; total: number; players: { install_id: string; first_seen: string;
  last_seen: string; online: boolean; stats: GuestStats }[] };
export type PlayerRates = { page: number; players: { id: string; email: string; wins: number; losses: number;
  draws: number; total: number; win_rate: number | null; loss_rate: number | null; verified_match_online: boolean }[] };
export type PlayDashboard = {
  generated_at: string; days: number;
  counts: { registered: number; collection_users: number; admitted_users: number; completed_users: number;
    guest_installs: number; guest_played: number; guest_online: number; formal_matches: number; guest_play_seconds: number };
  daily: { day: string; registered: number | null; guest_installs: number | null; guest_active: number | null; matches: number | null }[];
  guest_modes: (ModeCounters & { mode: string })[];
  formal_outcomes: { defeat: number; disconnect: number; draws: number };
  servers: { server_id: string; received_at: string; fresh: boolean; verified_accounts: number;
    presence: { online_players: number; lobby_players: number; playing_players: number; public_rooms: number; matches: number; protocol: number } }[];
  online_samples: { minute: string; online_connections: number | null; lobby_connections: number | null; playing_connections: number | null }[];
};

// Sort a copy: table order must not change the timeline or mutate RPC data.
export function dailyRows(rows: PlayDashboard["daily"], newestFirst = false) {
  return [...rows].sort((a, b) => newestFirst ? b.day.localeCompare(a.day) : a.day.localeCompare(b.day));
}

// Treat a missing/expired heartbeat as unknown. Never turn lack of data into zero players.
export function livePresence(data: PlayDashboard, now = Date.now()) {
  if (!data.servers.length || data.servers.some(s => !s.fresh || now - Date.parse(s.received_at) >= 45000)) return null;
  return data.servers.reduce((sum, s) => ({ online: sum.online + s.presence.online_players,
    lobby: sum.lobby + s.presence.lobby_players, playing: sum.playing + s.presence.playing_players }),
    { online: 0, lobby: 0, playing: 0 });
}

// Separate missing minutes (no heartbeat) from an actual zero-player measurement.
export function sampleSegments(samples: PlayDashboard["online_samples"]) {
  const segments: PlayDashboard["online_samples"][] = [];
  for (const sample of samples) {
    const last = segments.at(-1)?.at(-1);
    if (!last || Date.parse(sample.minute) - Date.parse(last.minute) > 90000) segments.push([]);
    segments.at(-1)!.push(sample);
  }
  return segments;
}

export const hasMeasurement = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

// Integer counts get readable, distinct ticks even when the maximum is one.
export function countAxis(values: unknown[]) {
  const max = Math.max(1, ...values.filter(hasMeasurement));
  const magnitude = 10 ** Math.floor(Math.log10(max / 4));
  const step = Math.max(1, [1, 2, 5, 10].map(n => n * magnitude).find(n => n >= max / 4)!);
  const ceiling = Math.ceil(max / step) * step;
  return { max: ceiling, ticks: Array.from({ length: Math.round(ceiling / step) + 1 }, (_, i) => i * step) };
}

export function tickIndices(length: number, count = 5) {
  const size = Math.min(length, count);
  return [...new Set(Array.from({ length: size }, (_, i) =>
    size === 1 ? 0 : Math.round(i * (length - 1) / (size - 1))))];
}

export function measuredSegments<T>(rows: T[], value: (row: T) => unknown, time: (row: T) => number, gap: number) {
  const segments: T[][] = [];
  let previous: T | undefined;
  for (const row of rows) {
    if (!hasMeasurement(value(row))) { previous = undefined; continue; }
    if (!previous || time(row) - time(previous) > gap) segments.push([]);
    segments.at(-1)!.push(row);
    previous = row;
  }
  return segments;
}

export const matchModes = { casual: "休閒", ranked: "天梯", ante: "賭牌", pve: "單人 AI", lan: "區網", hotseat: "本機雙人" };
export const matchReasons = { defeat: "擊敗", disconnect: "斷線", concede: "投降", completed: "完成（自報）", abandoned: "中退（自報）" };
export type MatchSource = "server" | "self_reported";
export type MatchGroup = { source: MatchSource; mode: string; version: string | null; reason: string;
  samples: number; avg_seconds: number | null; median_seconds: number | null; p90_seconds: number | null; total_seconds: number | null };
export type MatchAnalytics = { schema_version: 1; generated_at: string; groups: MatchGroup[];
  matches: { match_id: string; source: MatchSource; mode: string; version: string | null; reason: string;
    duration_seconds: number | null; completed_at: string | null }[];
  accounts: { account_id: string; total_seconds: number | null; matches: number;
    server_seconds?: number; self_reported_seconds?: number }[] };
export type MatchFilters = { mode: string; version: string; reason: string };
export const matchFilterParams = (filters: MatchFilters) => ({ p_mode: filters.mode, p_version: filters.version.trim(), p_reason: filters.reason });
export const matchSourceLabel = (source: MatchSource) => source === "server" ? "正式伺服器" : "自行回報（登入者／匿名者）";
export function matchCompletion(source: MatchSource, reason: string) {
  if ((source === "server" && reason === "defeat") || (source === "self_reported" && reason === "completed")) return "正常結束";
  if ((source === "server" && ["disconnect", "concede"].includes(reason)) || (source === "self_reported" && reason === "abandoned")) return "中途結束";
  return "未分類原因";
}
export function durationLabel(seconds: unknown) {
  if (!hasMeasurement(seconds)) return "未記錄";
  return `${seconds.toLocaleString("zh-TW", { maximumFractionDigits: 2 })} 秒`;
}
export function readMatchAnalytics(value: unknown): MatchAnalytics {
  if (!value || typeof value !== "object") throw new Error("對局耗時回覆格式不符，請確認資料庫版本。");
  const data = value as MatchAnalytics;
  if (data.schema_version !== 1 || typeof data.generated_at !== "string" ||
      !Array.isArray(data.groups) || !Array.isArray(data.matches) || !Array.isArray(data.accounts)) {
    throw new Error("對局耗時 schema_version 不支援或欄位不完整，請確認資料庫版本。");
  }
  if ([...data.groups, ...data.matches].some(row => !["server", "self_reported"].includes(row.source))) {
    throw new Error("對局耗時資料含不明來源，暫不顯示。");
  }
  return data;
}
