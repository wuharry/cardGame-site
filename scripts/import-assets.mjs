// 從指定的 Godot 專案匯入真實素材；不下載 LFS，也不改動遊戲資源。
// 用法：node scripts/import-assets.mjs <game-path> [--cards-only] [--menu <screenshot>] [--caverns <screenshot>]
import sharp from "sharp";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(SITE, "public/media");
const CARD_ART = [
  "knight", "treant_guardian", "necromancer", "catfolk_rogue",
  "gargoyle_sentinel", "harpy_hunter", "pirate_captain", "mushroom_mage",
  "ratfolk_plague_doctor", "dwarf_smith", "lizard_warrior", "wandering_bard",
  "arcana_fireblast", "arcana_frost_shackles", "arcana_star_tempest",
  "quick_void_rebuke", "quick_reversal_edict", "equip_mithril_plate",
  "ward_thorn_sigil", "ward_blast_sigil", "frost_witch", "armored_axeman",
  "domain_fairy_forest",
];

// 已逐張檢視的原生截圖。洞窟、雪地目前只有四路改版前的場景擷取，
// 頁面必須保留「較早版本場景預覽」說明；不能拿來說明現行牌位規則。
const SCREENSHOTS = [
  {
    slug: "hero-battlefield",
    source: "docs/qa/combat-interactions-20261009/screenshots/sickness/normal100/next-owning-turn-ready.png",
    note: "四路版本的原生 QA 截圖；使用測試配置，不代表自然對戰紀錄。",
  },
  {
    slug: "arena-forest",
    source: "docs/qa/combat-interactions-20261009/screenshots/sickness/normal100/summoned-versus-ready-and-charge.png",
    note: "四路版本的原生 QA 截圖；呈現召喚疲勞與疾行。",
  },
  {
    slug: "arena-caverns",
    source: "docs/art/clear-water-20261009/after-caverns-front.png",
    note: "較早版本的洞窟場景預覽，仍顯示五路；現行規則為四路。",
  },
  {
    slug: "arena-frostlands",
    source: "docs/art/clear-water-20261009/after-frostlands-front.png",
    note: "較早版本的雪地場景預覽，仍顯示五路；現行規則為四路。",
  },
  {
    slug: "main-menu",
    source: "docs/qa/collection-decks-20261009/menu-zh/01-owned-practice-menu.png",
    note: "2026-10-09 原生主選單截圖，含較早品牌與流程；R3 應另傳 --menu 指定已驗證的新畫面。",
  },
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  const args = process.argv.slice(2);
  if (!args[0] || args[0].startsWith("--")) {
    throw new Error("請指定 Godot 專案路徑：node scripts/import-assets.mjs <game-path> [--cards-only] [--menu <screenshot>]");
  }
  const game = path.resolve(args[0]);
  let cardsOnly = false;
  let menuPath;
  let cavernsPath;
  for (let index = 1; index < args.length; index++) {
    if (args[index] === "--cards-only") cardsOnly = true;
    else if (args[index] === "--menu" && args[index + 1] && !args[index + 1].startsWith("--")) {
      menuPath = path.resolve(args[++index]);
    } else if (args[index] === "--caverns" && args[index + 1] && !args[index + 1].startsWith("--")) {
      cavernsPath = path.resolve(args[++index]);
    } else throw new Error("未知或不完整的參數：" + args[index]);
  }
  if (!(await stat(path.join(game, "project.godot")).catch(() => null))?.isFile()) {
    throw new Error("找不到 project.godot，請確認遊戲來源路徑：" + game);
  }
  const project = await readFile(path.join(game, "project.godot"), "utf8");
  const sourceVersion = project.match(/^config\/version="([^"]+)"/m)?.[1] ?? "未標記版本";

  let commonGitDir;
  async function gameImage(relativePath) {
    const source = path.resolve(game, relativePath);
    const relative = path.relative(game, source);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("圖片來源超出遊戲專案：" + relativePath);
    }
    const buffer = await readFile(source).catch(() => {
      throw new Error("缺少圖片來源：" + source);
    });
    const header = buffer.subarray(0, 256).toString("utf8");
    if (!header.startsWith("version https://git-lfs.github.com/spec/v1")) return buffer;

    const oid = header.match(/^oid sha256:([a-f0-9]{64})$/m)?.[1];
    const size = Number(header.match(/^size (\d+)$/m)?.[1]);
    if (!oid || !Number.isSafeInteger(size)) {
      throw new Error("無效的 Git LFS pointer：" + source);
    }
    if (!commonGitDir) {
      try {
        const gitDir = execFileSync("git", ["rev-parse", "--git-common-dir"], {
          cwd: game, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
        }).trim();
        commonGitDir = path.resolve(game, gitDir);
      } catch {
        throw new Error("圖片尚未下載且無法取得本機 Git LFS cache：" + source);
      }
    }
    const objectPath = path.join(commonGitDir, "lfs/objects", oid.slice(0, 2), oid.slice(2, 4), oid);
    const object = await readFile(objectPath).catch(() => {
      throw new Error("圖片是 Git LFS pointer，且本機 cache 不存在：" + source +
        "。請先準備實體素材後重試；此腳本不下載。");
    });
    if (object.length !== size || sha256(object) !== oid) {
      throw new Error("Git LFS cache 的大小或 SHA256 不符：" + source);
    }
    return object;
  }

  const inputs = [];
  for (const slug of CARD_ART) {
    const resourcePath = "data/cards/" + slug + ".tres";
    const resource = await readFile(path.join(game, resourcePath), "utf8").catch(() => {
      throw new Error("缺少卡片資源：" + resourcePath);
    });
    const artId = resource.match(/^art\s*=\s*ExtResource\("([^"]+)"\)/m)?.[1];
    const artResource = [...resource.matchAll(/^\[ext_resource ([^\r\n]+)\]$/gm)]
      .map(([, properties]) => Object.fromEntries([...properties.matchAll(/(\w+)="([^"]*)"/g)]
        .map(([, key, value]) => [key, value])))
      .find((entry) => entry.id === artId && entry.type === "Texture2D");
    if (!artResource?.path?.startsWith("res://")) {
      throw new Error("卡片 art 沒有指向可匯入的 Texture2D：" + resourcePath);
    }
    const source = artResource.path.slice("res://".length);
    inputs.push({ kind: "cards", slug, source, resource: resourcePath, sourceVersion, buffer: await gameImage(source) });
  }
  for (const screenshot of cardsOnly ? [] : SCREENSHOTS) {
    if (menuPath && screenshot.slug === "main-menu") continue;
    if (cavernsPath && screenshot.slug === "arena-caverns") continue;
    inputs.push({ kind: "screens", ...screenshot, buffer: await gameImage(screenshot.source) });
  }
  if (menuPath) {
    inputs.push({
      kind: "screens", slug: "main-menu", sourceVersion,
      source: path.relative(path.dirname(game), menuPath).replaceAll(path.sep, "/"),
      sourceRoot: "release-package",
      note: "Windows 解壓包實際啟動畫面，包含視窗標題列；已目視確認 R3 品牌、新玩家抽卡與組牌入口。",
      buffer: await readFile(menuPath).catch(() => { throw new Error("缺少指定的主選單截圖：" + menuPath); }),
    });
  }
  if (cavernsPath) {
    inputs.push({
      kind: "screens", slug: "arena-caverns", sourceVersion,
      source: path.relative(path.dirname(game), cavernsPath).replaceAll(path.sep, "/"),
      sourceRoot: "release-package",
      note: "Windows R3 解壓包以合法自組牌組進入單人，AI 行動後回到我方第三回合的四路洞窟實際畫面；含視窗標題列。",
      buffer: await readFile(cavernsPath).catch(() => { throw new Error("缺少指定的洞窟截圖：" + cavernsPath); }),
    });
  }

  // 先確認所有來源與壓縮都成功，再覆寫既有網站素材。
  const outputs = [];
  for (const { buffer, ...input } of inputs) {
    const output = await sharp(buffer)
      .resize({ width: input.kind === "cards" ? 720 : 1600, withoutEnlargement: true })
      .webp({ quality: input.kind === "cards" ? 82 : 86 })
      .toBuffer({ resolveWithObject: true });
    outputs.push({
      ...input, data: output.data, sourceSha256: sha256(buffer),
      width: output.info.width, height: output.info.height,
      output: "/media/" + input.kind + "/" + input.slug + ".webp",
    });
  }

  // town.webp 是網站既有的無 UI 主選單背景，原始擷取來源未隨專案保存。
  // 保留它並明列限制，不以不同內容的主選單畫面覆寫。
  const townPath = path.join(OUT, "screens/town.webp");
  const town = await readFile(townPath).catch(() => {
    throw new Error("缺少網站既有背景：" + townPath +
      "。此背景原始來源未保存，請先還原網站素材。");
  });
  const townMetadata = await sharp(town).metadata();
  const preserved = [];
  if (cardsOnly) {
    const previous = JSON.parse(await readFile(path.join(OUT, "import-manifest.json"), "utf8"));
    for (const entry of previous) {
      if (!entry.output.startsWith("/media/screens/") || entry.output === "/media/screens/town.webp" ||
          outputs.some((output) => output.output === entry.output)) continue;
      const retained = await readFile(path.join(SITE, "public", entry.output));
      if (sha256(retained) !== entry.outputSha256) throw new Error("保留截圖與來源清單不符：" + entry.output);
      preserved.push(entry);
    }
  }

  await mkdir(path.join(OUT, "cards"), { recursive: true });
  await mkdir(path.join(OUT, "screens"), { recursive: true });
  for (const output of outputs) {
    await writeFile(path.join(OUT, output.kind, output.slug + ".webp"), output.data);
    console.log((output.kind === "cards" ? "card" : "shot") + " -> " +
      output.output + " (" + output.width + "x" + output.height + ")");
  }
  const manifest = outputs.map(({ data, ...entry }) => ({
    ...entry, outputSha256: sha256(data),
  }));
  manifest.push(...preserved);
  manifest.push({
    output: "/media/screens/town.webp", outputSha256: sha256(town),
    width: townMetadata.width, height: townMetadata.height,
    retained: true,
    note: "保留網站既有無 UI 主選單背景；原始擷取來源未保存，未宣稱重新匯入。",
  });
  await writeFile(path.join(OUT, "import-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log("完成：" + outputs.length +
    " 張匯入，" + (preserved.length + 1) + " 張既有截圖／背景保留；來源與限制見 public/media/import-manifest.json。");
}

main().catch((error) => {
  console.error("素材匯入失敗：" + error.message);
  process.exitCode = 1;
});
