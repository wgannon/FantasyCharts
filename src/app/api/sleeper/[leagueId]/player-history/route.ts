import { NextRequest, NextResponse } from 'next/server';

interface SleeperUser {
  user_id: string;
  display_name: string;
  metadata?: { team_name?: string };
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  players: string[] | null;
  starters: string[] | null;
}

interface SleeperPlayerInfo {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string;
  status?: string;
}

interface SleeperWeekStats {
  pts_ppr?: number;
  pts_half_ppr?: number;
  pass_yd?: number;
  pass_td?: number;
  rush_yd?: number;
  rush_td?: number;
  rec_yd?: number;
  rec_td?: number;
  rec?: number;
  gp?: number;
}

interface StatTotals {
  gp: number;
  ptsPpr: number;
  passYd: number;
  passTd: number;
  rushYd: number;
  rushTd: number;
  recYd: number;
  recTd: number;
  rec: number;
}

interface PlayerStat {
  playerId: string;
  name: string;
  position: string;
  nflTeam: string;
  isStarter: boolean;
  prevYear: StatTotals;
}

interface TeamRoster {
  rosterId: number;
  ownerName: string;
  players: PlayerStat[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const searchParams = new URL(request.url).searchParams;
  const prevYear = parseInt(searchParams.get('prevYear') ?? '2023', 10);

  const base = 'https://api.sleeper.app/v1';

  // Fetch users, rosters, and players list in parallel
  let usersRes: Response;
  let rostersRes: Response;
  let playersRes: Response;

  try {
    [usersRes, rostersRes, playersRes] = await Promise.all([
      fetch(`${base}/league/${leagueId}/users`, { next: { revalidate: 300 } }),
      fetch(`${base}/league/${leagueId}/rosters`, { next: { revalidate: 300 } }),
      fetch(`${base}/players/nfl`, { next: { revalidate: 86400 } }),
    ]);
  } catch {
    return NextResponse.json({ error: 'Sleeper API unavailable' }, { status: 502 });
  }

  if (!usersRes.ok || !rostersRes.ok || !playersRes.ok) {
    return NextResponse.json({ error: 'Sleeper API unavailable' }, { status: 502 });
  }

  const [users, rosters, allPlayers]: [
    SleeperUser[],
    SleeperRoster[],
    Record<string, SleeperPlayerInfo>
  ] = await Promise.all([usersRes.json(), rostersRes.json(), playersRes.json()]);

  // Build a set of all player IDs across all rosters to limit memory on stat responses
  const allPlayerIds = new Set<string>();
  for (const roster of rosters) {
    for (const pid of roster.players ?? []) {
      allPlayerIds.add(pid);
    }
  }

  // Fetch all 17 weeks of previous year stats in parallel
  const weeks = Array.from({ length: 17 }, (_, i) => i + 1);
  let weekResponses: Response[];

  try {
    weekResponses = await Promise.all(
      weeks.map(w =>
        fetch(`${base}/stats/nfl/regular/${prevYear}/${w}`, { next: { revalidate: 3600 } })
      )
    );
  } catch {
    return NextResponse.json({ error: 'Sleeper API unavailable' }, { status: 502 });
  }

  // Parse only the player IDs we care about from each week's response
  const weeklyStats: Array<Record<string, SleeperWeekStats>> = await Promise.all(
    weekResponses.map(async res => {
      if (!res.ok) return {};
      const raw: Record<string, SleeperWeekStats> = await res.json();
      // Filter to only our roster players to avoid memory bloat
      const filtered: Record<string, SleeperWeekStats> = {};
      for (const pid of allPlayerIds) {
        if (raw[pid]) filtered[pid] = raw[pid];
      }
      return filtered;
    })
  );

  // Aggregate weekly stats into season totals per player
  const seasonTotals: Record<string, StatTotals> = {};

  for (const pid of allPlayerIds) {
    const totals: StatTotals = {
      gp: 0,
      ptsPpr: 0,
      passYd: 0,
      passTd: 0,
      rushYd: 0,
      rushTd: 0,
      recYd: 0,
      recTd: 0,
      rec: 0,
    };

    for (const weekData of weeklyStats) {
      const stats = weekData[pid];
      if (!stats) continue;

      // gp: count weeks where player has pts_ppr > 0
      if ((stats.pts_ppr ?? 0) > 0) totals.gp += 1;

      totals.ptsPpr += stats.pts_ppr ?? 0;
      totals.passYd += stats.pass_yd ?? 0;
      totals.passTd += stats.pass_td ?? 0;
      totals.rushYd += stats.rush_yd ?? 0;
      totals.rushTd += stats.rush_td ?? 0;
      totals.recYd += stats.rec_yd ?? 0;
      totals.recTd += stats.rec_td ?? 0;
      totals.rec += stats.rec ?? 0;
    }

    seasonTotals[pid] = totals;
  }

  // Build user name map
  const userNames: Record<string, string> = {};
  for (const u of users) {
    userNames[u.user_id] = u.metadata?.team_name ?? u.display_name;
  }

  // Build team rosters
  const teamRosters: TeamRoster[] = rosters.map(roster => {
    const ownerName = userNames[roster.owner_id] ?? `Roster ${roster.roster_id}`;
    const starterSet = new Set<string>(roster.starters ?? []);
    const playerIds = roster.players ?? [];

    const players: PlayerStat[] = playerIds.map(pid => {
      const info = allPlayers[pid];
      const name =
        info?.full_name ||
        [info?.first_name, info?.last_name].filter(Boolean).join(' ') ||
        pid;
      const position = info?.position ?? 'UNK';
      const nflTeam = info?.team ?? 'FA';

      return {
        playerId: pid,
        name,
        position,
        nflTeam,
        isStarter: starterSet.has(pid),
        prevYear: seasonTotals[pid] ?? {
          gp: 0,
          ptsPpr: 0,
          passYd: 0,
          passTd: 0,
          rushYd: 0,
          rushTd: 0,
          recYd: 0,
          recTd: 0,
          rec: 0,
        },
      };
    });

    return {
      rosterId: roster.roster_id,
      ownerName,
      players,
    };
  });

  // Sort by ownerName
  teamRosters.sort((a, b) => a.ownerName.localeCompare(b.ownerName));

  return NextResponse.json(teamRosters);
}
