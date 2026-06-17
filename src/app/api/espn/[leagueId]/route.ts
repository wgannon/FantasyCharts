import { NextRequest, NextResponse } from 'next/server';
import type { MatchupResult } from '@/types/fantasy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week') ?? '1';
  const year = searchParams.get('year') ?? '2024';

  const s2 = process.env.ESPN_S2;
  const swid = process.env.ESPN_SWID;

  if (!s2 || !swid) {
    return NextResponse.json(
      { error: 'ESPN_S2 and ESPN_SWID must be set in .env.local' },
      { status: 503 }
    );
  }

  const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/segments/0/leagues/${leagueId}?view=mMatchupScore&view=mTeam&scoringPeriodId=${week}`;

  const res = await fetch(url, {
    headers: {
      Cookie: `espn_s2=${s2}; SWID=${swid}`,
      'User-Agent': 'Mozilla/5.0',
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `ESPN returned ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const teams: Record<number, string> = {};
  for (const t of data.teams ?? []) {
    teams[t.id] = `${t.location} ${t.nickname}`.trim();
  }

  const weekNum = parseInt(week);
  const matchups: MatchupResult[] = (data.schedule ?? [])
    .filter((s: { matchupPeriodId: number }) => s.matchupPeriodId === weekNum)
    .map((s: { home: { teamId: number; totalPoints: number }; away: { teamId: number; totalPoints: number }; winner: string }) => ({
      week: weekNum,
      home: { id: String(s.home.teamId), name: teams[s.home.teamId] ?? `Team ${s.home.teamId}`, score: s.home.totalPoints ?? 0 },
      away: { id: String(s.away?.teamId), name: teams[s.away?.teamId] ?? `Team ${s.away?.teamId}`, score: s.away?.totalPoints ?? 0 },
      winner: s.winner === 'HOME' ? 'home' : s.winner === 'AWAY' ? 'away' : s.winner === 'TIE' ? 'tie' : 'pending',
    }));

  return NextResponse.json(matchups);
}
