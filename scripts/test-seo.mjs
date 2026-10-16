import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const base = process.argv[2] ?? "http://localhost:3100";
const origin = new URL(process.env.SITE_URL ?? "https://twilight-codex.vercel.app").origin;
let checks = 0;
const check = (ok, label) => { assert.ok(ok, label); checks++; console.log("PASS", label); };
const meta = (html, key) => [...html.matchAll(/<meta\s[^>]*>/g)].map(m => m[0])
  .find(tag => tag.includes(`name="${key}"`) || tag.includes(`property="${key}"`))?.match(/content="([^"]*)"/)?.[1];
const canonical = html => html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1];
const paths = ["/", "/guide", "/news", "/credits", "/install/android"];
let home;
for (const path of paths) {
  const r = await fetch(base + path); const html = await r.text();
  check(r.status === 200, `${path} is a working public page`);
  // Next normalizes the root trailing slash; both spellings are the same URL.
  check(canonical(html) && new URL(canonical(html)).href === new URL(path, origin).href, `${path} declares its own production canonical URL`);
  check(meta(html, "og:url") && new URL(meta(html, "og:url")).href === new URL(canonical(html)).href, `${path} share URL matches canonical`);
  check(meta(html, "description")?.length > 15 && meta(html, "og:description") === meta(html, "description") && meta(html, "twitter:description") === meta(html, "description"), `${path} has consistent page-specific search and share descriptions`);
  check(!/noindex/.test(meta(html, "robots") ?? "") && !/noindex/.test(r.headers.get("x-robots-tag") ?? ""), `${path} allows production indexing`);
  check((html.match(/<h1\b/g) ?? []).length === 1, `${path} has one main heading`);
  if (path === "/") home = html;
  if (path === "/guide") check(meta(html, "og:title").includes("新手指南"), "Subpage shares do not inherit the homepage title");
  if (path === "/install/android") check(!/href="[^"]*\.apk(?:\?|"|&)/i.test(html) && meta(html, "description").includes("暫停"), "Android SEO and page preserve the release gate");
}
const structured = [...home.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
check(structured.length === 1, "Homepage has one parseable structured data graph");
const website = structured[0]["@graph"].find(n => n["@type"] === "WebSite");
const game = structured[0]["@graph"].find(n => n["@type"] === "VideoGame");
check(website.name === "王牌戰線 Deckmarch" && website.url === `${origin}/` && website.alternateName.includes("Deckmarch"), "Website identity matches the current brand and URL");
check(game.gamePlatform.length > 0 && !game.gamePlatform.includes("Android") && !game.aggregateRating && !game.offers, "Game markup avoids unavailable platforms and invented ratings/offers");
const fontsOutsideNoscript = home.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
check(!/<link\b[^>]*href="https:\/\/fonts\.googleapis\.com\/css/.test(fontsOutsideNoscript), "Chinese font CSS cannot block initial HTML rendering");
const robots = await fetch(base + "/robots.txt"); const rules = await robots.text();
check(robots.ok && rules.includes(`Sitemap: ${origin}/sitemap.xml`) && rules.includes("Disallow: /api/"), "robots.txt publishes the sitemap and avoids crawling API routes");
check(!/Disallow: \/admin/.test(rules), "Admin remains crawlable so its noindex can be honored");
const sitemap = await fetch(base + "/sitemap.xml"); const xml = await sitemap.text();
check(sitemap.ok && /xml/.test(sitemap.headers.get("content-type")), "Sitemap returns XML, not a 404 page");
check(JSON.stringify([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).sort()) === JSON.stringify(paths.map(p => new URL(p, origin).href).sort()), "Sitemap lists only canonical public pages, never admin or APIs");
const admin = await fetch(base + "/admin");
check(/noindex/.test(meta(await admin.text(), "robots") ?? ""), "Admin remains excluded from indexing");

// Preview noindex is a response header, independent of inherited page metadata.
const code = ts.transpileModule(await readFile(new URL("../next.config.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
for (const environment of ["preview", "production"]) {
  const exports = {};
  new Function("exports", "process", code)(exports, { env: { VERCEL_ENV: environment } });
  const headers = (await exports.default.headers())[0].headers;
  check(headers.some(h => h.key === "X-Robots-Tag" && h.value.includes("noindex")) === (environment === "preview"), `${environment} indexing header is correct`);
}
console.log(`SEO: ${checks} checks PASS (${base})`);
