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

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Cookie: `espn_s2=${s2}; SWID=${swid}`,
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
    });
  } catch (e) {
    return NextResponse.json({ error: `Could not reach ESPN: ${String(e)}` }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `ESPN returned ${res.status} — your ESPN_S2/ESPN_SWID cookies may be expired. Refresh them from your browser.` },
      { status: res.status }
    );
  }

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: 'ESPN returned non-JSON (cookies are likely expired — log into ESPN and copy fresh espn_s2 and SWID cookies)' },
      { status: 502 }
    );
  }

  const teams: Record<number, string> = {};
  for (const t of (data.teams as Array<{ id: number; location: string; nickname: string }> ?? [])) {
    teams[t.id] = `${t.location} ${t.nickname}`.trim();
  }

  const weekNum = parseInt(week);
  type EspnSlot = { home: { teamId: number; totalPoints: number }; away: { teamId: number; totalPoints: number }; winner: string; matchupPeriodId: number };
  const matchups: MatchupResult[] = ((data.schedule as EspnSlot[]) ?? [])
    .filter(s => s.matchupPeriodId === weekNum && s.away)
    .map(s => ({
      week: weekNum,
      home: { id: String(s.home.teamId), name: teams[s.home.teamId] ?? `Team ${s.home.teamId}`, score: s.home.totalPoints ?? 0 },
      away: { id: String(s.away.teamId), name: teams[s.away.teamId] ?? `Team ${s.away.teamId}`, score: s.away.totalPoints ?? 0 },
      winner: s.winner === 'HOME' ? 'home' : s.winner === 'AWAY' ? 'away' : s.winner === 'TIE' ? 'tie' : 'pending',
    }));

  return NextResponse.json(matchups);
}
