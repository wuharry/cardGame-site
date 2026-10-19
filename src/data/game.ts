/** 遊戲規則與介紹；各平台實際下載成品及驗證範圍另見 releases.ts。 */
export const GAME_FACTS = {
  nameZh: "紙鴉牌",
  nameEn: "Deckmarch",
  version: "2026.10.19-R14",
  engine: "Godot 4.7",
  lanes: 4,
  heroHp: 20,
  handLimit: 8,
  manaCap: 10,
  cards: 244,
  tokens: 21,
  aiPresets: 19,
  protocol: 25,
} as const;

export interface LaneUnit {
  name: string;
  atk: number;
  hp: number;
  art: string;
  taunt?: boolean;
  flying?: boolean;
}

export interface LanePosition {
  side: "player" | "enemy";
  row: "front" | "back";
  /** 0–3 對應路線 1–4。 */
  lane: number;
}

export interface LaneStep {
  id: string;
  index: string;
  tag: string;
  heading: string;
  summary: string;
  playerFront: (LaneUnit | null)[];
  playerBack: (LaneUnit | null)[];
  enemyFront: (LaneUnit | null)[];
  enemyBack: (LaneUnit | null)[];
  attacker: LanePosition | null;
  target: LanePosition | "hero" | null;
  guardian: LanePosition | null;
  blocked: boolean;
  hitHero: boolean;
  notice: string;
  enemyHp: number;
}

// 基礎數值取自 data/cards/*.tres；每一步是獨立情境，不接續計算傷害。
const KNIGHT: LaneUnit = { name: "騎士", atk: 3, hp: 5, art: "/media/cards/knight.webp" };
const TREANT: LaneUnit = { name: "樹靈守衛", atk: 3, hp: 7, art: "/media/cards/treant_guardian.webp" };
const ROGUE: LaneUnit = { name: "貓族盜賊", atk: 3, hp: 3, art: "/media/cards/catfolk_rogue.webp" };
const GARGOYLE: LaneUnit = { name: "石像鬼哨兵", atk: 3, hp: 6, flying: true, art: "/media/cards/gargoyle_sentinel.webp" };
const MUSHROOM: LaneUnit = { name: "蘑菇術士", atk: 1, hp: 3, art: "/media/cards/mushroom_mage.webp" };
const AXEMAN: LaneUnit = { name: "重甲斧兵", atk: 4, hp: 6, taunt: true, art: "/media/cards/armored_axeman.webp" };
const EMPTY: (LaneUnit | null)[] = [null, null, null, null];
const PLAYER_FRONT = [KNIGHT, null, null, ROGUE];
const KNIGHT_POSITION: LanePosition = { side: "player", row: "front", lane: 0 };

