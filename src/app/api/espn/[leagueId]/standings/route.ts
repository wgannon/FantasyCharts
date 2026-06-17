import { NextRequest, NextResponse } from 'next/server';
import type { StandingEntry } from '@/types/fantasy';

interface EspnTeam {
  id: number;
  location: string;
  nickname: string;
  record: {
    overall: {
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
      percentage: number;
    };
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const year = new URL(request.url).searchParams.get('year') ?? '2024';

  const s2 = process.env.ESPN_S2;
  const swid = process.env.ESPN_SWID;

  if (!s2 || !swid) {
    return NextResponse.json(
      { error: 'ESPN_S2 and ESPN_SWID must be set in .env.local' },
      { status: 503 }
    );
  }

  const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/segments/0/leagues/${leagueId}?view=mTeam&view=mStandings`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Cookie: `espn_s2=${s2}; SWID=${swid}`,
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
    });
  } catch (e) {
    return NextResponse.json({ error: `Could not reach ESPN: ${String(e)}` }, { status: 502 });
  }

  const text = await res.text();
  let data: { teams?: EspnTeam[] };
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: `ESPN returned non-JSON (status ${res.status}). Preview: ${text.slice(0, 200).replace(/\s+/g, ' ')}` },
      { status: 502 }
    );
  }

  const standings: StandingEntry[] = (data.teams ?? [])
    .map((t) => ({
      rank: 0,
      teamId: String(t.id),
      name: t.location && t.nickname ? `${t.location} ${t.nickname}`.trim() : `Team ${t.id}`,
      wins: t.record?.overall?.wins ?? 0,
      losses: t.record?.overall?.losses ?? 0,
      ties: t.record?.overall?.ties ?? 0,
      pointsFor: t.record?.overall?.pointsFor ?? 0,
      pointsAgainst: t.record?.overall?.pointsAgainst ?? 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return NextResponse.json(standings);
}
