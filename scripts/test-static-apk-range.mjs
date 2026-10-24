import { strict as assert } from "node:assert";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const releases = await loadTsModule(new URL("../src/data/releases.ts", import.meta.url));
const build = releases.BUILDS.find((item) => item.id === "android");
const path = releases.staticApkPath(build);
const { proxy, config } = await loadTsModule(new URL("../src/proxy.ts", import.meta.url), {
  "./data/releases": releases,
  "next/server": { NextResponse: { next: (init) => ({ passThrough: true, ...init }) } },
});
const request = (range, changes = {}) => ({ nextUrl: { pathname: path }, method: "GET", headers: new Headers({ range }), ...changes });
for (const range of [`bytes=${build.bytes}-`, `bytes=${build.bytes + 10}-`, "bytes=9-8", "bytes=-0", "bytes=999999999999999999999999999-"]) {
  const response = proxy(request(range));
  assert.equal(response.status, 416);
  assert.equal(response.headers.get("content-range"), `bytes */${build.bytes}`);
  assert.equal(response.headers.get("cache-control"), "no-store");
}
for (const [range, expected] of [["bytes=0-99", "bytes=0-99"], ["bytes=-1024", `bytes=${build.bytes - 1024}-${build.bytes - 1}`],
  ["bytes=1-999999999999999999999", `bytes=1-${build.bytes - 1}`]]) {
  assert.equal(proxy(request(range)).request.headers.get("range"), expected);
}
for (const range of ["bytes=", "not-a-range", "bytes=0-1,3-4"]) {
  assert.equal(proxy(request(range)).request.headers.get("range"), null);
}
const stale = request("bytes=0-1", { headers: new Headers({ range: "bytes=0-1", "if-range": '"old-version"' }) });
assert.deepEqual(proxy(stale), { passThrough: true }, "The static host owns If-Range validation; a proxy cannot infer it from the APK hash");
stale.headers.set("if-range", '"opaque-host-validator"');
assert.deepEqual(proxy(stale), { passThrough: true });
assert.equal(stale.headers.get("range"), "bytes=0-1", "Delegation preserves the original conditional range");
stale.headers.set("if-range", 'W/"opaque-host-validator"');
assert.equal(proxy(stale).request.headers.get("range"), null, "Weak validators cannot be used to resume partial content");
assert.equal(proxy(request("bytes=0-1", { method: "HEAD" })).request.headers.get("range"), null);
assert.equal(proxy(request("bytes=0-1", { nextUrl: { pathname: "/api/game-version" } })).passThrough, true);
assert.deepEqual(config.matcher, [{ source: "/downloads/android/:path*", has: [{ type: "header", key: "range" }] }]);
console.log("PASS APK range gate: EOF/overflow/reversed/suffix ranges, invalid and multiple ranges, If-Range identity, HEAD and limited matching");
