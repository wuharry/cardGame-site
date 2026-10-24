import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const releases = await loadTsModule(new URL("../src/data/releases.ts", import.meta.url));
const versions = await loadTsModule(new URL("../src/data/game-version.ts", import.meta.url), { "./releases": releases });
const base = new URL(process.argv[2] ?? "http://127.0.0.1:3118");
assert.ok(base.protocol === "https:" || (base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname)));
assert.ok(!base.username && !base.password && !base.search && !base.hash && base.pathname === "/");
const build = releases.BUILDS.find((item) => releases.staticApkPath(item));
assert.ok(build, "No static APK is enabled");
const path = releases.staticApkPath(build);
const url = new URL(path, base);
const request = (href, options = {}) => fetch(href, { ...options, redirect: "error", signal: AbortSignal.timeout(180_000) });
const report = { base: base.origin, apk: path, expected_bytes: build.bytes, expected_sha256: build.sha256, checks: [] };
const check = (name) => report.checks.push({ name, status: "PASS" });

for (const page of ["/", "/install/android"]) {
  const response = await request(new URL(page, base));
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes(`href="${path}" download="${build.file}"`));
  assert.ok(html.includes(`href="${releases.downloadUrl(build)}"`) && html.includes("GitHub 備用下載"));
  assert.ok(html.indexOf(`href="${path}"`) < html.indexOf(`href="${releases.downloadUrl(build)}"`));
  check(`${page} primary static APK and same-file fallback`);
}
const update = await request(new URL("/api/game-version", base));
assert.equal(update.status, 200);
assert.equal(update.headers.get("cache-control"), "no-store");
assert.deepEqual(await update.json(), versions.versionManifest());
check("canonical update API identity and no-store");

const head = await request(url, { method: "HEAD" });
assert.equal(head.status, 200);
assert.equal(head.headers.get("content-type"), "application/vnd.android.package-archive");
assert.equal(head.headers.get("content-length"), String(build.bytes));
assert.ok(head.headers.get("content-disposition")?.includes(`filename="${build.file}"`));
assert.ok(!head.headers.get("content-encoding"), "APK must not be transformed or compressed in transit");
report.headers = Object.fromEntries(["content-type", "content-length", "content-disposition", "cache-control", "accept-ranges", "etag"].map((name) => [name, head.headers.get(name)]));
assert.match(head.headers.get("etag") ?? "", /^(W\/)?"[^"\r\n]+"$/, "ETag is an opaque cache validator, not the APK's SHA-256");
check("HEAD, exact length, APK type, attachment filename and no redirects");

const start = performance.now();
const full = await request(url);
assert.equal(full.status, 200);
const hash = createHash("sha256");
let bytes = 0;
for await (const chunk of full.body) { bytes += chunk.length; hash.update(chunk); }
const digest = hash.digest("hex");
assert.equal(bytes, build.bytes);
assert.equal(digest, build.sha256);
report.full_download = { bytes, sha256: digest, seconds: (performance.now() - start) / 1000, eof_received: true };
check("complete APK response, EOF, size and SHA-256");

const tailStart = build.bytes - 1024;
const tail = await request(url, { headers: { Range: `bytes=${tailStart}-` } });
assert.equal(tail.status, 206);
assert.equal(tail.headers.get("content-range"), `bytes ${tailStart}-${build.bytes - 1}/${build.bytes}`);
assert.equal(tail.headers.get("content-length"), "1024");
assert.equal((await tail.arrayBuffer()).byteLength, 1024);
check("resumed final range has exact bytes and closes");

const invalid = await request(url, { headers: { Range: `bytes=${build.bytes + 10}-` } });
assert.equal(invalid.status, 416);
assert.equal(invalid.headers.get("content-range"), `bytes */${build.bytes}`);
assert.equal(invalid.headers.get("cache-control"), "no-store");
await invalid.arrayBuffer();
check("out-of-bounds range returns 416");
if (head.headers.has("etag")) {
  // Fetch's default conditional mode adds Cache-Control: no-cache, forcing a 200.
  // Explicit revalidation permits a 304 for an unchanged representation.
  const unchanged = await request(url, { cache: "no-cache", headers: { "If-None-Match": head.headers.get("etag") } });
  assert.equal(unchanged.status, 304);
  await unchanged.arrayBuffer();
  check("unchanged cached file returns 304");
}
const matched = await request(url, { headers: { Range: "bytes=0-15", "If-Range": head.headers.get("etag") } });
if (head.headers.get("etag").startsWith("W/")) {
  assert.equal(matched.status, 200, "A weak If-Range validator cannot resume a partial file");
  assert.equal(matched.headers.get("content-length"), String(build.bytes));
  await matched.body.cancel();
  check("weak If-Range restarts the complete response");
} else {
  assert.equal(matched.status, 206);
  assert.equal((await matched.arrayBuffer()).byteLength, 16);
  check("matching strong If-Range resumes the pinned APK");
}
const stale = await request(url, { headers: { Range: "bytes=0-15", "If-Range": '"old-version"' } });
assert.equal(stale.status, 200);
assert.equal(stale.headers.get("content-length"), String(build.bytes));
await stale.body.cancel();
check("stale If-Range restarts a complete response instead of mixing files");
console.log(JSON.stringify(report, null, 2));
