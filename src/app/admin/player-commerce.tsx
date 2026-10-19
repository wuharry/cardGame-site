"use client";

import { useState } from "react";
import type { PlayerCommerce as Commerce } from "./admin-api";
import styles from "./admin.module.css";

const date = (value: string) => new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
const actions: Record<string, string> = { buy_emote: "購買台詞", equip_emote: "裝備台詞", unequip_emote: "卸下台詞",
  buy_pack: "金幣卡包", starter_deck: "新手牌組", weekly: "每週獎勵", choose_core: "自選卡片", equip_title: "裝備稱號", claim_season: "賽季稱號" };

export default function PlayerCommerce({ value }: { value?: Commerce | null }) {
  const [query, setQuery] = useState("");
  if (value === undefined) return <p className={styles.empty}>商店資料尚未由服務提供，請先更新資料庫。餘額未知。</p>;
  if (value === null) return <p className={styles.empty}>玩家尚未建立商店資產；查閱不會替玩家建立帳本。</p>;
  const transactions = value.transactions.filter((item) =>
    `${item.request_id} ${item.item_id} ${item.item_text ?? ""} ${item.terminal_error}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section aria-label="商店與資產">
    <h3>金幣 {value.gold.toLocaleString("zh-TW")} · 鑽石 {value.diamonds.toLocaleString("zh-TW")}</h3>
    <p className={styles.note}>來源為伺服器帳本。目前沒有儲值功能；以下查詢不會變更玩家資產。</p>
    <h3>持有台詞 · 已裝備 {value.equipped_emotes.length} / 4</h3>
    <div className={styles.tableScroll}><table><thead><tr><th>台詞／狀態</th><th>取得時間</th><th>取得交易編號</th></tr></thead><tbody>
      {value.owned_emotes.map((item) => <tr key={item.id}><td>{item.text}<small>{value.equipped_emotes.includes(item.id) ? "使用中" : "已擁有"} · {item.id}</small></td>
        <td>{date(item.acquired_at)}</td><td><code>{item.request_id}</code></td></tr>)}
    </tbody></table>{!value.owned_emotes.length && <p className={styles.empty}>尚未取得付費台詞；基本台詞免費使用。</p>}</div>
    <h3>近期商店與獎勵交易</h3>
    <p className={styles.note}>最近 50 筆，含失敗結果。可用交易編號、商品或錯誤碼篩選這批紀錄；較早交易須查資料庫。重試同一編號只保留一筆。</p>
    <label>篩選近期交易 <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="交易編號、商品、錯誤碼" /></label>
    <div className={styles.tableScroll}><table><thead><tr><th>時間／操作</th><th>商品／結果</th><th>金幣 前 → 後</th><th>鑽石 前 → 後</th><th>交易編號</th></tr></thead><tbody>
      {transactions.map((item) => <tr key={item.request_id}>
        <td>{date(item.created_at)}<small>{actions[item.action] ?? item.action}</small></td>
        <td>{item.item_text ?? item.item_id}<small>{item.terminal_error ? `未完成：${item.terminal_error}` : "已完成"}
          {item.action === "buy_emote" && item.price !== null ? ` · 售價 ${item.price} 鑽石` : ""}
          {item.action === "buy_emote" && item.expected_price != null && item.expected_price !== item.price ? ` · 送出確認價 ${item.expected_price} 鑽石` : ""}</small></td>
        <td>{item.gold_before} → {item.gold_after}</td>
        <td>{item.diamonds_before === null || item.diamonds_after === null ? "—" : `${item.diamonds_before} → ${item.diamonds_after}`}</td>
        <td><code>{item.request_id}</code></td>
      </tr>)}
    </tbody></table>{!transactions.length && <p className={styles.empty}>沒有符合的近期交易。</p>}</div>
  </section>;
}
