'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/page.module.css';
import dashStyles from './PlayerHistoryDashboard.module.css';

// ── Types ────────────────────────────────────────────────────────────────────

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

interface Props {
  leagueId: string;
  leagueName: string;
  prevYear: number;
}

// ── Position ordering & grouping ─────────────────────────────────────────────

const POS_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

function posGroupKey(pos: string): string {
  return POS_ORDER.includes(pos) ? pos : 'Other';
}

function sortedGroups(players: PlayerStat[]): Array<{ pos: string; players: PlayerStat[] }> {
  const map = new Map<string, PlayerStat[]>();

  // Starters first within each position
  const starters = players.filter(p => p.isStarter);
  const bench = players.filter(p => !p.isStarter);

  for (const p of [...starters, ...bench]) {
    const key = posGroupKey(p.position);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }

  const orderedKeys = [...POS_ORDER.filter(k => map.has(k))];
  if (map.has('Other')) orderedKeys.push('Other');

  return orderedKeys.map(pos => ({ pos, players: map.get(pos)! }));
}

// ── Stat boxes per position ───────────────────────────────────────────────────

function StatBoxes({ player }: { player: PlayerStat }) {
  const { prevYear, position } = player;

  if (prevYear.gp === 0) {
    return <span className={dashStyles.noData}>No prior season data</span>;
  }

  const boxes: Array<{ label: string; value: string }> = [];

  // All positions: GP and PPR total
  boxes.push({ label: 'GP', value: String(prevYear.gp) });
  boxes.push({ label: 'FPTS', value: prevYear.ptsPpr.toFixed(1) });

  if (position === 'QB') {
    boxes.push({ label: 'Pass Yd', value: Math.round(prevYear.passYd).toLocaleString() });
    boxes.push({ label: 'Pass TD', value: String(prevYear.passTd) });
    boxes.push({ label: 'Rush Yd', value: Math.round(prevYear.rushYd).toLocaleString() });
  } else if (position === 'RB') {
    boxes.push({ label: 'Rush Yd', value: Math.round(prevYear.rushYd).toLocaleString() });
    boxes.push({ label: 'Rush TD', value: String(prevYear.rushTd) });
    boxes.push({ label: 'Rec', value: String(prevYear.rec) });
    boxes.push({ label: 'Rec Yd', value: Math.round(prevYear.recYd).toLocaleString() });
  } else if (position === 'WR' || position === 'TE') {
    boxes.push({ label: 'Rec', value: String(prevYear.rec) });
    boxes.push({ label: 'Rec Yd', value: Math.round(prevYear.recYd).toLocaleString() });
    boxes.push({ label: 'Rec TD', value: String(prevYear.recTd) });
  }
  // K/DEF and others: just GP + FPTS (already added above)

  return (
    <div className={dashStyles.statGrid}>
      {boxes.map(b => (
        <div key={b.label} className={dashStyles.statBox}>
          <span className={dashStyles.statLabel}>{b.label}</span>
          <span className={dashStyles.statValue}>{b.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Position badge CSS class ──────────────────────────────────────────────────

function posBadgeClass(pos: string): string {
  if (pos === 'QB') return dashStyles.QB;
  if (pos === 'RB') return dashStyles.RB;
  if (pos === 'WR') return dashStyles.WR;
  if (pos === 'TE') return dashStyles.TE;
  if (pos === 'K' || pos === 'DEF') return dashStyles.K;
  return dashStyles.other;
}

// ── Player card ───────────────────────────────────────────────────────────────

function PlayerCard({ player }: { player: PlayerStat }) {
  return (
    <div className={dashStyles.playerCard}>
      <div className={dashStyles.playerHeader}>
        <span className={`${dashStyles.posBadge} ${posBadgeClass(player.position)}`}>
          {player.position}
        </span>
        <span className={dashStyles.playerName}>{player.name}</span>
        <span className={dashStyles.nflTeam}>{player.nflTeam}</span>
        {player.isStarter && (
          <span className={dashStyles.starterBadge}>Starter</span>
        )}
      </div>
      <StatBoxes player={player} />
    </div>
  );
}

// ── Main dashboard component ──────────────────────────────────────────────────

export function PlayerHistoryDashboard({ leagueId, leagueName, prevYear }: Props) {
  const [rosters, setRosters] = useState<TeamRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/sleeper/${leagueId}/player-history?prevYear=${prevYear}`)
      .then(async r => {
        const text = await r.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Server error (${r.status})`);
        }
        if (!r.ok || (data as { error?: string })?.error) {
          throw new Error(
            (data as { error?: string })?.error ?? `Server error (${r.status})`
          );
        }
        setRosters(data as TeamRoster[]);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [leagueId, prevYear]);

  const activeTeam = rosters[activeTeamIdx] ?? null;

  return (
    <main className={styles.shell}>
      {/* Hero */}
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Sleeper · Player History</p>
          <h1>Roster Breakdown</h1>
          <p className={styles.lede}>
            {prevYear} regular season stats for every player on each roster in {leagueName}.
          </p>
        </div>
        <span className={styles.badge}>{prevYear} Stats</span>
      </header>

      {/* Loading / error */}
      {loading && <p className={styles.muted}>Loading rosters…</p>}
      {error && (
        <div className={dashStyles.errorBox}>
          <strong>Could not load data:</strong> {error}
        </div>
      )}

      {!loading && !error && rosters.length > 0 && (
        <>
          {/* Team selector */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.label}>Select Team</p>
                <h2>Teams</h2>
              </div>
            </div>
            <div className={dashStyles.teamSelect}>
              {rosters.map((team, idx) => (
                <button
                  key={team.rosterId}
                  className={`${dashStyles.teamBtn} ${idx === activeTeamIdx ? dashStyles.active : ''}`}
                  onClick={() => setActiveTeamIdx(idx)}
                >
                  {team.ownerName}
                </button>
              ))}
            </div>
          </section>

          {/* Active team roster */}
          {activeTeam && (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.label}>{prevYear} Previous Season Stats</p>
                  <h2>{activeTeam.ownerName}</h2>
                </div>
                <span className={styles.tag}>{activeTeam.players.length} Players</span>
              </div>

              {sortedGroups(activeTeam.players).map(group => (
                <div key={group.pos} className={dashStyles.posSection}>
                  <div className={dashStyles.posGroup}>{group.pos}</div>
                  {group.players.map(player => (
                    <PlayerCard key={player.playerId} player={player} />
                  ))}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
