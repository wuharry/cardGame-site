import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function load(file, imports = {}) {
  const source = ts.transpileModule(await readFile(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", source)((name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, exports);
  return exports;
}
const releases = await load("../src/data/releases.ts");
const versions = await load("../src/data/game-version.ts", { "./releases": releases });
const route = await load("../src/app/api/game-version/route.ts", { "@/data/game-version": versions });
const fixture = {
  id: "windows", status: "available", file: "TwilightCodex-Windows-20261014-R6.zip",
  version: "2026.10.14-R6", build: 2026101401, minimumBuild: 2026101401, protocol: 16,
  bytes: 100, sha256: "a".repeat(64), note: "新版本", noteEn: "New version",
};
const manifest = versions.versionManifest([fixture, { id: "linux", status: "planned", file: null }]);
assert.deepEqual(Object.keys(manifest.platforms), ["windows"]);
assert.equal(manifest.platforms.windows.download_url, releases.downloadUrl(fixture));
assert.equal(manifest.platforms.windows.build, fixture.build);
assert.equal(manifest.platforms.windows.notes.en, "New version");
assert.throws(() => versions.versionManifest([{ ...fixture, minimumBuild: fixture.build + 1 }]));
assert.throws(() => versions.versionManifest([{ ...fixture, sha256: "invalid" }]));
assert.equal(versions.versionManifest([{ ...fixture, status: "preparing" }]).platforms.windows, undefined);
assert.equal(versions.versionManifest([{ ...fixture, status: "suspended" }]).platforms.windows, undefined);
const response = route.GET();
assert.equal(response.status, 200);
assert.equal(response.headers.get("Cache-Control"), "no-store");
assert.deepEqual(await response.json(), versions.versionManifest());
assert.equal(versions.versionManifest().platforms.android, undefined, "Suspended Android is absent from live update downloads");
assert.deepEqual(Object.keys(versions.versionManifest().platforms).sort(), ["linux", "macos", "windows"]);
console.log("PASS game version manifest: published platform, exact download, minimum, invalid hashes, no-store endpoint");
