import { versionManifest } from "@/data/game-version";

export function GET() {
  return Response.json(versionManifest(), {
    headers: { "Cache-Control": "no-store" },
  });
}