export const LANE_STEPS: LaneStep[] = [
  {
    id: "field", index: "01", tag: "戰場架構", heading: "四條路線，每路都有前後排",
    summary: "雙方共有 4 路 × 前後 2 排（共 16 卡槽），前排負責迎敵阻擋、後排安全輸出發育。",
    playerFront: EMPTY, playerBack: EMPTY, enemyFront: EMPTY, enemyBack: EMPTY,
    attacker: null, target: null, guardian: null, blocked: false, hitHero: false,
    notice: "雙方各有四路 × 前後兩排。", enemyHp: 20,
  },
  {
    id: "cross-lane", index: "02", tag: "跨路自由", heading: "敵方前排，可以跨路選目標",
    summary: "攻擊敵方前排不必拘泥正前方！第一路的騎士可自由斜切攻擊第三路的石像鬼哨兵。",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: [null, null, GARGOYLE, null], enemyBack: [null, null, MUSHROOM, null],
    attacker: KNIGHT_POSITION, target: { side: "enemy", row: "front", lane: 2 },
    guardian: null, blocked: false, hitHero: false,
    notice: "騎士（第 1 路） → 石像鬼哨兵（第 3 路）：跨路攻擊，雙方互換傷害。", enemyHp: 20,
  },
  {
    id: "back-guard", index: "03", tag: "前排掩護", heading: "前排保護自己那一路的後排",
    summary: "只要同路前排仍在場，後面的蘑菇術士就處於絕對掩護中，敵方普攻無法直接鎖定！",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: [null, null, GARGOYLE, null], enemyBack: [null, null, MUSHROOM, null],
    attacker: KNIGHT_POSITION, target: { side: "enemy", row: "back", lane: 2 },
    guardian: { side: "enemy", row: "front", lane: 2 }, blocked: true, hitHero: false,
    notice: "後排受同路前排庇護：必須先擊破前排石像鬼哨兵！", enemyHp: 20,
  },
  {
    id: "hero-blocked", index: "04", tag: "英雄防禦", heading: "打英雄，檢查攻擊者自己的路線",
    summary: "想直擊敵方英雄？先檢查你自己這條路正前方有沒有敵方前排擋路！",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: [null, null, null, TREANT], enemyBack: EMPTY,
    attacker: { side: "player", row: "front", lane: 3 }, target: "hero",
    guardian: { side: "enemy", row: "front", lane: 3 }, blocked: true, hitHero: false,
    notice: "同路有敵方前排樹靈守衛：直擊路徑被完全擋下！", enemyHp: 20,
  },
  {
    id: "open-lane", index: "05", tag: "破路直擊", heading: "前排空了，後排不替英雄擋傷害",
    summary: "敵方第一路前排空缺！即便後排有蘑菇術士，騎士仍可長驅直入痛擊敵方英雄本體！",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: EMPTY, enemyBack: [MUSHROOM, null, null, null],
    attacker: KNIGHT_POSITION, target: "hero", guardian: null, blocked: false, hitHero: true,
    notice: "前排無阻擋！騎士破路直取敵方英雄（20 → 17 HP），不收反擊！", enemyHp: 17,
  },
  {
    id: "taunt", index: "06", tag: "嘲諷護衛", heading: "前排嘲諷，守住自己與相鄰路線",
    summary: "第二路重甲斧兵發動【嘲諷】，形成保護網籠罩第 1、2、3 路，強制騎士必須先打它！",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: [null, AXEMAN, null, null], enemyBack: EMPTY,
    attacker: KNIGHT_POSITION, target: "hero", guardian: { side: "enemy", row: "front", lane: 1 },
    blocked: true, hitHero: false,
    notice: "相鄰嘲諷牽引：受重甲斧兵護衛影響，必須優先攻擊嘲諷者！", enemyHp: 20,
  },
  {
    id: "flying", index: "07", tag: "飛行特權", heading: "飛行直擊英雄，可以越過阻擋",
    summary: "石像鬼哨兵具備【飛行】，攻擊敵方英雄時能振翅高飛越過地面阻擋與嘲諷，直接爆頭！",
    playerFront: [GARGOYLE, null, null, ROGUE], playerBack: EMPTY,
    enemyFront: [TREANT, AXEMAN, null, null], enemyBack: EMPTY,
    attacker: KNIGHT_POSITION, target: "hero", guardian: null, blocked: false, hitHero: true,
    notice: "【飛行】越過地面阻擋與嘲諷！英雄受擊（20 → 17 HP）！", enemyHp: 17,
  },
];

/* ------------------------------------------------------------------ */

export type CardTypeId = "minion" | "arcana" | "quick" | "equip" | "ward" | "domain";

export interface CardType {
  id: CardTypeId;
  zh: string;
  en: string;
  rule: string;
  timing: string;
  art: string;
  artAlt: string;
}

