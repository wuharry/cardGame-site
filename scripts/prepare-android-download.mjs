import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { lstat, mkdir, rename, unlink } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadTsModule } from "./lib/load-ts-module.mjs";

const releases = await loadTsModule(new URL("../src/data/releases.ts", import.meta.url));
const repoRoot = fileURLToPath(new URL("../", import.meta.url));

async function checkExisting(file, build) {
  let stat;
  try { stat = await lstat(file); } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
  if (!stat.isFile() || stat.size !== build.bytes) throw new Error("Existing APK has an invalid type or size");
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  if (hash.digest("hex") !== build.sha256) throw new Error("Existing APK failed SHA-256 verification");
  return true;
}

/** Only build-time copies enter public/. Player requests use the static host, never a Function proxy. */
export async function prepareAndroidDownload({
  root = repoRoot, builds = releases.BUILDS, fetchImpl = fetch, sourceFile,
} = {}) {
  const results = [];
  const selected = builds.filter((build) => build.status === "available" && build.websiteDelivery === "static-apk");
  if (sourceFile && selected.length !== 1) throw new Error("A local APK requires exactly one active static download");
  for (const build of selected) {
    const route = releases.staticApkPath(build);
    if (!route) throw new Error("Static APK metadata did not produce a download path");
    const source = releases.downloadUrl(build);
    if (!source || !/^https:\/\/github\.com\/wuharry\/twilight-codex-downloads\/releases\/download\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.apk$/.test(source)) {
      throw new Error("Static APK source must be the official versioned GitHub release");
    }
    const ownedRoot = resolve(root, "public", "downloads", "android");
    const destination = resolve(root, "public", route.slice(1));
    if (!destination.startsWith(ownedRoot + sep)) throw new Error("Static APK path escaped the download directory");
    // Do not follow a local symlink into a different output directory.
    for (const directory of [resolve(root, "public"), dirname(ownedRoot), ownedRoot, dirname(destination)]) {
      await mkdir(directory, { recursive: true });
      if ((await lstat(directory)).isSymbolicLink()) throw new Error("Static APK output cannot use a symlink");
    }
    if (await checkExisting(destination, build)) {
      results.push({ path: route, bytes: build.bytes, sha256: build.sha256, reused: true });
      continue;
    }

    const temporary = `${destination}.part-${randomUUID()}`;
    let received = 0;
    const hash = createHash("sha256");
    const verify = new Transform({ transform(chunk, encoding, callback) {
      received += chunk.length;
      if (received > build.bytes) return callback(new Error("APK exceeded its pinned size"));
      hash.update(chunk);
      callback(null, chunk);
    } });
    try {
      let input;
      if (sourceFile) {
        const stat = await lstat(sourceFile);
        if (!stat.isFile() || stat.size !== build.bytes) throw new Error("Local APK has an invalid type or size");
        input = createReadStream(sourceFile);
      } else {
        const response = await fetchImpl(source, { signal: AbortSignal.timeout(180_000) });
        try {
          if (response.status !== 200 || !response.body) throw new Error(`APK download returned HTTP ${response.status}`);
          if (response.url) {
            const finalUrl = new URL(response.url);
            if (finalUrl.protocol !== "https:" || !["github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(finalUrl.hostname)) {
              throw new Error("APK redirect left the official HTTPS release hosts");
            }
          }
          const length = response.headers.get("content-length");
          if (length !== null && length !== String(build.bytes)) throw new Error("APK Content-Length did not match the pinned size");
        } catch (error) {
          await response.body?.cancel();
          throw error;
        }
        input = Readable.fromWeb(response.body);
      }
      await pipeline(input, verify, createWriteStream(temporary, { flags: "wx" }));
      if (received !== build.bytes || hash.digest("hex") !== build.sha256) throw new Error("APK size or SHA-256 verification failed");
      await rename(temporary, destination);
      results.push({ path: route, bytes: received, sha256: build.sha256, reused: false });
    } finally {
      await unlink(temporary).catch((error) => { if (error.code !== "ENOENT") throw error; });
    }
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--from-file")) {
    throw new Error("Usage: node scripts/prepare-android-download.mjs [--from-file /path/to/published.apk]");
  }
  const results = await prepareAndroidDownload({ sourceFile: args[1] });
  for (const result of results) console.log(`Verified static APK: ${result.path} (${result.bytes} bytes${result.reused ? ", reused" : ""})`);
}
