/**
 * 遊戲事實。全部取自 CardGame Demo 的 Gameplay Spec，不是行銷詞。
 * 規格改了就改這裡，版面不用動。
 */

export interface LaneUnit {
  name: string;
  atk: number;
  hp: number;
  /** 卡池裡真的那張卡的卡圖 */
  art: string;
  /** 嘲諷單位：守護左右相鄰路線 */
  taunt?: boolean;
}

/** 五條路線的推演步驟。Section 02 靠 scroll 逐步推進。 */
export interface LaneStep {
  id: string;
  index: string;
  heading: string;
  body: string;
  /** index 0-4 對應路線 1-5 */
  player: (LaneUnit | null)[];
  enemy: (LaneUnit | null)[];
  /** 這一步有攻擊推出去的路線 */
  attacks: number[];
  /** 被前排擋下的路線 */
  blocked: number[];
  /** 一路打到本體的路線 */
  toFace: number[];
  /** 被嘲諷改道：from 路線的攻擊被 to 路線的嘲諷單位接走 */
  taunted: { from: number; to: number } | null;
  enemyHp: number;
}

const PLAYER_LINE: (LaneUnit | null)[] = [
  { name: "騎士", atk: 4, hp: 5, art: "/media/cards/knight.webp" },
  null,
  { name: "樹人守衛", atk: 3, hp: 8, art: "/media/cards/treant_guardian.webp" },
  { name: "貓族盜賊", atk: 5, hp: 3, art: "/media/cards/catfolk_rogue.webp" },
  null,
];

export const LANE_STEPS: LaneStep[] = [
  {
    id: "field",
    index: "01",
    heading: "戰場是五條並排的路線",
    body: "雙方各佔一側，路線一對一正面對應。沒有「自由選目標」這回事——你把單位放在第幾路，就決定了它會和誰對上。",
    player: [null, null, null, null, null],
    enemy: [null, null, null, null, null],
    attacks: [],
    blocked: [],
    toFace: [],
    taunted: null,
    enemyHp: 20,
  },
  {
    id: "summon",
    index: "02",
    heading: "召喚就是選路",
    body: "支付魔力把從者放進卡槽。放下去的那一刻，你已經替它決定了這局要面對的方向。召喚當回合它不能攻擊，除非帶著【衝鋒】。",
    player: PLAYER_LINE,
    enemy: [null, null, null, null, null],
    attacks: [],
    blocked: [],
    toFace: [],
    taunted: null,
    enemyHp: 20,
  },
  {
    id: "straight",
    index: "03",
    heading: "攻擊只走正前方",
    body: "從者不會斜著打，也不會挑軟柿子。攻擊沿著自己那條路線筆直推出去，碰到什麼就打什麼。",
    player: PLAYER_LINE,
    enemy: [null, null, null, null, null],
    attacks: [0, 2, 3],
    blocked: [],
    toFace: [],
    taunted: null,
    enemyHp: 20,
  },
  {
    id: "block",
    index: "04",
    heading: "有人站著，就過不去",
    body: "對手在第三路擺上前排，那一路的攻擊停在它身上，雙方同時交換傷害——ATK 既是攻擊力，也是反擊力。其餘路線依然空著。",
    player: PLAYER_LINE,
    enemy: [null, null, { name: "石像哨兵", atk: 4, hp: 6, art: "/media/cards/gargoyle_sentinel.webp" }, null, null],
    attacks: [0, 2, 3],
    blocked: [2],
    toFace: [],
    taunted: null,
    enemyHp: 20,
  },
  {
    id: "face",
    index: "05",
    heading: "沒人站著，就打在臉上",
    body: "第一路與第四路前方無人阻擋，攻擊直接落到對手本體。本體只有 20 點——空著的那條路，就是漏出去的傷害。",
    player: PLAYER_LINE,
    enemy: [null, null, { name: "石像哨兵", atk: 4, hp: 6, art: "/media/cards/gargoyle_sentinel.webp" }, null, null],
    attacks: [0, 2, 3],
    blocked: [2],
    toFace: [0, 3],
    taunted: null,
    enemyHp: 11,
  },
  {
    id: "taunt",
    index: "06",
    heading: "嘲諷把傷害拉過來",
    body: "在路線制裡，「逼你打我」在同一路本來就成立，所以嘲諷改成守護型：它額外罩住左右相鄰路線。第四路原本能打臉，現在被隔壁的嘲諷單位接了下來。",
    player: PLAYER_LINE,
    enemy: [
      null,
      null,
      { name: "石像哨兵", atk: 4, hp: 6, art: "/media/cards/gargoyle_sentinel.webp" },
      null,
      { name: "蕈菇法師", atk: 2, hp: 7, taunt: true, art: "/media/cards/mushroom_mage.webp" },
    ],
    attacks: [0, 2, 3],
    blocked: [2],
    toFace: [0],
    taunted: { from: 3, to: 4 },
    enemyHp: 7,
  },
];

