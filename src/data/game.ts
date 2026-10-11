/** 依 canonical Godot 專案 R5 規則核對；下載成品資訊另見 releases.ts。 */
export const GAME_FACTS = {
  nameZh: "暮色秘典",
  nameEn: "Twilight Codex",
  version: "2026.10.11-R5",
  engine: "Godot 4.7",
  lanes: 4,
  cards: 244,
  tokens: 21,
  aiPresets: 19,
  protocol: 14,
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
  heading: string;
  body: string;
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
    id: "field", index: "01", heading: "四條路線，每路都有前後排",
    body: "雙方各有四個前排與四個後排卡槽。從者可放進任一空著的我方卡槽；召喚當回合不能普攻或使用攻擊型技能，除非帶有【衝鋒】。",
    playerFront: EMPTY, playerBack: EMPTY, enemyFront: EMPTY, enemyBack: EMPTY,
    attacker: null, target: null, guardian: null, blocked: false, hitHero: false,
    notice: "雙方各有四路 × 前後兩排。", enemyHp: 20,
  },
  {
    id: "cross-lane", index: "02", heading: "敵方前排，可以跨路選目標",
    body: "第一路的騎士可以攻擊第三路的石像鬼哨兵。普通攻擊不限定正前方；沒有嘲諷限制時，敵方前排都能成為目標。攻擊從者會交換傷害。",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: [null, null, GARGOYLE, null], enemyBack: [null, null, MUSHROOM, null],
    attacker: KNIGHT_POSITION, target: { side: "enemy", row: "front", lane: 2 },
    guardian: null, blocked: false, hitHero: false,
    notice: "騎士（第 1 路） → 石像鬼哨兵（第 3 路）：可以指定。", enemyHp: 20,
  },
  {
    id: "back-guard", index: "03", heading: "前排保護自己那一路的後排",
    body: "第三路的石像鬼哨兵仍在場，後面的蘑菇術士就不能被普通攻擊或攻擊型技能直接指定。先移除那名同路前排，才會打開後排；法術與非攻擊技能依卡文判斷。",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: [null, null, GARGOYLE, null], enemyBack: [null, null, MUSHROOM, null],
    attacker: KNIGHT_POSITION, target: { side: "enemy", row: "back", lane: 2 },
    guardian: { side: "enemy", row: "front", lane: 2 }, blocked: true, hitHero: false,
    notice: "蘑菇術士受同路前排保護：不能直接攻擊。", enemyHp: 20,
  },
  {
    id: "hero-blocked", index: "04", heading: "打英雄，檢查攻擊者自己的路線",
    body: "第四路的貓族盜賊想直擊英雄，會被同路的樹靈守衛擋住。選敵方前排可以跨路；攻擊英雄則要先看攻擊者那一路有沒有敵方前排。",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: [null, null, null, TREANT], enemyBack: EMPTY,
    attacker: { side: "player", row: "front", lane: 3 }, target: "hero",
    guardian: { side: "enemy", row: "front", lane: 3 }, blocked: true, hitHero: false,
    notice: "貓族盜賊（第 4 路） → 英雄：被同路前排擋住。", enemyHp: 20,
  },
  {
    id: "open-lane", index: "05", heading: "前排空了，後排不替英雄擋傷害",
    body: "第一路只有敵方後排蘑菇術士，前排空著，也沒有嘲諷守護。騎士便能直擊英雄，造成基礎攻擊力 3 點傷害；打英雄不會受到反擊。",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: EMPTY, enemyBack: [MUSHROOM, null, null, null],
    attacker: KNIGHT_POSITION, target: "hero", guardian: null, blocked: false, hitHero: true,
    notice: "騎士直擊英雄：20 → 17。後排不阻擋英雄攻擊。", enemyHp: 17,
  },
  {
    id: "taunt", index: "06", heading: "前排嘲諷，守住自己與相鄰路線",
    body: "第二路的重甲斧兵帶有【嘲諷】，會守護第一、二、三路。第一路的騎士必須先選它，不能改打其他從者或英雄；第四路不在這名守護者的範圍。",
    playerFront: PLAYER_FRONT, playerBack: EMPTY,
    enemyFront: [null, AXEMAN, null, null], enemyBack: EMPTY,
    attacker: KNIGHT_POSITION, target: "hero", guardian: { side: "enemy", row: "front", lane: 1 },
    blocked: true, hitHero: false,
    notice: "第 1 路受相鄰嘲諷守護：必須先攻擊重甲斧兵。", enemyHp: 20,
  },
  {
    id: "flying", index: "07", heading: "飛行直擊英雄，可以越過阻擋",
    body: "石像鬼哨兵帶有【飛行】，攻擊英雄時能越過同路前排與嘲諷守護。這個例外只適用於直擊英雄；攻擊從者仍要遵守嘲諷與前排保護後排的限制。",
    playerFront: [GARGOYLE, null, null, ROGUE], playerBack: EMPTY,
    enemyFront: [TREANT, AXEMAN, null, null], enemyBack: EMPTY,
    attacker: KNIGHT_POSITION, target: "hero", guardian: null, blocked: false, hitHero: true,
    notice: "石像鬼哨兵飛越前排與嘲諷，英雄 20 → 17。", enemyHp: 17,
  },
];

