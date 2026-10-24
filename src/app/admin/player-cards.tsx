import Image from "next/image";
import names from "./card-names.json";
import snapshot from "./card-catalog.json";
import styles from "./admin.module.css";

type CardInfo = { cost: number; rarity: number; art?: string };
const catalog = snapshot.cards as Record<string, CardInfo>;
const rarityNames = ["普通", "稀有", "史詩", "傳說"];
const infoFor = (id: string) => Object.hasOwn(catalog, id) ? catalog[id] : undefined;
const nameFor = (id: string) => Object.hasOwn(names, id) ? (names as Record<string, string>)[id] : id;

export function manaCurve(cards: Record<string, number>) {
  const buckets = Array.from({ length: 9 }, () => 0);
  let known = 0, unknown = 0, cost = 0;
  for (const [id, copies] of Object.entries(cards)) {
    if (!Number.isSafeInteger(copies) || copies <= 0) continue;
    const info = infoFor(id);
    if (!info) { unknown += copies; continue; }
    buckets[Math.min(8, info.cost)] += copies;
    known += copies; cost += copies * info.cost;
  }
  return { buckets, known, unknown, average: known ? cost / known : null };
}

export function ManaCurve({ cards }: { cards: Record<string, number> }) {
  const curve = manaCurve(cards);
  const max = Math.max(1, ...curve.buckets);
  return <section className={styles.curvePanel} aria-label="牌組魔力曲線">
    <div className={styles.toolbar}><div><h3>魔力曲線</h3><small>按卡牌張數加權 · 最右欄為 8 費以上</small></div>
      <span className={styles.statePill}>平均 {curve.average === null ? "未提供" : `${curve.average.toFixed(1)} 費`}</span></div>
    {curve.known ? <div className={styles.manaCurve} role="img" aria-label={curve.buckets.map((n, i) => `${i === 8 ? "8費以上" : `${i}費`} ${n}張`).join("，")}>
      {curve.buckets.map((count, i) => <div key={i}><strong>{count}</strong><div className={styles.manaColumn}>
        <span style={{ height: `${count / max * 100}%` }} /></div><small>{i === 8 ? "8+" : i} 費</small></div>)}
    </div> : <p className={styles.empty}>沒有可用的卡牌費用資料。</p>}
    <small>已計入 {curve.known} 張{curve.unknown > 0 && `；另有 ${curve.unknown} 張未提供費用，未計入曲線與平均`}。</small>
  </section>;
}

export function PlayerCards({ cards }: { cards: Record<string, number> }) {
  return <div className={styles.cardTiles}>
    {Object.entries(cards).sort(([a], [b]) => (infoFor(a)?.cost ?? Infinity) - (infoFor(b)?.cost ?? Infinity) ||
      nameFor(a).localeCompare(nameFor(b), "zh-TW")).map(([id, copies]) => {
      const info = infoFor(id);
      return <article key={id} className={styles.cardTile} data-rarity={info?.rarity ?? "unknown"}>
        {info?.art && <div className={styles.cardArt}><Image src={info.art} alt="" width={160} height={110} sizes="160px" /></div>}
        <div className={styles.cardTileTop}><span className={styles.manaGem} aria-label={info ? `${info.cost} 費` : "費用未提供"}>{info?.cost ?? "?"}</span>
          <strong className={styles.copyBadge}>×{copies}</strong></div>
        <div className={styles.cardTileBody}><strong>{nameFor(id)}</strong>
          <small>{info ? rarityNames[info.rarity] ?? "稀有度未提供" : "卡牌資料未提供"}</small><small className={styles.cardCode}>{id}</small></div>
      </article>;
    })}
  </div>;
}