/* ------------------------------------------------------------------ */

export type CardTypeId = "minion" | "arcana" | "quick" | "equip" | "ward";

export interface CardType {
  id: CardTypeId;
  zh: string;
  en: string;
  /** 一句話說清楚它跟其他卡型的差別 */
  rule: string;
  /** 真正有識別度的那條規則細節 */
  detail: string;
  timing: string;
  art: string;
  artAlt: string;
}

export const CARD_TYPES: CardType[] = [
  {
    id: "minion",
    zh: "從者",
    en: "Minion",
    rule: "站上路線的戰鬥單位，有攻擊力與生命值。",
    detail:
      "每回合有 1 次攻擊 + 1 次主動技能，兩者獨立計算。攻擊時雙向交換傷害——ATK 同時是攻擊力與反擊力。",
    timing: "主要階段召喚",
    art: "/media/cards/knight.webp",
    artAlt: "從者卡「騎士」的卡圖",
  },
  {
    id: "arcana",
    zh: "秘術",
    en: "Arcana",
    rule: "主動法術。宣告即付費，結算完就離場。",
    detail:
      "只有攻方能在自己回合施放。指定目標的當下就開啟反制窗口，守方有機會把它擋掉。潛行單位不能被指定。",
    timing: "僅攻方 · 自己回合",
    art: "/media/cards/arcana_fireblast.webp",
    artAlt: "秘術卡的卡圖",
  },
  {
    id: "quick",
    zh: "瞬咒",
    en: "Quick",
    rule: "反應法術。唯一能在對手回合出手的牌。",
    detail:
      "只在反制窗口打得出來，用來抵銷對方的秘術或伏印。後發先解——它會比被反制的那張先結算完。",
    timing: "僅守方 · 反制窗口",
    art: "/media/cards/quick_void_rebuke.webp",
    artAlt: "瞬咒卡的卡圖",
  },
  {
    id: "equip",
    zh: "靈裝",
    en: "Equip",
    rule: "附著在我方從者身上的裝備，持續加成。",
    detail:
      "一名從者一次只能帶一件：新的蓋掉舊的，舊加成收回、現有生命夾回上限，舊卡入墓。宿主陣亡，靈裝跟著陪葬。",
    timing: "主要階段附著",
    art: "/media/cards/equip_mithril_plate.webp",
    artAlt: "靈裝卡的卡圖",
  },
  {
    id: "ward",
    zh: "伏印",
    en: "Ward",
    rule: "蓋著埋在我方從者底下的陷阱，不佔卡槽。",
    detail:
      "埋下去以後，我方整排卡槽開始紅色脈動。對手知道場上有陷阱，但不知道埋在哪個從者底下——連系統訊息都不報宿主的名字。",
    timing: "主要階段埋設",
    art: "/media/cards/ward_thorn_sigil.webp",
    artAlt: "伏印卡「荊棘伏印」的卡圖",
  },
];

/* ------------------------------------------------------------------ */

export interface SystemRule {
  label: string;
  value: string;
  note: string;
}

export const ACTION_RULES: SystemRule[] = [
  { label: "Attack", value: "1 / turn", note: "每個從者每回合一次普通攻擊，免費。" },
  { label: "Active skill", value: "1 / turn", note: "與攻擊分開計算，消耗魔力，可各用一次。" },
  { label: "Summoning sickness", value: "1 turn", note: "召喚當回合不能攻擊，除非帶【衝鋒】。" },
  { label: "Hero HP", value: "20", note: "降到 0 即落敗。打臉不吃反擊。" },
];