export const CARD_TYPES: CardType[] = [
  {
    id: "minion", zh: "從者", en: "Minion",
    rule: "站上前後排的戰鬥單位，有攻擊力與生命值。",
    timing: "主要階段召喚", art: "/media/cards/knight.webp", artAlt: "從者卡「騎士」的卡圖",
  },
  {
    id: "arcana", zh: "秘術", en: "Arcana",
    rule: "自己回合施放的主動法術，依卡文結算後入墓。",
    timing: "自己的主要階段", art: "/media/cards/arcana_fireblast.webp", artAlt: "秘術卡「火焰爆裂」的卡圖",
  },
  {
    id: "quick", zh: "瞬咒", en: "Quick",
    rule: "守方的反應法術，在符合卡文的事件出現時反制。",
    timing: "守方 · 符合卡文的反應時機", art: "/media/cards/quick_void_rebuke.webp", artAlt: "瞬咒卡「虛空反噬」的卡圖",
  },
  {
    id: "equip", zh: "靈裝", en: "Equip",
    rule: "附著在我方從者身上的裝備，持續提供加成。",
    timing: "主要階段附著", art: "/media/cards/equip_mithril_plate.webp", artAlt: "靈裝卡「秘銀胸鎧」的卡圖",
  },
  {
    id: "ward", zh: "伏印", en: "Ward",
    rule: "蓋在從者底下的陷阱，不佔卡槽，符合條件才觸發。",
    timing: "主要階段埋設 · 依卡文觸發", art: "/media/cards/ward_thorn_sigil.webp", artAlt: "伏印卡「荊棘伏印」的卡圖",
  },
  {
    id: "domain", zh: "結界", en: "Domain",
    rule: "持續存在的領域卡，依種族與卡文支援我方戰場。",
    timing: "主要階段設置 · 依卡文持續觸發", art: "/media/cards/domain_fairy_forest.webp", artAlt: "結界卡「妖精之森」的卡圖",
  },
];

/** 依卡型 id 取資料；id 由型別限定，查不到代表資料表漏列，直接報錯。 */
export function cardType(id: CardTypeId): CardType {
  const card = CARD_TYPES.find((item) => item.id === id);
  if (!card) throw new Error(`Unknown card type: ${id}`);
  return card;
}

export interface SystemRule {
  label: string;
  value: string;
  note: string;
}

export const ACTION_RULES: SystemRule[] = [
  { label: "Attack", value: "1 / turn", note: "每個從者每回合一次普攻，免費。" },
  { label: "Active skill", value: "1 / turn", note: "技能要花魔力；強化攻擊和遠程法術與普攻擇一。" },
  { label: "Ranged spell", value: "普攻擇一", note: "限明列的五項從者技能，不受目標反擊；仍需魔力，與普攻共用一次行動，受召喚暈眩、目標限制與反制規則。不算秘術，也不計連奏。" },
  { label: "Summoning sickness", value: "1 turn", note: "召喚當回合不能普攻或使用攻擊型技能，【衝鋒】除外。" },
  { label: "Hero HP", value: "20", note: "歸零落敗。打英雄不受反擊。" },
  { label: "PvE turn", value: "不限時", note: "對 AI 沒有倒數，可以慢慢讀卡。" },
  { label: "PvP turn", value: "100 秒", note: "最後 15 秒倒數，逾時自動結束回合。" },
];

export const RESOURCE_RULES: SystemRule[] = [
  { label: "Mana", value: "+1 / turn", note: "每回合上限 +1 並回滿，最高 10。" },
  { label: "Carry over", value: "refill", note: "剩下的魔力可在對手回合反制，但不累加。" },
  { label: "Discard for mana", value: "Cost ÷ 2 ↑", note: "棄一張手牌，獲得費用一半向上取整的暫時魔力；下一個自己的回合不能再用。" },
  { label: "Deck", value: "60", note: "同名卡最多 3 張。抽完不扣血。" },
  { label: "Hand limit", value: "8", note: "滿手再抽直接入墓，雙方都看得到。" },
  { label: "Natural draw", value: "空手抽 2", note: "通常抽一張；手牌空了抽兩張。" },
  { label: "Opening order", value: "隨機先手", note: "後手拿到一次性後援。" },
];

