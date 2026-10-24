import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { prepareAndroidDownload } from "./prepare-android-download.mjs";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const releases = await loadTsModule(new URL("../src/data/releases.ts", import.meta.url));
const versions = await loadTsModule(new URL("../src/data/game-version.ts", import.meta.url), { "./releases": releases });
const game = await loadTsModule(new URL("../src/data/game.ts", import.meta.url));
const help = await loadTsModule(new URL("../src/data/install-help.ts", import.meta.url));
const body = Buffer.from("Synthetic APK transport fixture; not an installable APK.");
const build = { ...releases.BUILDS.find((item) => item.id === "android"), file: "Android-fixture.apk",
  bytes: body.length, sha256: createHash("sha256").update(body).digest("hex") };
const route = releases.staticApkPath(build);
assert.match(route, /^\/downloads\/android\/[a-f0-9]{64}\/Android-fixture\.apk$/);
assert.equal(releases.websiteDownloadUrl(build), route);
assert.equal(releases.websiteDownloadUrl({ ...build, websiteDelivery: undefined }), releases.downloadUrl(build));
for (const status of ["planned", "preparing", "suspended"]) {
  assert.equal(releases.staticApkPath({ ...build, status }), null);
  assert.equal(releases.websiteDownloadUrl({ ...build, status }), null);
}
for (const changes of [{ file: "../escape.apk" }, { file: 'unsafe".apk' }, { sha256: "invalid" }, { bytes: 100_000_001 }, { id: "windows" }]) {
  assert.throws(() => releases.staticApkPath({ ...build, ...changes }), /Invalid static APK metadata/);
}
assert.deepEqual(versions.versionManifest([build]), versions.versionManifest([{ ...build, websiteDelivery: undefined }]));
assert.equal(versions.versionManifest([build]).platforms.android.download_url, releases.downloadUrl(build));

const link = { __esModule: true, default: (props) => createElement("a", props) };
const data = { ...releases, BUILDS: [build] };
const panel = await loadTsModule(new URL("../src/components/download-panel.tsx", import.meta.url), {
  "@/data/releases": data, "@/data/game": game, "@/data/install-help": help, "next/link": link,
});
const guide = await loadTsModule(new URL("../src/app/install/android/page.tsx", import.meta.url), {
  "@/data/releases": data, "@/data/seo": { pageMetadata: () => ({}) }, "next/link": link,
});
for (const html of [renderToStaticMarkup(createElement(panel.DownloadPanel)), renderToStaticMarkup(createElement(guide.default))]) {
  assert.ok(html.includes(`href="${route}" download="${build.file}"`), "Both primary download buttons use the static APK");
  assert.ok(html.includes(`href="${releases.downloadUrl(build)}"`) && html.includes("GitHub 備用下載（同一份 APK）"));
  assert.ok(html.indexOf(`href="${route}"`) < html.indexOf(`href="${releases.downloadUrl(build)}"`));
}
const config = (await loadTsModule(new URL("../next.config.ts", import.meta.url), { "./src/data/releases": data })).default;
const headers = (await config.headers()).find((entry) => entry.source === route).headers;
assert.ok(headers.some((header) => header.key === "Content-Type" && header.value === "application/vnd.android.package-archive"));
assert.ok(headers.some((header) => header.key === "Content-Disposition" && header.value === `attachment; filename="${build.file}"`));
assert.ok(!headers.some((header) => header.key === "Content-Length"), "The static host, not a guessed header, owns response framing");

const root = await mkdtemp(join(tmpdir(), "deckmarch-static-apk-"));
let cases = 0;
async function scenario(name, work) {
  const directory = join(root, name);
  await work(directory);
  cases++;
}
const response = (bytes = body, headers = { "content-length": String(body.length) }) => new Response(bytes, { status: 200, headers });
try {
  await scenario("valid-and-cache", async (root) => {
    let fetched = 0;
    const fetchImpl = async (url) => { fetched++; assert.equal(url, releases.downloadUrl(build)); return response(); };
    const first = await prepareAndroidDownload({ root, builds: [build], fetchImpl });
    assert.equal(first[0].reused, false);
    assert.deepEqual(await readFile(join(root, "public", route)), body);
    assert.equal((await prepareAndroidDownload({ root, builds: [build], fetchImpl }))[0].reused, true);
    assert.equal(fetched, 1, "A rehashed correct cache avoids another network request");
    await writeFile(join(root, "public", route), Buffer.alloc(body.length));
    await assert.rejects(prepareAndroidDownload({ root, builds: [build], fetchImpl }), /Existing APK failed SHA-256/);
  });
  for (const [name, fetchImpl, error] of [
    ["bad-hash", async () => response(Buffer.alloc(body.length)), /SHA-256/],
    ["truncated", async () => response(body.subarray(0, -1), {}), /size or SHA-256/],
    ["overflow", async () => response(Buffer.concat([body, body]), {}), /exceeded/],
    ["wrong-length", async () => response(body, { "content-length": "1" }), /Content-Length/],
    ["http-error", async () => new Response("missing", { status: 404 }), /HTTP 404/],
    ["broken-stream", async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(body.subarray(0, 3)); controller.error(new Error("interrupted")); } })), /interrupted/],
    ["untrusted-redirect", async () => Object.defineProperty(response(), "url", { value: "https://example.invalid/fixture.apk" }), /official HTTPS release hosts/],
    ["insecure-redirect", async () => Object.defineProperty(response(), "url", { value: "http://release-assets.githubusercontent.com/fixture.apk" }), /official HTTPS release hosts/],
  ]) {
    await scenario(name, async (root) => {
      await assert.rejects(prepareAndroidDownload({ root, builds: [build], fetchImpl }), error);
      assert.deepEqual(await readdir(dirname(join(root, "public", route))), [], "Rejected download leaves neither an APK nor a partial file");
    });
  }
  await scenario("local-source", async (root) => {
    const sourceFile = join(root, "..", "fixture.apk");
    await writeFile(sourceFile, body);
    const result = await prepareAndroidDownload({ root, builds: [build], sourceFile, fetchImpl: () => { throw new Error("No network expected"); } });
    assert.equal(result[0].sha256, build.sha256);
    assert.deepEqual(await readFile(join(root, "public", route)), body);
  });
  await scenario("disabled", async (root) => {
    assert.deepEqual(await prepareAndroidDownload({ root, builds: [{ ...build, status: "suspended" }], fetchImpl: () => { throw new Error("No network expected"); } }), []);
  });
  await scenario("untrusted-source", async (root) => {
    await assert.rejects(prepareAndroidDownload({ root, builds: [{ ...build, releaseBase: "https://example.invalid/release" }] }), /official versioned GitHub/);
  });
} finally {
  assert.ok(root.startsWith(join(tmpdir(), "deckmarch-static-apk-")));
  await rm(root, { recursive: true, force: true });
}
console.log(`PASS static APK: ${cases} transfer scenarios; hash/size gates, partial cleanup, revalidated cache, local source, primary/fallback UI, headers and unchanged update API`);