export const RESOURCE_RULES: SystemRule[] = [
  { label: "Mana", value: "+1 / turn", note: "回合開始 +1 並回滿，上限 10。" },
  { label: "Carry over", value: "none", note: "沒用完的魔力不留到下回合。" },
  { label: "Deck", value: "60", note: "同名卡最多 3 張。抽完不再抽，也沒有疲勞傷害。" },
  { label: "Hand limit", value: "8", note: "滿手時抽到的牌當場銷毀，雙方都看得到。" },
  { label: "Discard for mana", value: "Cost ÷ 2", note: "捨 1 張手牌換暫時魔力，無條件捨去，隔回合才能再用。" },
];

/* ------------------------------------------------------------------ */

export interface GameMode {
  zh: string;
  en: string;
  body: string;
  meta: string;
}

export const GAME_MODES: GameMode[] = [
  {
    zh: "單人練習",
    en: "AI Practice",
    body: "敵方 AI 被寫成「另一個會按按鈕的玩家」：它的每個動作都走與連線相同的結算路徑，不吃特權、不偷看你的手牌。",
    meta: "離線 · 單機",
  },
  {
    zh: "熱座雙人",
    en: "Hot Seat",
    body: "同一台機器輪流。雙方各有獨立的魔力、牌堆與手牌帳，換回合就換手牌視圖——非行動方的單位動不了。",
    meta: "離線 · 同機兩人",
  },
  {
    zh: "連線對戰",
    en: "Host / Client",
    body: "一方開房、一方輸入 IP 加入。開局由房主把雙方牌堆與起手打包同步，之後的召喚、攻擊、技能、法術全走 RPC 在兩台重放。",
    meta: "區網 · 異地",
  },
];

/** 連線的技術腳註：用規格表的語氣，不做成技術行銷。 */
export const NETWORK_NOTES = [
  { label: "Transport", value: "ENet · UDP 8910" },
  { label: "Sync", value: "開局發帳，之後 RPC 重放" },
  { label: "NAT", value: "UPnP 自動轉發" },
  { label: "Fallback", value: "手動轉發 · Tailscale" },
];

/* ------------------------------------------------------------------ */

export interface Arena {
  zh: string;
  en: string;
  note: string;
  image: string;
}

export const ARENAS: Arena[] = [
  {
    zh: "森林",
    en: "Forest",
    note: "程序生成的草泥地與樹叢，一條溪流橫過戰場中線。",
    image: "/media/screens/arena-forest.webp",
  },
  {
    zh: "洞窟",
    en: "Caverns",
    note: "發光蘑菇與鐘乳石，暖色餘燼從岩壁滲出來。",
    image: "/media/screens/arena-caverns.webp",
  },
  {
    zh: "冰原",
    en: "Frostlands",
    note: "結冰的河面與雪松，冰稜從地表刺出。",
    image: "/media/screens/arena-frostlands.webp",
  },
];

/** 首屏底下那排卡圖：真的卡池裡的角色，不是裝飾。 */
export const ROSTER = [
  { art: "/media/cards/frost_witch.webp", name: "冰霜女巫" },
  { art: "/media/cards/treant_guardian.webp", name: "樹人守衛" },
  { art: "/media/cards/necromancer.webp", name: "死靈法師" },
  { art: "/media/cards/harpy_hunter.webp", name: "鷹身獵手" },
  { art: "/media/cards/pirate_captain.webp", name: "海盜船長" },
  { art: "/media/cards/dwarf_smith.webp", name: "矮人鐵匠" },
  { art: "/media/cards/ratfolk_plague_doctor.webp", name: "鼠人瘟醫" },
  { art: "/media/cards/lizard_warrior.webp", name: "蜥蜴戰士" },
  { art: "/media/cards/wandering_bard.webp", name: "流浪吟遊詩人" },
  { art: "/media/cards/gargoyle_sentinel.webp", name: "石像哨兵" },
  { art: "/media/cards/catfolk_rogue.webp", name: "貓族盜賊" },
  { art: "/media/cards/mushroom_mage.webp", name: "蕈菇法師" },
];
