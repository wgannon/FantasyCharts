import { NextRequest, NextResponse } from 'next/server';
import type { MatchupResult } from '@/types/fantasy';

interface SleeperMatchup {
  matchup_id: number;
  roster_id: number;
  points: number;
}

interface SleeperUser {
  user_id: string;
  display_name: string;
  metadata?: { team_name?: string };
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const week = new URL(request.url).searchParams.get('week') ?? '1';

  const base = 'https://api.sleeper.app/v1/league';
  const [usersRes, rostersRes, matchupsRes] = await Promise.all([
    fetch(`${base}/${leagueId}/users`, { next: { revalidate: 300 } }),
    fetch(`${base}/${leagueId}/rosters`, { next: { revalidate: 300 } }),
    fetch(`${base}/${leagueId}/matchups/${week}`, { next: { revalidate: 300 } }),
  ]);

  if (!usersRes.ok || !rostersRes.ok || !matchupsRes.ok) {
    return NextResponse.json({ error: 'Sleeper API error' }, { status: 502 });
  }

  const [users, rosters, rawMatchups]: [SleeperUser[], SleeperRoster[], SleeperMatchup[] | null] =
    await Promise.all([usersRes.json(), rostersRes.json(), matchupsRes.json()]);

  // Sleeper returns null for weeks with no data
  const matchups: SleeperMatchup[] = Array.isArray(rawMatchups) ? rawMatchups : [];

  const userNames: Record<string, string> = {};
  for (const u of users) {
    userNames[u.user_id] = u.metadata?.team_name ?? u.display_name;
  }

  const rosterOwner: Record<number, string> = {};
  for (const r of rosters) {
    rosterOwner[r.roster_id] = userNames[r.owner_id] ?? `Roster ${r.roster_id}`;
  }

  const grouped: Record<number, SleeperMatchup[]> = {};
  for (const m of matchups) {
    if (m.matchup_id == null) continue; // bye week
    if (!grouped[m.matchup_id]) grouped[m.matchup_id] = [];
    grouped[m.matchup_id].push(m);
  }

  const weekNum = parseInt(week);
  const results: MatchupResult[] = [];
  for (const [, pair] of Object.entries(grouped)) {
    if (pair.length !== 2) continue;
    const [a, b] = pair;
    const aScore = a.points ?? 0;
    const bScore = b.points ?? 0;
    results.push({
      week: weekNum,
      home: { id: String(a.roster_id), name: rosterOwner[a.roster_id], score: aScore },
      away: { id: String(b.roster_id), name: rosterOwner[b.roster_id], score: bScore },
      winner: aScore > bScore ? 'home' : bScore > aScore ? 'away' : aScore === 0 && bScore === 0 ? 'pending' : 'tie',
    });
  }

  return NextResponse.json(results);
}
