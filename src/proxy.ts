import { NextResponse, type NextRequest } from "next/server";
import { BUILDS, staticApkPath } from "./data/releases";

/** Validate only Range metadata; the static host still sends every APK byte. */
export function proxy(request: NextRequest) {
  const build = BUILDS.find((item) => staticApkPath(item) === request.nextUrl.pathname);
  if (!build?.bytes) return NextResponse.next();
  const headers = new Headers(request.headers);
  const fullResponse = () => {
    headers.delete("range");
    return NextResponse.next({ request: { headers } });
  };
  const ifRange = headers.get("if-range");
  if (request.method !== "GET" || (ifRange !== null && ifRange !== `"${build.sha256}"`)) return fullResponse();
  const range = /^bytes=(\d*)-(\d*)$/.exec(headers.get("range") ?? "");
  // A server may ignore malformed or multiple ranges and send the full representation.
  if (!range || (!range[1] && !range[2])) return fullResponse();
  const size = build.bytes;
  const suffix = range[1] ? 0 : Number(range[2]);
  const start = range[1] ? Number(range[1]) : Math.max(0, size - suffix);
  const end = range[1] && range[2] ? Number(range[2]) : size - 1;
  if (start >= size || end < start || (!range[1] && suffix === 0)) {
    // Next 16.4.2's local static server renders an internal 500 for these ranges.
    return new Response(null, { status: 416, headers: {
      "Content-Range": `bytes */${build.bytes}`, "Content-Length": "0", "Cache-Control": "no-store",
    } });
  }
  headers.set("range", `bytes=${start}-${Math.min(end, size - 1)}`);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [{ source: "/downloads/android/:path*", has: [{ type: "header", key: "range" }] }],
};