/** 玩家只使用持有卡自組牌組；內部 AI 預組不可選作玩家牌組。 */
export const COLLECTION_FEATURES: SystemRule[] = [
  { label: "Card pool", value: "244 + 21", note: "244 種可收藏，21 種是效果打出來的衍生物。" },
  { label: "Starter draws", value: "150 次", note: "新帳號專用，不吃每日券；湊滿 60 張就能開打。" },
  { label: "Your deck", value: "60 張 · 每卡最多 3", note: "用持有卡自組，存檔後選用即可。" },
  { label: "Daily pack ticket", value: "1 券／登入日", note: "登入日領一券，可累積。" },
  { label: "Online account", value: "帳號登入", note: "外網要登入並同步收藏；訪客收藏只留在這台電腦。" },
];

export const SPOILS_RULES: SystemRule[] = [
  { label: "Win a formal PvP match", value: "選 1 張", note: "從敗者本局的起始牌組挑一張，雙方收藏實際增減。" },
  { label: "Practice and disconnects", value: "不奪卡", note: "AI、訪客與區網不列戰績，也不產生戰利品。" },
];

export interface GameMode {
  zh: string;
  en: string;
  body: string;
  meta: string;
}

export const GAME_MODES: GameMode[] = [
  {
    zh: "單人練習", en: "AI Practice",
    body: "自組 60 張就能和 AI 對戰，回合不限時。",
    meta: "離線 · 訪客可玩 · 19 副 AI 預組",
  },
  {
    zh: "區網對戰", en: "Local Network",
    body: "同一個網路，一人開房、另一人輸入房主位址加入。",
    meta: "同網路 · 玩家開房 · 不列正式戰績",
  },
  {
    zh: "外網配對與房間", en: "Online Lobby",
    body: "登入後進大廳，開公開房或用房碼開私人房。",
    meta: "兩人一房 · 每回合 100 秒",
  },
];

export const NETWORK_NOTES = [
  { label: "Protocol", value: `${GAME_FACTS.protocol} · 雙方需相容版本` },
  { label: "LAN", value: "ENet · UDP 8910" },
  { label: "Online", value: "專用伺服器主持" },
  { label: "On disconnect", value: "斷線結束該局" },
];

export interface Arena {
  zh: string;
  en: string;
  note: string;
  image: string;
}

export const ARENAS: Arena[] = [
  { zh: "森林", en: "Forest", note: "溪流穿過河床，草坡、岩台與樹叢沿著兩側延伸。", image: "/media/screens/arena-forest.webp" },
  { zh: "洞窟", en: "Caverns", note: "發光蘑菇、鐘乳石與起伏岩台，薄霧與暖光交錯。", image: "/media/screens/arena-caverns.webp" },
  { zh: "冰原", en: "Frostlands", note: "結冰河面、雪堤與雪松，冷光落在冰稜之間。", image: "/media/screens/arena-frostlands.webp" },
];

export const ROSTER = [
  { art: "/media/cards/frost_witch.webp", name: "冰霜女巫" },
  { art: "/media/cards/treant_guardian.webp", name: "樹靈守衛" },
  { art: "/media/cards/necromancer.webp", name: "死靈法師" },
  { art: "/media/cards/harpy_hunter.webp", name: "鷹身人獵手" },
  { art: "/media/cards/pirate_captain.webp", name: "海盜船長" },
  { art: "/media/cards/dwarf_smith.webp", name: "矮人鍛造師" },
  { art: "/media/cards/ratfolk_plague_doctor.webp", name: "鼠人疫醫" },
  { art: "/media/cards/lizard_warrior.webp", name: "蜥蜴人戰士" },
  { art: "/media/cards/wandering_bard.webp", name: "流浪吟遊詩人" },
  { art: "/media/cards/gargoyle_sentinel.webp", name: "石像鬼哨兵" },
  { art: "/media/cards/catfolk_rogue.webp", name: "貓族盜賊" },
  { art: "/media/cards/mushroom_mage.webp", name: "蘑菇術士" },
];
