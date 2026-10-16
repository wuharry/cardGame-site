import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);

/**
 * 把網站的 TypeScript 模組編成 CommonJS 後直接執行，測試不必經過 Next 打包。
 * `imports` 依模組路徑替換相依；未列出的相依預設拋錯，避免測試意外載入真實模組。
 *
 * @param {URL} file
 * @param {Record<string, unknown>} [imports]
 * @param {{ allowNodeModules?: boolean }} [options] 允許其餘相依從 node_modules 載入。
 */
export async function loadTsModule(file, imports = {}, { allowNodeModules = false } = {}) {
  const { outputText } = ts.transpileModule(await readFile(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  new Function("require", "exports", outputText)((name) => {
    if (name in imports) return imports[name];
    // JSX 編譯結果自帶的 runtime，不是被測模組的相依。
    if (allowNodeModules || name === "react/jsx-runtime") return require(name);
    throw new Error(`Unexpected import: ${name}`);
  }, exports);
  return exports;
}