/* ------------------------------------------------------------------ */

export type CardTypeId = "minion" | "arcana" | "quick" | "equip" | "ward" | "domain";

export interface CardType {
  id: CardTypeId;
  zh: string;
  en: string;
  rule: string;
  detail: string;
  timing: string;
  art: string;
  artAlt: string;
}

export const CARD_TYPES: CardType[] = [
  {
    id: "minion", zh: "從者", en: "Minion",
    rule: "站上前後排的戰鬥單位，有攻擊力與生命值。",
    detail: "每回合最多一次普攻與一次技能。強化攻擊會用掉普攻；獨立攻擊可另外發動，非攻擊技能是否共用普攻則看卡文。攻擊從者時雙方交換傷害。",
    timing: "主要階段召喚", art: "/media/cards/knight.webp", artAlt: "從者卡「騎士」的卡圖",
  },
  {
    id: "arcana", zh: "秘術", en: "Arcana",
    rule: "自己回合施放的主動法術，依卡文結算後入墓。",
    detail: "宣告時支付魔力，守方有反制機會。指定單體、全體、抽牌或墓地效果各依卡文處理；潛行單位不能被敵方單體秘術指定。",
    timing: "自己的主要階段", art: "/media/cards/arcana_fireblast.webp", artAlt: "秘術卡「火焰爆裂」的卡圖",
  },
  {
    id: "quick", zh: "瞬咒", en: "Quick",
    rule: "守方的反應法術，在符合卡文的事件出現時反制。",
    detail: "不同瞬咒可回應秘術、召喚、普攻、技能或伏印等事件，並消耗守方剩餘魔力。不能在主要階段主動打出；已埋設伏印也能在對手回合觸發。",
    timing: "守方 · 符合卡文的反應時機", art: "/media/cards/quick_void_rebuke.webp", artAlt: "瞬咒卡「虛空反噬」的卡圖",
  },
  {
    id: "equip", zh: "靈裝", en: "Equip",
    rule: "附著在我方從者身上的裝備，持續提供加成。",
    detail: "一名從者一次只能帶一件。新的取代舊的，收回舊加成並把現有生命限制在新上限內，舊卡入墓；宿主離場通常一併離場，特殊效果依卡文處理。",
    timing: "主要階段附著", art: "/media/cards/equip_mithril_plate.webp", artAlt: "靈裝卡「秘銀胸鎧」的卡圖",
  },
  {
    id: "ward", zh: "伏印", en: "Ward",
    rule: "蓋在從者底下的陷阱，不佔卡槽，符合條件才觸發。",
    detail: "一般埋在我方從者底下，一名宿主最多一張；【屍變伏印】則埋在敵方從者底下。埋設時只公開有伏印，觸發後才揭露卡名與效果。",
    timing: "主要階段埋設 · 依卡文觸發", art: "/media/cards/ward_thorn_sigil.webp", artAlt: "伏印卡「荊棘伏印」的卡圖",
  },
  {
    id: "domain", zh: "結界", en: "Domain",
    rule: "持續存在的領域卡，依種族與卡文支援我方戰場。",
    detail: "每側同時最多一張，不佔從者卡槽；打出新結界會取代舊結界，舊卡入墓。妖精之森會在每個己方回合首名妖精進場時，於同路空著的我方前排召喚 1／2 樹精；同路前排已有卡仍會用掉本回合的觸發。",
    timing: "主要階段設置 · 依卡文持續觸發", art: "/media/cards/domain_fairy_forest.webp", artAlt: "結界卡「妖精之森」的卡圖",
  },
];

