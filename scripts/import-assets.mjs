// 從指定的 Godot 專案匯入真實素材；不下載 LFS，也不改動遊戲資源。
// 用法：node scripts/import-assets.mjs <game-path> [--cards-only] [--screens-dir <capture-directory>]
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

// New captures are explicit; an ordinary card sync must never restore legacy screenshots.
const SCREEN_SLUGS = ["hero-battlefield", "arena-forest", "arena-caverns", "arena-frostlands", "main-menu", "town"];

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
  let screensDirectory;
  for (let index = 1; index < args.length; index++) {
    if (args[index] === "--cards-only") cardsOnly = true;
    else if (args[index] === "--menu" && args[index + 1] && !args[index + 1].startsWith("--")) {
      menuPath = path.resolve(args[++index]);
    } else if (args[index] === "--caverns" && args[index + 1] && !args[index + 1].startsWith("--")) {
      cavernsPath = path.resolve(args[++index]);
    } else if (args[index] === "--screens-dir" && args[index + 1] && !args[index + 1].startsWith("--")) {
      screensDirectory = path.resolve(args[++index]);
    } else throw new Error("未知或不完整的參數：" + args[index]);
  }
  if (!(await stat(path.join(game, "project.godot")).catch(() => null))?.isFile()) {
    throw new Error("找不到 project.godot，請確認遊戲來源路徑：" + game);
  }
  const project = await readFile(path.join(game, "project.godot"), "utf8");
  const release = await readFile(path.join(game, "src/release/release_info.gd"), "utf8").catch(() => "");
  const sourceVersion = release.match(/^const VERSION := "([^"]+)"/m)?.[1]
    ?? project.match(/^config\/version="([^"]+)"/m)?.[1] ?? "未標記版本";
  if (screensDirectory && (cardsOnly || menuPath || cavernsPath)) {
    throw new Error("--screens-dir 不可與 --cards-only、--menu 或 --caverns 同時使用");
  }

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
  if (screensDirectory) {
    const capture = JSON.parse(await readFile(path.join(screensDirectory, "capture-manifest.json"), "utf8"));
    if (capture.sourceVersion !== sourceVersion || !/^[a-f0-9]{8,40}$/.test(capture.sourceCommit)
        || !/^\d{4}-\d{2}-\d{2}$/.test(capture.capturedOn)
        || capture.captures.length !== SCREEN_SLUGS.length) {
      throw new Error("擷取清單的版本、來源 commit、日期或圖片數不符");
    }
    for (const slug of SCREEN_SLUGS) {
      const matches = capture.captures.filter((item) => item.slug === slug);
      if (matches.length !== 1 || matches[0].source !== slug + ".png") {
        throw new Error("擷取清單缺少、重複或使用非預期的圖片路徑：" + slug);
      }
      const file = path.join(screensDirectory, matches[0].source);
      inputs.push({
        kind: "screens", slug, source: path.relative(game, file).replaceAll(path.sep, "/"),
        sourceRoot: "game-source", sourceVersion, sourceCommit: capture.sourceCommit,
        capturedOn: capture.capturedOn, renderer: capture.renderer, platform: capture.platform,
        note: matches[0].note, buffer: await readFile(file),
      });
    }
  }
  if (menuPath) {
    inputs.push({
      kind: "screens", slug: "main-menu", sourceVersion,
      source: path.relative(path.dirname(game), menuPath).replaceAll(path.sep, "/"),
      sourceRoot: "release-package",
      note: "指定的原生主選單畫面；來源平台與封裝驗收範圍需由提供者另行確認。",
      buffer: await readFile(menuPath).catch(() => { throw new Error("缺少指定的主選單截圖：" + menuPath); }),
    });
  }
  if (cavernsPath) {
    inputs.push({
      kind: "screens", slug: "arena-caverns", sourceVersion,
      source: path.relative(path.dirname(game), cavernsPath).replaceAll(path.sep, "/"),
      sourceRoot: "release-package",
      note: "指定的原生洞窟畫面；來源平台與封裝驗收範圍需由提供者另行確認。",
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

  // Existing screens are retained unless a new explicit capture replaces that exact output.
  const townPath = path.join(OUT, "screens/town.webp");
  const town = await readFile(townPath).catch(() => {
    throw new Error("缺少網站既有背景：" + townPath +
      "。此背景原始來源未保存，請先還原網站素材。");
  });
  const townMetadata = await sharp(town).metadata();
  const preserved = [];
  const previous = JSON.parse(await readFile(path.join(OUT, "import-manifest.json"), "utf8"));
  const previousTown = previous.find((entry) => entry.output === "/media/screens/town.webp");
  if (previousTown && previousTown.outputSha256 !== sha256(town)) {
    throw new Error("保留背景與來源清單不符：/media/screens/town.webp");
  }
  for (const entry of previous) {
    if (!entry.output.startsWith("/media/screens/") || entry.output === "/media/screens/town.webp" ||
        outputs.some((output) => output.output === entry.output)) continue;
    const retained = await readFile(path.join(SITE, "public", entry.output));
    if (sha256(retained) !== entry.outputSha256) throw new Error("保留截圖與來源清單不符：" + entry.output);
    preserved.push(entry);
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
  const retainedTown = !outputs.some((output) => output.output === "/media/screens/town.webp");
  if (retainedTown) manifest.push(previousTown ?? {
    output: "/media/screens/town.webp", outputSha256: sha256(town),
    width: townMetadata.width, height: townMetadata.height,
    retained: true,
    note: "保留網站既有無 UI 主選單背景；原始擷取來源未保存，未宣稱重新匯入。",
  });
  await writeFile(path.join(OUT, "import-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log("完成：" + outputs.length +
    " 張匯入，" + (preserved.length + Number(retainedTown)) + " 張既有截圖／背景保留；來源與限制見 public/media/import-manifest.json。");
}

main().catch((error) => {
  console.error("素材匯入失敗：" + error.message);
  process.exitCode = 1;
});
