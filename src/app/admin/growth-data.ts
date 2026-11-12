// Growth views from tcg_admin_growth / tcg_admin_guest_search (game repo:
// deploy/account/20261112_growth_analytics.sql). Rates always keep their denominator; a window
// that has not finished yet is null and is never drawn as zero.
import { AdminError } from "./admin-api";
import type { GuestStats } from "./play-analytics-types";

export type GrowthFunnel = { installs: number; onboarding_reported: number; tutorial_started: number;
  tutorial_completed: number; first_match_started: number; first_match_finished: number; second_match_started: number };
export type TutorialStep = { version: string; step: number; name: string; steps: number; installs: number; completed: number };
export type RetentionRow = { day: string; installs: number; d1: number | null; d7: number | null; within7: number | null };
export type Growth = { schema_version: 1; generated_at: string; days: number; today: string; funnel: GrowthFunnel;
  tutorial_steps: TutorialStep[]; retention: RetentionRow[]; platforms: { platform: string; installs: number }[];
  versions: { version: string; installs: number }[];
  turns: { mode: string; samples: number; median: number | null; p90: number | null; max: number | null }[];
  economy: { action: string; receipts: number; gold_in: number; gold_out: number }[] };
export type Onboarding = { version: string; tutorial_started: number; tutorial_completed: number; tutorial_step: number;
  tutorial_step_name: string; tutorial_steps: number; updated_at: string };
export type GuestSearch = { code: string; players: { install_id: string; first_seen: string; last_seen: string; online: boolean;
  stats: GuestStats; onboarding: Onboarding | null }[] };
export type FunnelStep = { label: string; value: number };

const count = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const nullableCount = (value: unknown) => value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);

export const missingGrowthRPC = (error: unknown) => error instanceof AdminError && error.status === 404 &&
  /尚未安裝|PGRST202|tcg_admin_growth|tcg_admin_guest_search/.test(error.message);

// Reject malformed payloads instead of drawing misleading zeros.
export function readGrowth(value: unknown): Growth {
  const data = value as Growth;
  const funnel = data?.funnel;
  if (!data || typeof data !== "object" || data.schema_version !== 1 || typeof data.generated_at !== "string"
    || typeof data.today !== "string" || !funnel || ![funnel.installs, funnel.onboarding_reported, funnel.tutorial_started,
      funnel.tutorial_completed, funnel.first_match_started, funnel.first_match_finished, funnel.second_match_started].every(count)
    || ![data.tutorial_steps, data.retention, data.platforms, data.versions, data.turns, data.economy].every(Array.isArray)
    || !count(data.days) || data.days < 1
    || !data.platforms.every(row => typeof row?.platform === "string" && count(row.installs))
    || !data.versions.every(row => typeof row?.version === "string" && count(row.installs))
    || !data.turns.every(row => typeof row?.mode === "string" && count(row.samples)
      && [row.median, row.p90, row.max].every(nullableCount))
    || !data.retention.every(row => typeof row?.day === "string" && count(row.installs)
      && [row.d1, row.d7, row.within7].every(nullableCount))
    || !data.tutorial_steps.every(row => typeof row?.name === "string" && typeof row.version === "string"
      && [row.step, row.steps, row.installs, row.completed].every(count)
      && row.steps > 0 && row.step < row.steps && row.completed <= row.installs)
    || !data.economy.every(row => typeof row?.action === "string" && [row.receipts, row.gold_in, row.gold_out].every(count)))
    throw new Error("成長統計資料格式不符，請確認資料庫版本。");
  return data;
}

// Steps are not strictly nested (a guest may skip the tutorial and still play), so every step is
// shown as a share of the first step rather than of the step before it.
export function funnelRates(steps: FunnelStep[]) {
  const first = steps[0]?.value ?? 0;
  return steps.map(step => ({ ...step, ofFirst: first > 0 ? step.value / first : null }));
}

export const accountFunnel = (counts: { registered: number; collection_users: number; admitted_users: number; completed_users: number }):
  FunnelStep[] => [
  { label: "註冊", value: counts.registered }, { label: "建立收藏", value: counts.collection_users },
  { label: "進正式對戰", value: counts.admitted_users }, { label: "完成正式對戰", value: counts.completed_users }];

export const guestFunnel = (funnel: GrowthFunnel): FunnelStep[] => [
  { label: "遊客裝置", value: funnel.installs }, { label: "曾開局", value: funnel.first_match_started },
  { label: "曾完賽", value: funnel.first_match_finished }, { label: "開局至少兩次", value: funnel.second_match_started }];

// A retention rate exists only when the window has closed and the cohort is not empty.
export const retentionRate = (returned: number | null, installs: number) =>
  returned === null || installs <= 0 ? null : returned / installs;

export function retentionTotals(rows: RetentionRow[]) {
  const closed = (key: "d1" | "d7" | "within7") => rows.filter(row => row[key] !== null);
  const sum = (items: RetentionRow[], key: "installs" | "d1" | "d7" | "within7") => items.reduce((total, row) => total + (row[key] ?? 0), 0);
  return (["d1", "d7", "within7"] as const).map(key => {
    const rowsWithWindow = closed(key);
    const installs = sum(rowsWithWindow, "installs");
    return { key, installs, returned: sum(rowsWithWindow, key), rate: retentionRate(sum(rowsWithWindow, key), installs) };
  });
}

// Tutorial steps are grouped per client version: the enum may change between builds.
export function stepsByVersion(rows: TutorialStep[]) {
  const groups = new Map<string, TutorialStep[]>();
  for (const row of rows) groups.set(row.version, [...(groups.get(row.version) ?? []), row]);
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))
    .map(([version, steps]) => ({ version, steps: [...steps].sort((a, b) => a.step - b.step),
      installs: steps.reduce((total, row) => total + row.installs, 0) }));
}

// Accepts "Traveler-1A2B3C4D", "1a2b3c4d" or the full installation ID; returns the 8 hex digits or null.
export function guestCode(input: string) {
  const match = input.trim().match(/^(?:traveler-)?([0-9a-f]{8})(?:-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/i);
  return match ? match[1].toLowerCase() : null;
}

export const stepLabels: Record<string, string> = {
  MULLIGAN: "換牌", INSPECT: "看卡", MANA: "魔力", SUMMON: "召喚", SICKNESS: "召喚暈眩", END_TURN: "結束回合",
  ENEMY_SUMMON: "對手召喚", BLOCK: "前排阻擋", ATTACK: "攻擊", DAMAGE: "傷害", SECOND_SUMMON: "第二次召喚",
  SECOND_END: "第二次結束", ENEMY_PASS: "對手回合", HERO: "攻擊英雄", COMPLETE: "完成", MORE: "延伸說明",
};

// Actions accepted by tcg_progression_action and the cosmetic shop; unknown actions show their raw name.
export const economyLabels: Record<string, string> = {
  buy_pack: "買卡包", starter_deck: "新手牌組", weekly: "每週獎勵", choose_core: "選核心卡", equip_title: "換稱號",
  claim_season: "賽季獎勵", buy_emote: "買台詞", equip_emote: "換台詞", unequip_emote: "卸下台詞",
};

export const platformLabels: Record<string, string> = {
  Windows: "Windows", macOS: "macOS", Linux: "Linux", Android: "Android", Web: "網頁", unknown: "未知",
};
