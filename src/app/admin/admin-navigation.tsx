import styles from "./admin.module.css";

export const adminPages = [
  { id: "analytics", label: "營運總覽", description: "玩家活動與即時連線", number: "01" },
  { id: "card-stats", label: "卡牌統計", description: "熱門度、留存與技能", number: "02" },
  { id: "match-duration", label: "對局耗時", description: "模式、版本與遊玩時間", number: "03" },
  { id: "players", label: "玩家查詢", description: "收藏、信件與管理操作", number: "04" },
  { id: "player-rates", label: "玩家戰績", description: "正式對戰勝敗與勝率", number: "05" },
  { id: "guests", label: "遊客分析", description: "匿名裝置與模式分布", number: "06" },
] as const;

export type AdminPage = typeof adminPages[number]["id"];

export function pageFromHash(hash: string): AdminPage {
  return adminPages.find(page => `#${page.id}` === hash)?.id ?? "analytics";
}

export default function AdminNavigation({ page, disabled, pending, onSelect }: {
  page: AdminPage; disabled: boolean; pending: boolean; onSelect: (page: AdminPage) => void;
}) {
  return <aside className={styles.sidebar}>
    <div className={styles.sidebarBrand}><span className={styles.eyebrow}>DECKMARCH</span><strong>營運控制台</strong><small>管理工作區</small></div>
    <nav className={styles.pageNav} aria-label="後台功能">
      {adminPages.map(item => <a key={item.id} href={`#${item.id}`} aria-current={page === item.id ? "page" : undefined}
        aria-disabled={disabled || undefined} onClick={event => { event.preventDefault(); if (!disabled) onSelect(item.id); }}>
        <span className={styles.navNumber} aria-hidden="true">{item.number}</span><span><strong>{item.label}</strong><small>{item.description}</small></span>
      </a>)}
    </nav>
    <label className={styles.mobilePageSelect}>後台功能<select value={page} disabled={disabled} onChange={event => onSelect(pageFromHash(`#${event.target.value}`))}>
      {adminPages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select></label>
    <p className={styles.navHelp}>{pending ? "請先完成或取消待確認的操作，再切換頁面。" : "選擇功能即可切換頁面"}</p>
  </aside>;
}
