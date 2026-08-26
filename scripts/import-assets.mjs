// 從 Godot 專案搬真實素材進 public/：卡圖壓成 webp、遊戲截圖壓成 webp。
// 用法：node scripts/import-assets.mjs
import sharp from "sharp";
import { mkdir, readdir, copyFile } from "node:fs/promises";
import path from "node:path";

const GAME = "e:/Game/card-game-demo(4.5)";
const SHOTS =
  "C:/Users/whw88/AppData/Local/Temp/claude/e--Game-card-game-demo-4-5-/b90fb5f2-f491-4bb7-8a5c-767ebe675d55/scratchpad/shots";
const OUT = "public/media";

const CARD_ART = [
  "knight", "treant_guardian", "necromancer", "catfolk_rogue",
  "gargoyle_sentinel", "harpy_hunter", "pirate_captain", "mushroom_mage",
  "ratfolk_plague_doctor", "dwarf_smith", "lizard_warrior", "wandering_bard",
  "arcana_fireblast", "arcana_frost_shackles", "arcana_star_tempest",
  "quick_void_rebuke", "quick_reversal_edict",
  "equip_mithril_plate",
  "ward_thorn_sigil", "ward_blast_sigil",
];

const SCREENSHOTS = {
  "battle_caverns": "arena-caverns",
  "battle_forest": "arena-forest",
  "battle_frostlands": "arena-frostlands",
  "main_menu": "main-menu",
};

await mkdir(`${OUT}/cards`, { recursive: true });
await mkdir(`${OUT}/screens`, { recursive: true });

for (const slug of CARD_ART) {
  const src = path.join(GAME, "assets/ui/card_art", `${slug}_card_art.png`);
  const dst = path.join(OUT, "cards", `${slug}.webp`);
  await sharp(src).resize({ width: 720 }).webp({ quality: 82 }).toFile(dst);
  console.log("card  ->", dst);
}

// 冰霜女巫的檔名是大寫別名
await sharp(path.join(GAME, "assets/ui/card_art/Frost_Witch_CardArt.png"))
  .resize({ width: 720 }).webp({ quality: 82 })
  .toFile(path.join(OUT, "cards", "frost_witch.webp"));
console.log("card  -> frost_witch.webp");

for (const [src, slug] of Object.entries(SCREENSHOTS)) {
  const dst = path.join(OUT, "screens", `${slug}.webp`);
  await sharp(path.join(SHOTS, `${src}.png`))
    .resize({ width: 1600 }).webp({ quality: 86 }).toFile(dst);
  const meta = await sharp(dst).metadata();
  console.log("shot  ->", dst, `${meta.width}x${meta.height}`);
}