export interface SystemRule {
  label: string;
  value: string;
  note: string;
}

export const ACTION_RULES: SystemRule[] = [
  { label: "PvE turn", value: "不限時", note: "單人與 AI 對戰可慢慢閱讀效果、安排出牌，沒有回合倒數。" },
  { label: "PvP turn", value: "100 秒", note: "連線真人對戰每回合 100 秒，最後 15 秒顯示倒數；時間用完停止接受新操作，現有效果結算完成後自動結束回合。需要回應的選擇視窗自開啟起有 20 秒，逾時採用預設選項。" },
  { label: "Attack", value: "1 / turn", note: "每個從者每回合最多一次普通攻擊，免費。" },
  { label: "Active skill", value: "1 / turn", note: "技能消耗魔力；強化攻擊與普攻擇一，其他技能是否共用攻擊依卡文。" },
  { label: "Summoning sickness", value: "1 turn", note: "召喚當回合不能普攻或用攻擊型技能，除非帶【衝鋒】。" },
  { label: "Hero HP", value: "20", note: "降到 0 即落敗。打英雄不受到反擊。" },
];

export const RESOURCE_RULES: SystemRule[] = [
  { label: "Mana", value: "+1 / turn", note: "輪到自己的回合時，自然魔力上限 +1 並回滿，最高 10。" },
  { label: "Carry over", value: "refill", note: "剩餘魔力可供守方反應使用；下次自己的回合重新回滿，不累加。" },
  { label: "Deck", value: "60", note: "同名卡最多 3 張，並且必須持有足夠份數。抽完不再抽，沒有疲勞傷害。" },
  { label: "Hand limit", value: "8", note: "滿手時抽到的牌直接入墓，雙方都能看見。" },
  { label: "Discard for mana", value: "Cost ÷ 2", note: "捨一張手牌換暫時魔力，無條件捨去；下一個自己的回合不能再用，再下一回合恢復。" },
];

