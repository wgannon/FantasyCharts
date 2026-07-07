import { readFileSync } from 'fs';
import path from 'path';
import type { LeagueConfig } from '@/types/fantasy';
import { PlayerHistoryDashboard } from '@/components/PlayerHistoryDashboard';

export default function RosterPage() {
  const leaguesPath = path.join(process.cwd(), 'data', 'leagues.json');
  const leagues: LeagueConfig[] = JSON.parse(readFileSync(leaguesPath, 'utf-8'));

  const sleeperLeague = leagues.find(l => l.source === 'sleeper');
  if (!sleeperLeague) {
    return (
      <main style={{ padding: '48px', color: 'var(--muted)' }}>
        No Sleeper league configured.
      </main>
    );
  }

  const prevYear = sleeperLeague.year - 1;

  return (
    <PlayerHistoryDashboard
      leagueId={sleeperLeague.id}
      leagueName={sleeperLeague.name}
      prevYear={prevYear}
    />
  );
}
