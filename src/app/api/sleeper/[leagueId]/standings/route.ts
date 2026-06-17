import { NextRequest, NextResponse } from 'next/server';
import type { StandingEntry } from '@/types/fantasy';

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_decimal: number;
    fpts_against: number;
    fpts_against_decimal: number;
  };
}

interface SleeperUser {
  user_id: string;
  display_name: string;
  metadata?: { team_name?: string };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  void request;

  const base = 'https://api.sleeper.app/v1/league';
  const [usersRes, rostersRes] = await Promise.all([
    fetch(`${base}/${leagueId}/users`, { cache: 'no-store' }),
    fetch(`${base}/${leagueId}/rosters`, { cache: 'no-store' }),
  ]);

  if (!usersRes.ok || !rostersRes.ok) {
    return NextResponse.json({ error: 'Sleeper API error' }, { status: 502 });
  }

  const [users, rosters]: [SleeperUser[], SleeperRoster[]] = await Promise.all([
    usersRes.json(),
    rostersRes.json(),
  ]);

  const userNames: Record<string, string> = {};
  for (const u of users) {
    userNames[u.user_id] = u.metadata?.team_name ?? u.display_name;
  }

  const standings: StandingEntry[] = rosters
    .map((r) => {
      const s = r.settings;
      return {
        rank: 0,
        teamId: String(r.roster_id),
        name: userNames[r.owner_id] ?? `Roster ${r.roster_id}`,
        wins: s?.wins ?? 0,
        losses: s?.losses ?? 0,
        ties: s?.ties ?? 0,
        pointsFor: (s?.fpts ?? 0) + (s?.fpts_decimal ?? 0) / 100,
        pointsAgainst: (s?.fpts_against ?? 0) + (s?.fpts_against_decimal ?? 0) / 100,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return NextResponse.json(standings);
}