/** 玩家只使用持有卡自組牌組；內部 AI 預組不可選作玩家牌組。 */
export const COLLECTION_FEATURES: SystemRule[] = [
  { label: "Card pool", value: "244 + 21", note: "244 種正式卡可收藏與組牌，另有 21 種由效果產生的衍生物或形態。卡型包含從者、秘術、瞬咒、靈裝、伏印與結界。" },
  { label: "Starter draws", value: "150 次新手額度", note: "新玩家從空收藏開始，可一次抽 1／10／50／100 張，不消耗每日包券。合法持有六十張即可對戰，剩餘額度可稍後領取；這是抽卡次數，不是 150 包。" },
  { label: "Your deck", value: "60 張 · 每卡最多 3", note: "新手額度未用完也能從主選單用持有卡組牌、保存草稿。保存完整 60 張、每卡不超過 3 張且持有量足夠的自組牌組，再選用它，即可進入對戰，不必抽完新手額度。" },
  { label: "Card effects", value: "選牌即可閱讀", note: "組牌畫面固定顯示目前卡牌的完整效果；懸停、鍵盤聚焦或選取即可查看。牌組清單選卡先閱讀效果，使用「移除一張」或 Delete 移除。" },
  { label: "AI opponents", value: "19 副內部 AI 預組", note: "AI 使用內部預組作為對手；這些預組不供玩家選用。玩家可篩選持有卡、查看費用曲線、保存草稿，再完成自己的牌組。" },
  { label: "Daily pack ticket", value: "1 券／登入日", note: "每日以台灣時間 00:00 換日；登入日可領一券並累積，未登入的日期不補發。新手抽完前，一般卡包尚未開放，包券仍可累積。" },
  { label: "Collection limit", value: "滿 3 張不再抽到", note: "一般卡包每包 5 張，已持有 3 張的卡不再加入可抽清單。稀有度按可抽卡池的相對權重抽取，沒有保底；既有收藏不重置。" },
  { label: "Guest collection", value: "保存在本機", note: "訪客收藏與牌組保存在這台電腦，不能當作正式帳號的雲端持有量；訪客、AI 與區網練習不列入正式戰績。" },
  { label: "Online account", value: "帳號登入 · 雙人房間", note: "正式外網需要登入、同步帳號收藏，並選用雲端持有量足夠的合法六十張自組牌組。本機訪客可瀏覽大廳，透過「電子郵件登入」入口完成登入後再開房；訪客收藏不會搬到雲端。" },
];

export const SPOILS_RULES: SystemRule[] = [
  { label: "Win a formal PvP match", value: "選 1 張", note: "正常擊敗真人後，勝者從敗者本局的起始牌組選一張卡作為戰利品。" },
  { label: "Actual card transfer", value: "勝者 +1 · 敗者 −1", note: "領取會實際改變雙方收藏；勝者已持有 3 張的卡不能選，敗者也必須仍持有該卡。" },
  { label: "Claim before playing again", value: "先完成結算", note: "有可領取的戰利品時，必須先處理，才能開始下一場真人對戰。" },
  { label: "Practice and disconnects", value: "依對戰類型處理", note: "訪客、AI 與區網不列入正式戰績。正式對戰開賽後離開或斷線會記敗，但不產生奪卡戰利品。" },
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
    body: "以持有卡自組合法的 60 張牌組、保存並選用，即可進入「單人遊戲」與 AI 對戰，不必先抽完新手額度。PvE 不限時，可慢慢閱讀卡牌效果；也能先開「新手教學」熟悉規則。AI 的 19 副內部預組不供玩家選用。",
    meta: "離線 · 本機訪客可玩 · 回合不限時",
  },
  {
    zh: "區網對戰", en: "Local Network",
    body: "兩台電腦連到同一個網路，在「多人遊戲 → 進階／區網」由一人開房，另一人輸入房主位址加入。雙方必須使用相容版本，房主需允許遊戲通過防火牆。連線對戰每回合 100 秒，最後 15 秒顯示倒數；逾時停止接受新操作，現有效果結算完成後自動結束回合。",
    meta: "同一網路 · 玩家開房 · 不列正式戰績",
  },
  {
    zh: "外網配對與房間", en: "Online Lobby",
    body: "進入線上大廳即可查看線上玩家數與公開等待房。本機訪客會看到登入提示與「電子郵件登入」入口；登入並同步帳號收藏後，選用合法持有的六十張牌組，就能建立或加入房間，無須抽完新手額度。每房兩人，雙方準備完成才開局；每回合 100 秒，最後 15 秒倒數，逾時停止接受新操作，現有效果結算完成後自動結束回合。",
    meta: "兩人對戰 · 公開房列表 · 私人房以房碼加入",
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
