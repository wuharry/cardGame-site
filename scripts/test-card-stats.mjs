import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/app/admin/card-stats-data.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { readCardStats, cardHints, sortCards, cardStatsParams } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; console.log("PASS", label); };
const row = (id, extra = {}) => ({ card_id: id, decks_with: 4, deck_rate: 50, drawn: 20, played: 10, recycled: 2,
  play_rate: 50, recycle_rate: 10, summoned: 10, skill_units: 5, skill_uses: 6, skill_use_rate: 50, skill_chances: 12,
  skill_chance_uses: 6, chance_use_rate: 50, avg_alive_turns: 1.5, left_death: 8, left_recall: 0, left_other: 0,
  left_end: 2, deck_wins: 2, deck_losses: 2, edit_seen: 12, edit_kept: 9, edit_keep_rate: 75, edit_added: 3, ...extra });
const payload = { generated_at: "2026-10-29T10:00:00Z", days: 28, source: "official", controller: "human", mode: null,
  version: null, matches: 4, decks: 8, deck_edits: 3, modes: [{ mode: "casual", matches: 4 }],
  versions: [{ version: "2026.10.29-R21", matches: 4 }], cards: [row("archer"), row("wizard", { chance_use_rate: null, skill_chances: 0 })] };

check(readCardStats(payload).cards.length === 2, "Valid RPC payload is accepted, including null rates");
assert.throws(() => readCardStats({ ...payload, cards: [row("archer", { drawn: -1 })] }));
assert.throws(() => readCardStats({ ...payload, matches: "4" }));
check(true, "Negative counters and string totals are rejected instead of shown as data");
assert.throws(() => readCardStats({ ...payload, deck_edits: undefined }));
assert.throws(() => readCardStats({ ...payload, versions: [{ version: 21, matches: 4 }] }));
assert.throws(() => readCardStats({ ...payload, cards: [row("archer", { edit_keep_rate: "75" })] }));
check(true, "A pre-v2 payload (no retention or facets) is rejected instead of shown as zero retention");
check(cardHints(row("a", { avg_alive_turns: 0.5 })).some(h => h.includes("存活")), "Short-lived minions are flagged for survival first");
check(cardHints(row("a", { chance_use_rate: 20 })).some(h => h.includes("少按")), "Low use despite opportunity is flagged");
check(cardHints(row("a", { recycle_rate: 45 })).some(h => h.includes("回收")), "Frequently recycled cards are flagged");
check(cardHints(row("a", { edit_keep_rate: 40 })).some(h => h.includes("拿掉")), "Cards often cut in deck edits are flagged");
check(cardHints(row("a", { summoned: 3, avg_alive_turns: 0, skill_chances: 3, chance_use_rate: 0, drawn: 3, recycle_rate: 90,
  play_rate: 0, edit_seen: 3, edit_keep_rate: 0 })).length === 0, "No hint below the minimum sample");
const sorted = sortCards([row("b", { deck_rate: 10 }), row("a", { deck_rate: 90 }), row("c", { deck_rate: null })], "deck_rate", false);
check(sorted.map(r => r.card_id).join() === "a,b,c", "Descending sort keeps no-sample rows last");
const lowest = sortCards(sorted, "deck_rate", true);
check(lowest.map(r => r.card_id).join() === "b,a,c" && sorted[0].card_id === "a",
  "Lowest-first starts at the lowest measured value, keeps no-sample rows last and returns a copy");
const params = cardStatsParams({ days: 28, source: "all", controller: "human", tokens: false, mode: "", version: "" });
check(params.p_mode === null && params.p_version === null && Object.keys(params).length === 6,
  "All modes and versions are sent as null, matching the six RPC arguments");
check(cardStatsParams({ ...params, days: 7, source: "local", controller: "all", tokens: true, mode: "pve", version: "2026.10.29-R21" })
  .p_version === "2026.10.29-R21", "A chosen version is sent unchanged");
console.log(`CARD STATS UI: ${checks} checks`);
