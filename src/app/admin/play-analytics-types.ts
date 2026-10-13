export type ModeCounters = { started: number; wins: number; losses: number; draws: number; abandoned: number };
export type GuestStats = { version: string; platform: string; state: string; launches: number; play_seconds: number;
  modes: Record<string, ModeCounters> };
export type GuestList = { page: number; total: number; players: { install_id: string; first_seen: string;
  last_seen: string; online: boolean; stats: GuestStats }[] };
export type PlayerRates = { page: number; players: { id: string; email: string; wins: number; losses: number;
  draws: number; total: number; win_rate: number | null; loss_rate: number | null; verified_match_online: boolean }[] };
export type PlayDashboard = {
  generated_at: string; days: number;
  counts: { registered: number; collection_users: number; admitted_users: number; completed_users: number;
    guest_installs: number; guest_played: number; guest_online: number; formal_matches: number; guest_play_seconds: number };
  daily: { day: string; registered: number; guest_installs: number; guest_active: number; matches: number }[];
  guest_modes: (ModeCounters & { mode: string })[];
  formal_outcomes: { defeat: number; disconnect: number; draws: number };
  servers: { server_id: string; received_at: string; fresh: boolean; verified_accounts: number;
    presence: { online_players: number; lobby_players: number; playing_players: number; public_rooms: number; matches: number; protocol: number } }[];
  online_samples: { minute: string; online_connections: number; lobby_connections: number; playing_connections: number }[];
};

// Treat a missing/expired heartbeat as unknown. Never turn lack of data into zero players.
export function livePresence(data: PlayDashboard, now = Date.now()) {
  if (!data.servers.length || data.servers.some(s => !s.fresh || now - Date.parse(s.received_at) >= 45000)) return null;
  return data.servers.reduce((sum, s) => ({ online: sum.online + s.presence.online_players,
    lobby: sum.lobby + s.presence.lobby_players, playing: sum.playing + s.presence.playing_players }),
    { online: 0, lobby: 0, playing: 0 });
}

// Separate missing minutes (no heartbeat) from an actual zero-player measurement.
export function sampleSegments(samples: PlayDashboard["online_samples"]) {
  const segments: PlayDashboard["online_samples"][] = [];
  for (const sample of samples) {
    const last = segments.at(-1)?.at(-1);
    if (!last || Date.parse(sample.minute) - Date.parse(last.minute) > 90000) segments.push([]);
    segments.at(-1)!.push(sample);
  }
  return segments;
}
